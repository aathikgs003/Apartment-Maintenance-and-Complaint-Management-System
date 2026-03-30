import Notification from '../models/Notification.js';
import {
  MESSAGES,
  HTTP_STATUS,
  PAGINATION,
} from '../config/constants.js';

// ====================================
// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
// ====================================
export const getNotifications = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      unreadOnly,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { userId: req.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('complaintId', 'complaintId category status');

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        unreadCount,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
// ====================================
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ====================================
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOTIFICATION_NOT_FOUND,
      });
    }

    await notification.markAsRead();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.NOTIFICATION_READ,
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ====================================
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.ALL_NOTIFICATIONS_READ,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
// ====================================
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOTIFICATION_NOT_FOUND,
      });
    }

    await notification.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
// ====================================
export const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.id,
      isRead: true,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.deletedCount} read notifications cleared`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
// ====================================
export const getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate('complaintId', 'complaintId category status description');

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOTIFICATION_NOT_FOUND,
      });
    }

    // Mark as read when viewed
    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification retrieved successfully',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
// ====================================
export const getNotificationStats = async (req, res, next) => {
  try {
    const stats = await Notification.getStats(req.user.id);

    // Get type-wise breakdown
    const typeBreakdown = await Notification.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification statistics retrieved successfully',
      data: {
        stats,
        typeBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export all controllers
export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getNotificationById,
  getNotificationStats,
};