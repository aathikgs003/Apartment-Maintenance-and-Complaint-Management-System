import mongoose from 'mongoose';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPES_ARRAY,
  DEFAULTS,
} from '../config/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: NOTIFICATION_TYPES_ARRAY,
        message: 'Invalid notification type',
      },
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    isRead: {
      type: Boolean,
      default: DEFAULTS.IS_READ,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ====================================
// INDEXES
// ====================================

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ complaintId: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

// TTL index to auto-delete old notifications after 30 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days
);

// ====================================
// VIRTUAL FIELDS
// ====================================

// Get time ago string
notificationSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Get icon based on type
notificationSchema.virtual('icon').get(function () {
  const icons = {
    [NOTIFICATION_TYPES.COMPLAINT_RAISED]: 'plus-circle',
    [NOTIFICATION_TYPES.STAFF_ASSIGNED]: 'user-check',
    [NOTIFICATION_TYPES.STATUS_UPDATED]: 'refresh-cw',
    [NOTIFICATION_TYPES.DEADLINE_EXCEEDED]: 'alert-triangle',
    [NOTIFICATION_TYPES.WORK_COMPLETED]: 'check-circle',
    [NOTIFICATION_TYPES.COMPLAINT_CLOSED]: 'check-square',
    [NOTIFICATION_TYPES.RATING_RECEIVED]: 'star',
  };
  return icons[this.type] || 'bell';
});

// Get color based on type
notificationSchema.virtual('color').get(function () {
  const colors = {
    [NOTIFICATION_TYPES.COMPLAINT_RAISED]: 'blue',
    [NOTIFICATION_TYPES.STAFF_ASSIGNED]: 'purple',
    [NOTIFICATION_TYPES.STATUS_UPDATED]: 'cyan',
    [NOTIFICATION_TYPES.DEADLINE_EXCEEDED]: 'red',
    [NOTIFICATION_TYPES.WORK_COMPLETED]: 'green',
    [NOTIFICATION_TYPES.COMPLAINT_CLOSED]: 'emerald',
    [NOTIFICATION_TYPES.RATING_RECEIVED]: 'yellow',
  };
  return colors[this.type] || 'gray';
});

// ====================================
// INSTANCE METHODS
// ====================================

// Mark as read
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Get formatted notification
notificationSchema.methods.getFormatted = function () {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    message: this.message,
    isRead: this.isRead,
    timeAgo: this.timeAgo,
    icon: this.icon,
    color: this.color,
    complaintId: this.complaintId,
    createdAt: this.createdAt,
  };
};

// ====================================
// STATIC METHODS
// ====================================

// Create notification with proper message
notificationSchema.statics.createNotification = async function ({
  userId,
  type,
  complaintId = null,
  complaintNumber = '',
  staffName = '',
  residentName = '',
  category = '',
  status = '',
  rating = 0,
  metadata = {},
}) {
  const messages = {
    [NOTIFICATION_TYPES.COMPLAINT_RAISED]: {
      title: 'New Complaint Raised',
      message: `A new ${category} complaint (${complaintNumber}) has been raised${residentName ? ` by ${residentName}` : ''}.`,
    },
    [NOTIFICATION_TYPES.STAFF_ASSIGNED]: {
      title: 'Complaint Assigned',
      message: `Your complaint ${complaintNumber} has been assigned to ${staffName}.`,
    },
    [NOTIFICATION_TYPES.STATUS_UPDATED]: {
      title: 'Status Updated',
      message: `Complaint ${complaintNumber} status changed to "${status}".`,
    },
    [NOTIFICATION_TYPES.DEADLINE_EXCEEDED]: {
      title: 'Deadline Exceeded',
      message: `Complaint ${complaintNumber} has exceeded its deadline.`,
    },
    [NOTIFICATION_TYPES.WORK_COMPLETED]: {
      title: 'Work Completed',
      message: `Work on complaint ${complaintNumber} has been marked as completed.`,
    },
    [NOTIFICATION_TYPES.COMPLAINT_CLOSED]: {
      title: 'Complaint Closed',
      message: `Your complaint ${complaintNumber} has been verified and closed.`,
    },
    [NOTIFICATION_TYPES.RATING_RECEIVED]: {
      title: 'New Rating Received',
      message: `You received a ${rating}-star rating for complaint ${complaintNumber}.`,
    },
  };

  const { title, message } = messages[type] || {
    title: 'Notification',
    message: 'You have a new notification.',
  };

  const notification = await this.create({
    userId,
    type,
    title,
    message,
    complaintId,
    metadata,
  });

  return notification;
};

// Get notifications for user
notificationSchema.statics.getForUser = function (userId, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;
  
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('complaintId', 'complaintId category status');
};

// Get unread count for user
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Mark all as read for user
notificationSchema.statics.markAllAsRead = async function (userId) {
  const result = await this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return result;
};

// Delete old read notifications (older than 7 days)
notificationSchema.statics.cleanOldNotifications = async function (daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    isRead: true,
    createdAt: { $lt: cutoffDate },
  });

  return result;
};

// Get notification statistics for user
notificationSchema.statics.getStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] },
        },
        read: {
          $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || { total: 0, unread: 0, read: 0 };
};

// Bulk create notifications (for multiple users)
notificationSchema.statics.createBulk = async function (notifications) {
  return this.insertMany(notifications);
};

// Get notifications by complaint
notificationSchema.statics.getByComplaint = function (complaintId) {
  return this.find({ complaintId }).sort({ createdAt: -1 });
};

// ====================================
// CREATE AND EXPORT MODEL
// ====================================

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;