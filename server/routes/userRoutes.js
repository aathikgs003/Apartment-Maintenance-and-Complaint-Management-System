import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAvailableStaff,
  toggleUserStatus,
  resetUserPassword,
  getUserCounts,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
} from '../middlewares/validator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize(USER_ROLES.ADMIN));

// ====================================
// USER MANAGEMENT ROUTES
// ====================================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only)
 * @query   { page, limit, role, isActive, search, sortBy, sortOrder }
 */
router.get('/', getUsers);

/**
 * @route   GET /api/users/counts
 * @desc    Get user counts by role
 * @access  Private (Admin only)
 */
router.get('/counts', getUserCounts);

/**
 * @route   GET /api/users/staff/available
 * @desc    Get available staff members with workload info
 * @access  Private (Admin only)
 * @query   { expertise, sortByRating }
 */
router.get('/staff/available', getAvailableStaff);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID with statistics
 * @access  Private (Admin only)
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 * @body    { name, email, password, role, flatNumber, phone, expertise, isActive }
 * @file    profileImage (optional)
 */
router.post(
  '/',
  uploadSingle('profileImage'),
  validateCreateUser,
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user details
 * @access  Private (Admin only)
 * @body    { name, email, role, flatNumber, phone, expertise, isActive }
 * @file    profileImage (optional)
 */
router.put(
  '/:id',
  uploadSingle('profileImage'),
  validateUpdateUser,
  updateUser
);

/**
 * @route   PUT /api/users/:id/toggle-status
 * @desc    Toggle user active/inactive status
 * @access  Private (Admin only)
 */
router.put('/:id/toggle-status', toggleUserStatus);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin only)
 * @body    { newPassword }
 */
router.put(
  '/:id/reset-password',
  validateResetPassword,
  resetUserPassword
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin only)
 */
router.delete('/:id', deleteUser);

export default router;