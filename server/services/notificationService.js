import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import sendEmail from '../utils/mailer.js';
import {
  complaintRaisedTemplate,
  staffAssignedResidentTemplate,
  workCompletedTemplate,
  staffNotificationTemplate,
  statusUpdateTemplate,
  complaintClosedTemplate,
} from '../utils/emailTemplates.js';
import {
  NOTIFICATION_TYPES,
  USER_ROLES,
} from '../config/constants.js';

// ====================================
// NOTIFICATION CREATION FUNCTIONS
// ====================================

/**
 * @desc    Create a notification and optionally send email
 * @param   {object} options - Notification options
 * @returns {Promise<object>} - Created notification
 */
export const createNotification = async (options) => {
  const {
    userId,
    type,
    complaintId = null,
    complaintNumber = '',
    staffName = '',
    residentName = '',
    category = '',
    status = '',
    rating = 0,
    deadline = null,
    remarks = '',
    sendEmailNotification = true,
    metadata = {},
    staffPhone = '',
    residentPhone = '',
    flatNumber = '',
    priority = '',
  } = options;

  try {
    // Build notification message based on type
    const notificationContent = getNotificationContent(type, {
      complaintNumber,
      staffName,
      residentName,
      category,
      status,
      rating,
      deadline,
      remarks,
    });

    // Create notification in database
    const notification = await Notification.create({
      userId,
      type,
      title: notificationContent.title,
      message: notificationContent.message,
      complaintId,
      metadata: {
        ...metadata,
        complaintNumber,
        staffName,
        residentName,
        category,
        status,
        rating,
        staffPhone,
        residentPhone,
        flatNumber,
        priority,
      },
    });

    // Populate complaint details
    if (complaintId) {
      await notification.populate('complaintId', 'complaintId category status');
    }

    // Send email notification if enabled
    if (sendEmailNotification) {
      await sendEmailForNotification(userId, type, {
        complaintId: complaintNumber,
        complaintNumber,
        staffName,
        residentName,
        category,
        status,
        rating,
        deadline,
        remarks,
        staffPhone,
        residentPhone,
        flatNumber,
        priority,
      });
    }

    console.log(`✅ Notification created: ${type} for user ${userId}`);

    return {
      success: true,
      notification,
    };
  } catch (error) {
    console.error('❌ Error creating notification:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Get notification content based on type
 * @param   {string} type - Notification type
 * @param   {object} data - Data for message
 * @returns {object} - { title, message }
 */
const getNotificationContent = (type, data) => {
  const {
    complaintNumber,
    staffName,
    residentName,
    category,
    status,
    rating,
    deadline,
    remarks,
  } = data;

  const templates = {
    [NOTIFICATION_TYPES.COMPLAINT_RAISED]: {
      title: 'New Complaint Raised',
      message: `A new ${category} complaint (${complaintNumber}) has been raised${residentName ? ` by ${residentName}` : ''}.`,
    },
    [NOTIFICATION_TYPES.STAFF_ASSIGNED]: {
      title: 'Complaint Assigned',
      message: staffName
        ? `Your complaint ${complaintNumber} has been assigned to ${staffName}.`
        : `A new complaint ${complaintNumber} has been assigned to you.`,
    },
    [NOTIFICATION_TYPES.STATUS_UPDATED]: {
      title: 'Status Updated',
      message: `Complaint ${complaintNumber} status has been updated to "${status}".${remarks ? ` Remarks: ${remarks}` : ''}`,
    },
    [NOTIFICATION_TYPES.DEADLINE_EXCEEDED]: {
      title: '⚠️ Deadline Exceeded',
      message: `Complaint ${complaintNumber} has exceeded its deadline. Immediate attention required!`,
    },
    [NOTIFICATION_TYPES.WORK_COMPLETED]: {
      title: 'Work Completed',
      message: `Work on your complaint ${complaintNumber} has been marked as completed.${remarks ? ` Remarks: ${remarks}` : ''} Please review and rate the service.`,
    },
    [NOTIFICATION_TYPES.COMPLAINT_CLOSED]: {
      title: 'Complaint Closed',
      message: `Your complaint ${complaintNumber} has been verified and closed. Thank you for using our services.`,
    },
    [NOTIFICATION_TYPES.RATING_RECEIVED]: {
      title: 'New Rating Received',
      message: `You received a ${rating}-star rating for complaint ${complaintNumber}.`,
    },
    [NOTIFICATION_TYPES.PAYMENT_PENDING]: {
      title: 'Payment Required',
      message: `Payment is pending for complaint ${complaintNumber}. Please check details and complete the process.`,
    },
    [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
      title: 'Payment Received',
      message: `We have successfully received payment for complaint ${complaintNumber}.`,
    },
    [NOTIFICATION_TYPES.PAYMENT_COMPLETED]: {
      title: 'Payment Processed',
      message: `Payment for complaint ${complaintNumber} has been verified and completed.`,
    },
  };

  return templates[type] || {
    title: 'Notification',
    message: 'You have a new notification.',
  };
};

/**
 * @desc    Send email for notification
 * @param   {string} userId - User ID
 * @param   {string} type - Notification type
 * @param   {object} data - Email data
 */
const sendEmailForNotification = async (userId, type, data) => {
  try {
    // Get user email
    const user = await User.findById(userId).select('email name');
    if (!user || !user.email) {
      console.log('User email not found, skipping email notification');
      return;
    }

    // Map notification type to email template
    const templateMap = {
      [NOTIFICATION_TYPES.COMPLAINT_RAISED]: 'complaintRaised',
      [NOTIFICATION_TYPES.STAFF_ASSIGNED]: 'staffAssigned',
      [NOTIFICATION_TYPES.STATUS_UPDATED]: 'statusUpdate',
      [NOTIFICATION_TYPES.DEADLINE_EXCEEDED]: 'deadlineExceeded',
      [NOTIFICATION_TYPES.WORK_COMPLETED]: 'workCompleted',
      [NOTIFICATION_TYPES.COMPLAINT_CLOSED]: 'complaintClosed',
      [NOTIFICATION_TYPES.PAYMENT_PENDING]: 'statusUpdate',
      [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: 'statusUpdate',
      [NOTIFICATION_TYPES.PAYMENT_COMPLETED]: 'statusUpdate',
    };

    const template = templateMap[type];
    if (!template) {
      console.log(`No email template for notification type: ${type}`);
      return;
    }

    // Build email content
    const notificationContent = getNotificationContent(type, data);
    let subject = notificationContent.title;
    let html = '';
    let text = notificationContent.message;

    if (template === 'complaintRaised') {
      html = complaintRaisedTemplate({
        complaintId: data.complaintId || data.complaintNumber,
        category: data.category,
        description: data.description || '',
        residentId: { name: data.residentName, email: user.email },
        createdAt: Date.now(),
      });
      subject = `New Complaint Raised - ${data.complaintNumber || data.complaintId}`;
    } else if (template === 'staffAssigned') {
      // Determine if receiver is staff or resident
      const isStaffRecipient = !!data.residentPhone; // Only staff receive the resident's phone

      if (isStaffRecipient) {
        html = staffNotificationTemplate({
          complaintId: data.complaintId || data.complaintNumber,
          complaintNumber: data.complaintNumber,
          residentName: data.residentName,
          flatNumber: data.flatNumber,
          residentPhone: data.residentPhone,
          category: data.category,
          priority: data.priority,
          deadline: data.deadline,
        });
        subject = `New Job Assigned: #${data.complaintNumber}`;
      } else {
        html = staffAssignedResidentTemplate(
          { name: data.staffName, phone: data.staffPhone },
          { complaintId: data.complaintNumber, residentId: { name: user.name } }
        );
        subject = `Maintenance Staff Assigned - ${data.complaintNumber}`;
      }
    } else if (template === 'statusUpdate') {
      html = statusUpdateTemplate({
        complaintId: data.complaintId,
        complaintNumber: data.complaintNumber,
        status: data.status,
        remarks: data.remarks,
      });
    } else if (template === 'workCompleted') {
      html = workCompletedTemplate({ complaintNumber: data.complaintNumber, residentId: { name: user.name } });
      subject = `Work Completed - ${data.complaintNumber}`;
    } else if (template === 'complaintClosed') {
      html = complaintClosedTemplate({
        complaintNumber: data.complaintNumber,
        remarks: data.remarks,
      });
      subject = `Complaint Closed - ${data.complaintNumber}`;
    } else if (template === 'deadlineExceeded') {
      html = `<div style="font-family: Arial; padding: 20px; border: 2px solid #ef4444;">
        <h2 style="color: #ef4444;">⚠️ Deadline Exceeded</h2>
        <p>Complaint #${data.complaintNumber} is overdue.</p>
        <p>Category: ${data.category}</p>
        <p>Deadline: ${new Date(data.deadline).toLocaleString()}</p>
      </div>`;
    } else {
      html = `<p>${notificationContent.message}</p>`;
    }

    // Send email (best-effort)
    await sendEmail(user.email, subject, html, text);
  } catch (error) {
    console.error('Error sending email notification:', error.message);
    // Don't throw - email failure shouldn't break notification flow
  }
};

// ====================================
// BULK NOTIFICATION FUNCTIONS
// ====================================

/**
 * @desc    Send notification to all admins
 * @param   {string} type - Notification type
 * @param   {object} data - Notification data
 * @returns {Promise<object>} - Results
 */
export const notifyAllAdmins = async (type, data) => {
  try {
    const admins = await User.find({
      role: USER_ROLES.ADMIN,
      isActive: true,
    }).select('_id');

    const results = await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          type,
          ...data,
        })
      )
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      success: failed.length === 0,
      totalSent: successful.length,
      totalFailed: failed.length,
    };
  } catch (error) {
    console.error('Error notifying admins:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Send notification to multiple users
 * @param   {string[]} userIds - Array of user IDs
 * @param   {string} type - Notification type
 * @param   {object} data - Notification data
 * @returns {Promise<object>} - Results
 */
export const notifyMultipleUsers = async (userIds, type, data) => {
  try {
    const results = await Promise.all(
      userIds.map((userId) =>
        createNotification({
          userId,
          type,
          ...data,
        })
      )
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      success: failed.length === 0,
      totalSent: successful.length,
      totalFailed: failed.length,
      results,
    };
  } catch (error) {
    console.error('Error notifying multiple users:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ====================================
// COMPLAINT-SPECIFIC NOTIFICATIONS
// ====================================

/**
 * @desc    Notify when complaint is raised
 * @param   {object} complaint - Complaint object
 * @param   {object} resident - Resident object
 */
export const notifyComplaintRaised = async (complaint, resident) => {
  try {
    // Notify all admins
    await notifyAllAdmins(NOTIFICATION_TYPES.COMPLAINT_RAISED, {
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      category: complaint.category,
      residentName: resident.name,
      metadata: {
        flatNumber: resident.flatNumber,
        priority: complaint.priority,
      },
    });

    console.log(`✅ Complaint raised notifications sent for ${complaint.complaintId}`);
  } catch (error) {
    console.error('Error in notifyComplaintRaised:', error.message);
  }
};

/**
 * @desc    Notify when staff is assigned
 * @param   {object} complaint - Complaint object
 * @param   {object} staff - Staff object
 * @param   {object} resident - Resident object
 */
export const notifyStaffAssigned = async (complaint, staff, resident) => {
  try {
    // Notify staff
    await createNotification({
      userId: staff._id,
      type: NOTIFICATION_TYPES.STAFF_ASSIGNED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      category: complaint.category,
      residentName: resident.name,
      residentPhone: resident.phone,
      flatNumber: resident.flatNumber,
      priority: complaint.priority,
      deadline: complaint.deadline,
    });

    // Notify resident
    await createNotification({
      userId: resident._id,
      type: NOTIFICATION_TYPES.STAFF_ASSIGNED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      staffName: staff.name,
      staffPhone: staff.phone,
      category: complaint.category,
      deadline: complaint.deadline,
    });

    console.log(`✅ Staff assigned notifications sent for ${complaint.complaintId}`);
  } catch (error) {
    console.error('Error in notifyStaffAssigned:', error.message);
  }
};

/**
 * @desc    Notify when status is updated
 * @param   {object} complaint - Complaint object
 * @param   {string} previousStatus - Previous status
 * @param   {string} newStatus - New status
 * @param   {object} staff - Staff who updated
 * @param   {string} remarks - Update remarks
 */
export const notifyStatusUpdated = async (
  complaint,
  previousStatus,
  newStatus,
  staff,
  remarks = ''
) => {
  try {
    // Get resident
    const resident = await User.findById(complaint.residentId).select('_id name');

    if (resident) {
      await createNotification({
        userId: resident._id,
        type: NOTIFICATION_TYPES.STATUS_UPDATED,
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        status: newStatus,
        staffName: staff.name,
        category: complaint.category,
        remarks,
        metadata: {
          previousStatus,
          newStatus,
        },
      });
    }

    console.log(`✅ Status update notification sent for ${complaint.complaintId}`);
  } catch (error) {
    console.error('Error in notifyStatusUpdated:', error.message);
  }
};

/**
 * @desc    Notify when work is completed
 * @param   {object} complaint - Complaint object
 * @param   {object} staff - Staff object
 * @param   {string} remarks - Completion remarks
 */
export const notifyWorkCompleted = async (complaint, staff, remarks = '') => {
  try {
    // Get resident
    const resident = await User.findById(complaint.residentId).select('_id name');

    if (resident) {
      await createNotification({
        userId: resident._id,
        type: NOTIFICATION_TYPES.WORK_COMPLETED,
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        staffName: staff.name,
        category: complaint.category,
        remarks,
      });
    }

    console.log(`✅ Work completed notification sent for ${complaint.complaintId}`);
  } catch (error) {
    console.error('Error in notifyWorkCompleted:', error.message);
  }
};

/**
 * @desc    Notify when complaint is closed
 * @param   {object} complaint - Complaint object
 * @param   {string} remarks - Closing remarks
 */
export const notifyComplaintClosed = async (complaint, remarks = '') => {
  try {
    // Get resident
    const resident = await User.findById(complaint.residentId).select('_id name');

    if (resident) {
      await createNotification({
        userId: resident._id,
        type: NOTIFICATION_TYPES.COMPLAINT_CLOSED,
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        category: complaint.category,
        remarks,
      });
    }

    console.log(`✅ Complaint closed notification sent for ${complaint.complaintId}`);
  } catch (error) {
    console.error('Error in notifyComplaintClosed:', error.message);
  }
};

/**
 * @desc    Notify when deadline is exceeded
 * @param   {object} complaint - Complaint object
 */
export const notifyDeadlineExceeded = async (complaint) => {
  try {
    // Calculate overdue hours
    const now = new Date();
    const deadline = new Date(complaint.deadline);
    const overdueHours = Math.floor((now - deadline) / (1000 * 60 * 60));

    // Get staff name if assigned
    let staffName = 'Not Assigned';
    if (complaint.assignedTo) {
      const staff = await User.findById(complaint.assignedTo).select('name');
      staffName = staff ? staff.name : 'Unknown';

      // Notify assigned staff
      await createNotification({
        userId: complaint.assignedTo,
        type: NOTIFICATION_TYPES.DEADLINE_EXCEEDED,
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        category: complaint.category,
        metadata: {
          overdueHours,
          deadline: complaint.deadline,
        },
      });
    }

    // Notify all admins
    await notifyAllAdmins(NOTIFICATION_TYPES.DEADLINE_EXCEEDED, {
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      category: complaint.category,
      staffName,
      deadline: complaint.deadline,
      metadata: {
        overdueHours,
        status: complaint.status,
      },
    });

    console.log(`✅ Deadline exceeded notifications sent for ${complaint.complaintId}`);
  } catch (error) {
    console.error('Error in notifyDeadlineExceeded:', error.message);
  }
};

/**
 * @desc    Notify when rating is received
 * @param   {object} rating - Rating object
 * @param   {object} complaint - Complaint object
 */
export const notifyRatingReceived = async (rating, complaint) => {
  try {
    await createNotification({
      userId: rating.staffId,
      type: NOTIFICATION_TYPES.RATING_RECEIVED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      rating: rating.rating,
      category: complaint.category,
      metadata: {
        feedback: rating.feedback,
      },
      sendEmailNotification: false, // Rating emails optional
    });

    console.log(`✅ Rating received notification sent for ${complaint.complaintId}`);
  } catch (error) {
    console.error('Error in notifyRatingReceived:', error.message);
  }
};

// ====================================
// NOTIFICATION MANAGEMENT FUNCTIONS
// ====================================

/**
 * @desc    Get unread notification count for user
 * @param   {string} userId - User ID
 * @returns {Promise<number>} - Unread count
 */
export const getUnreadCount = async (userId) => {
  try {
    return await Notification.getUnreadCount(userId);
  } catch (error) {
    console.error('Error getting unread count:', error.message);
    return 0;
  }
};

/**
 * @desc    Mark all notifications as read for user
 * @param   {string} userId - User ID
 * @returns {Promise<object>} - Result
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.markAllAsRead(userId);
    return {
      success: true,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error('Error marking all as read:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Clean old notifications
 * @param   {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<object>} - Result
 */
export const cleanOldNotifications = async (daysOld = 30) => {
  try {
    const result = await Notification.cleanOldNotifications(daysOld);
    console.log(`🧹 Cleaned ${result.deletedCount} old notifications`);
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error('Error cleaning old notifications:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Get notification statistics for user
 * @param   {string} userId - User ID
 * @returns {Promise<object>} - Statistics
 */
export const getNotificationStats = async (userId) => {
  try {
    const stats = await Notification.getStats(userId);
    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error('Error getting notification stats:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ====================================
// REAL-TIME NOTIFICATION HELPERS
// ====================================

/**
 * @desc    Format notification for real-time delivery
 * @param   {object} notification - Notification object
 * @returns {object} - Formatted notification
 */
export const formatNotificationForRealTime = (notification) => {
  return {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    complaintId: notification.complaintId,
    createdAt: notification.createdAt,
    timeAgo: notification.timeAgo,
    icon: notification.icon,
    color: notification.color,
  };
};

/**
 * @desc    Get recent notifications for real-time sync
 * @param   {string} userId - User ID
 * @param   {number} limit - Number of notifications
 * @returns {Promise<object[]>} - Notifications
 */
export const getRecentNotifications = async (userId, limit = 10) => {
  try {
    const notifications = await Notification.getForUser(userId, { limit });
    return notifications.map(formatNotificationForRealTime);
  } catch (error) {
    console.error('Error getting recent notifications:', error.message);
    return [];
  }
};

// ====================================
// EXPORT ALL FUNCTIONS
// ====================================

export default {
  // Core notification
  createNotification,

  // Bulk notifications
  notifyAllAdmins,
  notifyMultipleUsers,

  // Complaint notifications
  notifyComplaintRaised,
  notifyStaffAssigned,
  notifyStatusUpdated,
  notifyWorkCompleted,
  notifyComplaintClosed,
  notifyDeadlineExceeded,
  notifyRatingReceived,

  // Management
  getUnreadCount,
  markAllAsRead,
  cleanOldNotifications,
  getNotificationStats,

  // Real-time helpers
  formatNotificationForRealTime,
  getRecentNotifications,
};