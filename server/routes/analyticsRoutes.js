import express from 'express';
import {
  getDashboardStats,
  getStaffPerformance,
  getComplaintsTrend,
  getCategoryAnalytics,
  getDelayAnalytics,
  getRatingAnalytics,
} from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize(USER_ROLES.ADMIN));

// ====================================
// ANALYTICS ROUTES
// ====================================

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard statistics
 * @access  Private (Admin only)
 * @query   { startDate, endDate }
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/analytics/staff-performance
 * @desc    Get staff performance metrics
 * @access  Private (Admin only)
 * @query   { startDate, endDate, sortBy, order }
 */
router.get('/staff-performance', getStaffPerformance);

/**
 * @route   GET /api/analytics/complaints-trend
 * @desc    Get complaints trend over time
 * @access  Private (Admin only)
 * @query   { days, groupBy }
 */
router.get('/complaints-trend', getComplaintsTrend);

/**
 * @route   GET /api/analytics/categories
 * @desc    Get category-wise complaint analytics
 * @access  Private (Admin only)
 * @query   { startDate, endDate }
 */
router.get('/categories', getCategoryAnalytics);

/**
 * @route   GET /api/analytics/delays
 * @desc    Get delay analytics
 * @access  Private (Admin only)
 */
router.get('/delays', getDelayAnalytics);

/**
 * @route   GET /api/analytics/ratings
 * @desc    Get rating analytics
 * @access  Private (Admin only)
 */
router.get('/ratings', getRatingAnalytics);

export default router;