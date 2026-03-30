import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
} from '../middlewares/validator.js';
import { googleAuth } from '../controllers/authController.js';

const router = express.Router();

// ====================================
// PUBLIC ROUTES
// ====================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { name, email, password, role, flatNumber, phone, expertise }
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /api/auth/google
 * @desc    Sign in / Register using Google ID token
 * @access  Public
 * @body    { id_token }
 */
router.post('/google', googleAuth);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send OTP for password reset
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP
 * @access  Public
 * @body    { email, otp }
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using verified OTP
 * @access  Public
 * @body    { email, newPassword, confirmPassword }
 */
router.post('/reset-password', resetPassword);

// ====================================
// PROTECTED ROUTES
// ====================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get('/verify', protect, verifyToken);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile
 * @access  Private
 * @body    { name, phone, flatNumber, expertise }
 * @file    profileImage (optional)
 */
router.put(
  '/update-profile',
  protect,
  uploadSingle('profileImage'),
  validateUpdateProfile,
  updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/change-password', protect, validateChangePassword, changePassword);

export default router;