import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AUTH } from '../config/constants.js';

// ====================================
// JWT TOKEN GENERATION
// ====================================

/**
 * @desc    Generate JWT token for authentication
 * @param   {object} payload - Data to encode in token
 * @param   {string} expiresIn - Token expiry time (default: 7d)
 * @returns {string} - JWT token
 */
export const generateJWT = (payload, expiresIn = AUTH.JWT_EXPIRE) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: 'apartment-maintenance-system',
    audience: 'ams-users',
  });
};

/**
 * @desc    Generate JWT token for user
 * @param   {object} user - User object
 * @returns {string} - JWT token
 */
export const generateUserToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  return generateJWT(payload);
};

/**
 * @desc    Verify JWT token
 * @param   {string} token - JWT token to verify
 * @returns {object} - Decoded token payload
 */
export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'apartment-maintenance-system',
      audience: 'ams-users',
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * @desc    Decode JWT token without verification
 * @param   {string} token - JWT token to decode
 * @returns {object} - Decoded token payload
 */
export const decodeJWT = (token) => {
  return jwt.decode(token);
};

/**
 * @desc    Check if JWT token is expired
 * @param   {string} token - JWT token to check
 * @returns {boolean} - True if expired
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * @desc    Get token expiry date
 * @param   {string} token - JWT token
 * @returns {Date|null} - Expiry date or null
 */
export const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * @desc    Generate refresh token
 * @param   {object} user - User object
 * @returns {string} - Refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    type: 'refresh',
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'apartment-maintenance-system',
  });
};

/**
 * @desc    Verify refresh token
 * @param   {string} token - Refresh token
 * @returns {object} - Decoded payload
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        issuer: 'apartment-maintenance-system',
      }
    );

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// ====================================
// RANDOM TOKEN GENERATION
// ====================================

/**
 * @desc    Generate random token (for password reset, email verification, etc.)
 * @param   {number} bytes - Number of random bytes (default: 32)
 * @returns {string} - Random hex token
 */
export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * @desc    Generate hashed token (for storing in database)
 * @param   {string} token - Plain token
 * @returns {string} - Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * @desc    Generate password reset token
 * @returns {object} - { token, hashedToken, expires }
 */
export const generatePasswordResetToken = () => {
  // Generate random token
  const resetToken = generateRandomToken();

  // Hash token for storage
  const hashedToken = hashToken(resetToken);

  // Set expiry (1 hour)
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  return {
    token: resetToken,
    hashedToken,
    expires,
  };
};

/**
 * @desc    Generate email verification token
 * @returns {object} - { token, hashedToken, expires }
 */
export const generateEmailVerificationToken = () => {
  // Generate random token
  const verificationToken = generateRandomToken();

  // Hash token for storage
  const hashedToken = hashToken(verificationToken);

  // Set expiry (24 hours)
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    token: verificationToken,
    hashedToken,
    expires,
  };
};

// ====================================
// OTP GENERATION
// ====================================

/**
 * @desc    Generate numeric OTP
 * @param   {number} length - OTP length (default: 6)
 * @returns {string} - Numeric OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
};

/**
 * @desc    Generate alphanumeric code
 * @param   {number} length - Code length (default: 8)
 * @returns {string} - Alphanumeric code
 */
export const generateAlphanumericCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
};

// ====================================
// UNIQUE ID GENERATION
// ====================================

/**
 * @desc    Generate unique complaint ID
 * @returns {string} - Unique complaint ID (e.g., CMPL-1A2B3C4D)
 */
export const generateComplaintId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CMPL${timestamp}${random}`;
};

/**
 * @desc    Generate unique user ID
 * @param   {string} role - User role
 * @returns {string} - Unique user ID
 */
export const generateUserId = (role) => {
  const prefix = role.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * @desc    Generate unique reference number
 * @param   {string} prefix - Reference prefix
 * @returns {string} - Unique reference number
 */
export const generateReferenceNumber = (prefix = 'REF') => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${year}${month}${day}${random}`;
};

// ====================================
// SESSION TOKEN GENERATION
// ====================================

/**
 * @desc    Generate session token
 * @returns {object} - { sessionId, token, expires }
 */
export const generateSessionToken = () => {
  const sessionId = crypto.randomUUID();
  const token = generateRandomToken(64);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    sessionId,
    token,
    expires,
  };
};

/**
 * @desc    Generate API key
 * @param   {string} prefix - API key prefix
 * @returns {object} - { key, hashedKey }
 */
export const generateAPIKey = (prefix = 'ams') => {
  const key = `${prefix}_${generateRandomToken(32)}`;
  const hashedKey = hashToken(key);

  return {
    key,
    hashedKey,
  };
};

// ====================================
// COOKIE TOKEN UTILITIES
// ====================================

/**
 * @desc    Generate cookie options for token
 * @param   {boolean} rememberMe - Extended expiry if true
 * @returns {object} - Cookie options
 */
export const getCookieOptions = (rememberMe = false) => {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : AUTH.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000; // Default from constants

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge,
    path: '/',
  };
};

/**
 * @desc    Generate token response with cookie
 * @param   {object} user - User object
 * @param   {boolean} rememberMe - Extended expiry
 * @returns {object} - { token, cookieOptions, user }
 */
export const generateTokenResponse = (user, rememberMe = false) => {
  const token = generateUserToken(user);
  const cookieOptions = getCookieOptions(rememberMe);

  return {
    token,
    cookieOptions,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// ====================================
// EXPORT ALL FUNCTIONS
// ====================================

export default {
  // JWT
  generateJWT,
  generateUserToken,
  verifyJWT,
  decodeJWT,
  isTokenExpired,
  getTokenExpiry,
  generateRefreshToken,
  verifyRefreshToken,

  // Random tokens
  generateRandomToken,
  hashToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,

  // OTP
  generateOTP,
  generateAlphanumericCode,

  // Unique IDs
  generateComplaintId,
  generateUserId,
  generateReferenceNumber,

  // Session
  generateSessionToken,
  generateAPIKey,

  // Cookie
  getCookieOptions,
  generateTokenResponse,
};