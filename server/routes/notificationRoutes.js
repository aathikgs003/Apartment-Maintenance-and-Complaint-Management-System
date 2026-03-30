import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getNotificationById,
  getNotificationStats,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ====================================
// NOTIFICATION ROUTES
// ====================================

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 * @query   { page, limit, unreadOnly }
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics for user
 * @access  Private
 */
router.get('/stats', getNotificationStats);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/clear-read
 * @desc    Delete all read notifications
 * @access  Private
 */
router.delete('/clear-read', clearReadNotifications);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification by ID
 * @access  Private
 */
router.get('/:id', getNotificationById);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.put('/:id/read', markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

export default router;