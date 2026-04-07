import User from '../models/User.js';
import {
  AUTH,
  MESSAGES,
  HTTP_STATUS,
  USER_ROLES,
} from '../config/constants.js';
import { uploadFromBuffer, deleteImage } from '../config/cloudinary.js';
import { OAuth2Client } from 'google-auth-library';
import PasswordResetToken from '../models/PasswordResetToken.js';
import sendEmail from '../utils/mailer.js';
import { otpEmailTemplate } from '../utils/emailTemplates.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ====================================
// HELPER FUNCTIONS
// ====================================

// Send token response with cookie
const sendTokenResponse = (user, statusCode, res, message) => {
  // Generate token
  const token = user.generateAuthToken();

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + AUTH.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  // Get user profile without password
  const userProfile = user.getPublicProfile();

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: userProfile,
        token,
      },
    });
};

// ====================================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ====================================
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, flatNumber, phone, expertise } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: MESSAGES.ERROR.EMAIL_EXISTS,
      });
    }

    // Validate role
    const allowedRoles = [USER_ROLES.RESIDENT, USER_ROLES.STAFF];
    const userRole = role && allowedRoles.includes(role) ? role : USER_ROLES.RESIDENT;

    // Build user data
    const userData = {
      name,
      email,
      password,
      role: userRole,
      phone,
    };

    // Add role-specific fields
    if (userRole === USER_ROLES.RESIDENT) {
      if (!flatNumber) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Flat number is required for residents',
        });
      }
      userData.flatNumber = flatNumber;
    }

    if (userRole === USER_ROLES.STAFF && expertise) {
      userData.expertise = Array.isArray(expertise) ? expertise : [expertise];
    }

    // Create user
    const user = await User.create(userData);

    // Update last login
    await user.updateLastLogin();

    // Send token response
    sendTokenResponse(user, HTTP_STATUS.CREATED, res, MESSAGES.SUCCESS.REGISTERED);
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ====================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.INVALID_CREDENTIALS,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.INVALID_CREDENTIALS,
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Send token response
    sendTokenResponse(user, HTTP_STATUS.OK, res, MESSAGES.SUCCESS.LOGGED_IN);
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
// ====================================
export const logout = async (req, res, next) => {
  try {
    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.LOGGED_OUT,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
// ====================================
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
// ====================================
export const updateProfile = async (req, res, next) => {
  try {
    // Debug info: capture incoming request details to help diagnose failures
    console.debug('[updateProfile] user:', req.user && req.user.id ? req.user.id : 'no-user');
    console.debug('[updateProfile] body keys:', Object.keys(req.body || {}));
    console.debug('[updateProfile] has file:', !!req.file, req.file ? { originalname: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : null);

    const { name, phone, flatNumber, expertise, role } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    // Allow role selection only during initial setup
    if (!user.isProfileCompleted && role) {
      if (role === USER_ROLES.RESIDENT || role === USER_ROLES.STAFF) {
        user.role = role;
        console.debug('[updateProfile] Updated role to:', role);
      }
    }

    // Update allowed fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Check if profile completion requirements are met
    const canCompleteProfile = () => {
      const hasBasicInfo = user.name && user.phone;
      if (!hasBasicInfo) return false;
      
      if (user.role === USER_ROLES.RESIDENT) return !!flatNumber || !!user.flatNumber;
      if (user.role === USER_ROLES.STAFF) return (expertise && expertise.length > 0) || (user.expertise && user.expertise.length > 0);
      return true;
    };

    console.debug('[updateProfile] canCompleteProfile:', canCompleteProfile(), 'currentUserProfileCompleted:', user.isProfileCompleted);

    // Update role-specific fields
    if (user.role === USER_ROLES.RESIDENT && flatNumber) {
      user.flatNumber = flatNumber;
    }

    if (user.role === USER_ROLES.STAFF && expertise) {
      user.expertise = Array.isArray(expertise) ? expertise : [expertise];
    }

    // Complete profile if it's the first time
    if (!user.isProfileCompleted && canCompleteProfile()) {
      user.isProfileCompleted = true;
      console.debug('[updateProfile] Setting isProfileCompleted to true');
    }

    // Handle profile image upload
    if (req.file) {
      // Delete old image if exists
      if (user.profileImagePublicId) {
        await deleteImage(user.profileImagePublicId);
      }

      // Upload new image (handle failures gracefully)
      try {
        const result = await uploadFromBuffer(req.file.buffer, {
          folder: 'apartment-maintenance/profiles',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          ],
        });

        // uploadFromBuffer may either resolve with { success: false } or throw an object
        if (!result || result.success === false) {
          console.error('Profile upload failed:', result);
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Failed to upload profile image',
            error: result?.error || 'upload_failed',
          });
        }

        user.profileImage = result.url;
        user.profileImagePublicId = result.publicId;
      } catch (uploadErr) {
        console.error('Profile upload exception:', uploadErr);
        const errMsg = (uploadErr && uploadErr.error) || (uploadErr && uploadErr.message) || 'Error uploading image';
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Failed to upload profile image',
          error: errMsg,
        });
      }
    }

    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.PROFILE_UPDATED,
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ====================================
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ERROR.PASSWORD_MISMATCH,
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send new token
    sendTokenResponse(user, HTTP_STATUS.OK, res, MESSAGES.SUCCESS.PASSWORD_CHANGED);
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Verify token validity
// @route   GET /api/auth/verify
// @access  Private
// ====================================
export const verifyToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.INVALID_TOKEN,
      });
    }

    if (!user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Google Sign-In (ID token)
// @route   POST /api/auth/google
// @access  Public
// ====================================
export const googleAuth = async (req, res, next) => {
  try {
    const id_token = req.body.id_token || req.body.credential;
    console.debug('[googleAuth] incoming body keys:', Object.keys(req.body), 'id_token present:', !!id_token);

    if (!id_token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No ID token provided',
      });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify ID token
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid ID token',
      });
    }

    const email = payload.email.toLowerCase();
    const profile = {
      googleId: payload.sub,
      email,
      name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
      avatar: payload.picture || null,
    };

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      user.googleId = user.googleId || profile.googleId;
      user.avatar = profile.avatar || user.avatar;
      user.isVerified = true;
      if (!user.isActive) user.isActive = true;
      await user.save();

      await user.updateLastLogin();
      return sendTokenResponse(user, HTTP_STATUS.OK, res, MESSAGES.SUCCESS.LOGGED_IN);
    }

    // Create new resident user
    const newUserData = {
      name: profile.name || 'Google User',
      email,
      role: USER_ROLES.RESIDENT,
      flatNumber: 'G-PENDING',
      phone: undefined,
      googleId: profile.googleId,
      avatar: profile.avatar,
      isVerified: true,
      isProfileCompleted: false,
    };

    user = await User.create(newUserData);
    await user.updateLastLogin();

    return sendTokenResponse(user, HTTP_STATUS.CREATED, res, MESSAGES.SUCCESS.REGISTERED);
  } catch (error) {
    // If token verification fails, give clear error
    if (error && error.message && error.message.includes('invalid_token')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Invalid ID token' });
    }
    next(error);
  }
};

