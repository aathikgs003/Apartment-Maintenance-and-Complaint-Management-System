import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  updateStatus,
  closeComplaint,
  rateComplaint,
  getDelayedComplaints,
  getMyComplaintStats,
  autoAssignComplaint,
} from '../controllers/complaintController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { uploadMultiple } from '../middlewares/uploadMiddleware.js';
import {
  validateCreateComplaint,
  validateUpdateComplaint,
  validateAssignComplaint,
  validateUpdateStatus,
  validateRating,
} from '../middlewares/validator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ====================================
// RESIDENT ROUTES
// ====================================

/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint
 * @access  Private (Resident only)
 * @body    { category, description, priority }
 * @files   images (up to 5)
 */
router.post(
  '/',
  authorize(USER_ROLES.RESIDENT),
  uploadMultiple('images', 5),
  validateCreateComplaint,
  createComplaint
);

/**
 * @route   GET /api/complaints/my-stats
 * @desc    Get complaint statistics for current resident
 * @access  Private (Resident only)
 */
router.get(
  '/my-stats',
  authorize(USER_ROLES.RESIDENT),
  getMyComplaintStats
);

/**
 * @route   POST /api/complaints/:id/rate
 * @desc    Rate a completed complaint
 * @access  Private (Resident only)
 * @body    { rating, feedback }
 */
router.post(
  '/:id/rate',
  authorize(USER_ROLES.RESIDENT),
  validateRating,
  rateComplaint
);

// ====================================
// STAFF ROUTES
// ====================================

/**
 * @route   PUT /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private (Staff only)
 * @body    { status, remarks }
 * @files   proofImages (up to 3)
 */
router.put(
  '/:id/status',
  authorize(USER_ROLES.STAFF),
  uploadMultiple('proofImages', 3),
  validateUpdateStatus,
  updateStatus
);

// ====================================
// ADMIN ROUTES
// ====================================

/**
 * @route   GET /api/complaints/delayed
 * @desc    Get all delayed complaints
 * @access  Private (Admin only)
 */
router.get(
  '/delayed',
  authorize(USER_ROLES.ADMIN),
  getDelayedComplaints
);

/**
 * @route   PUT /api/complaints/:id/assign
 * @desc    Assign complaint to staff member
 * @access  Private (Admin only)
 * @body    { staffId, deadline, priority }
 */
router.put(
  '/:id/assign',
  authorize(USER_ROLES.ADMIN),
  validateAssignComplaint,
  assignComplaint
);

/**
 * @route   PUT /api/complaints/:id/auto-assign
 * @desc    Auto-assign complaint to best staff
 * @access  Private (Admin only)
 */
router.put(
  '/:id/auto-assign',
  authorize(USER_ROLES.ADMIN),
  autoAssignComplaint
);

/**
 * @route   PUT /api/complaints/:id/close
 * @desc    Close a completed complaint
 * @access  Private (Admin only)
 * @body    { remarks }
 */
router.put(
  '/:id/close',
  authorize(USER_ROLES.ADMIN),
  closeComplaint
);

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete a complaint
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(USER_ROLES.ADMIN),
  deleteComplaint
);

// ====================================
// SHARED ROUTES (Multiple roles)
// ====================================

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints (filtered by role)
 * @access  Private (All authenticated users)
 * @query   { page, limit, status, category, priority, isDelayed, search, sortBy, sortOrder, startDate, endDate }
 */
router.get('/', getComplaints);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get single complaint by ID
 * @access  Private (All authenticated users with access)
 */
router.get('/:id', getComplaintById);

/**
 * @route   PUT /api/complaints/:id
 * @desc    Update complaint details
 * @access  Private (Resident - own complaints, Admin - all)
 * @body    { description, category, priority }
 * @files   images (up to 5)
 */
router.put(
  '/:id',
  authorize(USER_ROLES.RESIDENT, USER_ROLES.ADMIN),
  uploadMultiple('images', 5),
  validateUpdateComplaint,
  updateComplaint
);

export default router;