// ====================================
// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
// ====================================
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please provide your email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal user existence
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'If an account exists with this email, an OTP will be sent.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before saving
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Delete existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Save new token
    await PasswordResetToken.create({
      userId: user._id,
      token: hashedOtp,
    });

    // Send email
    const emailResult = await sendEmail(
      user.email,
      'Password Reset OTP - Apartment Maintenance System',
      otpEmailTemplate(otp, user.name)
    );

    if (!emailResult.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send OTP email',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'OTP sent to your email address',
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ====================================
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid request',
      });
    }

    const tokenRecord = await PasswordResetToken.findOne({ userId: user._id });

    if (!tokenRecord) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Check attempts
    if (tokenRecord.attempts >= 3) {
      await PasswordResetToken.deleteOne({ _id: tokenRecord._id });
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, tokenRecord.token);
    if (!isMatch) {
      tokenRecord.attempts += 1;
      await tokenRecord.save();
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Mark as verified
    tokenRecord.isVerified = true;
    await tokenRecord.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
// ====================================
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid request',
      });
    }

    // Check for verified token
    const tokenRecord = await PasswordResetToken.findOne({
      userId: user._id,
      isVerified: true
    });

    if (!tokenRecord) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'OTP verification required before resetting password',
      });
    }

    // Update password (hashing happens in pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Delete token
    await PasswordResetToken.deleteOne({ _id: tokenRecord._id });

    // Send confirmation email (optional but good practice)
    // await sendEmail(user.email, 'Password Reset Successful', passwordResetSuccessTemplate(user.name));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

// Export all controllers (including googleAuth)
export default {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
  googleAuth,
  forgotPassword,
  verifyOtp,
  resetPassword,
};