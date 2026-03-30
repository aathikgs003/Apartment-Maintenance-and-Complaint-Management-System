import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Rating from '../models/Rating.js';
import {
  HTTP_STATUS,
  USER_ROLES,
  COMPLAINT_STATUS,
} from '../config/constants.js';

// ====================================
// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin only)
// ====================================
export const getDashboardStats = async (req, res, next) => {
  try {
    // Get date range (default: last 30 days)
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Run all queries in parallel
    const [
      complaintStats,
      userCounts,
      recentComplaints,
      delayedCount,
      todayStats,
      categoryStats,
    ] = await Promise.all([
      // Overall complaint statistics
      Complaint.getStatistics(dateFilter.createdAt ? { start: startDate, end: endDate } : null),

      // User counts by role
      User.countByRole(),

      // Recent complaints (last 5)
      Complaint.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('residentId', 'name flatNumber')
        .populate('assignedTo', 'name')
        .select('complaintId category status priority createdAt'),

      // Delayed complaints count
      Complaint.countDocuments({
        isDelayed: true,
        status: { $nin: [COMPLAINT_STATUS.COMPLETED, COMPLAINT_STATUS.CLOSED] },
      }),

      // Today's statistics
      getTodayStats(),

      // Category-wise statistics
      Complaint.getCategoryStats(),
    ]);

    // Format user counts
    const users = {
      total: 0,
      residents: 0,
      staff: 0,
      admins: 0,
    };
    userCounts.forEach((item) => {
      users.total += item.count;
      if (item._id === USER_ROLES.RESIDENT) users.residents = item.count;
      if (item._id === USER_ROLES.STAFF) users.staff = item.count;
      if (item._id === USER_ROLES.ADMIN) users.admins = item.count;
    });

    // Calculate delay percentage
    const stats = complaintStats[0] || {
      total: 0,
      pending: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      closed: 0,
      delayed: 0,
      avgResolutionTime: 0,
    };

    const activeComplaints = stats.pending + stats.assigned + stats.inProgress;
    const delayPercentage = activeComplaints > 0
      ? ((delayedCount / activeComplaints) * 100).toFixed(1)
      : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        complaints: {
          ...stats,
          active: activeComplaints,
          resolved: stats.completed + stats.closed,
          delayPercentage: parseFloat(delayPercentage),
        },
        users,
        today: todayStats,
        recentComplaints,
        categoryStats,
        delayedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get staff performance analytics
// @route   GET /api/analytics/staff-performance
// @access  Private (Admin only)
// ====================================
export const getStaffPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate, sortBy = 'averageRating', order = 'desc' } = req.query;

    // Build date filter
    const dateMatch = {};
    if (startDate || endDate) {
      dateMatch.completedAt = {};
      if (startDate) dateMatch.completedAt.$gte = new Date(startDate);
      if (endDate) dateMatch.completedAt.$lte = new Date(endDate);
    }

    // Get staff performance data
    const staffPerformance = await User.aggregate([
      {
        $match: {
          role: USER_ROLES.STAFF,
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'complaints',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$staffId'] },
                ...dateMatch,
              },
            },
          ],
          as: 'complaints',
        },
      },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'staffId',
          as: 'ratings',
        },
      },
      {
        $addFields: {
          totalAssigned: { $size: '$complaints' },
          completed: {
            $size: {
              $filter: {
                input: '$complaints',
                as: 'c',
                cond: { $in: ['$$c.status', ['Completed', 'Closed']] },
              },
            },
          },
          inProgress: {
            $size: {
              $filter: {
                input: '$complaints',
                as: 'c',
                cond: { $eq: ['$$c.status', 'In Progress'] },
              },
            },
          },
          delayed: {
            $size: {
              $filter: {
                input: '$complaints',
                as: 'c',
                cond: { $eq: ['$$c.isDelayed', true] },
              },
            },
          },
          avgResolutionTime: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$complaints',
                    as: 'c',
                    cond: { $ne: ['$$c.resolutionTime', null] },
                  },
                },
                as: 'c',
                in: '$$c.resolutionTime',
              },
            },
          },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$ratings' }, 0] },
              then: { $avg: '$ratings.rating' },
              else: 0,
            },
          },
          totalRatings: { $size: '$ratings' },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          expertise: 1,
          profileImage: 1,
          totalAssigned: 1,
          completed: 1,
          inProgress: 1,
          delayed: 1,
          avgResolutionTime: { $round: ['$avgResolutionTime', 1] },
          averageRating: { $round: ['$averageRating', 1] },
          totalRatings: 1,
          completionRate: {
            $cond: {
              if: { $gt: ['$totalAssigned', 0] },
              then: {
                $round: [
                  { $multiply: [{ $divide: ['$completed', '$totalAssigned'] }, 100] },
                  1,
                ],
              },
              else: 0,
            },
          },
        },
      },
      {
        $sort: { [sortBy]: order === 'asc' ? 1 : -1 },
      },
    ]);

    // Calculate overall statistics
    const overallStats = {
      totalStaff: staffPerformance.length,
      avgCompletionRate: 0,
      avgRating: 0,
      avgResolutionTime: 0,
    };

    if (staffPerformance.length > 0) {
      overallStats.avgCompletionRate = (
        staffPerformance.reduce((sum, s) => sum + s.completionRate, 0) /
        staffPerformance.length
      ).toFixed(1);

      const staffWithRatings = staffPerformance.filter((s) => s.totalRatings > 0);
      if (staffWithRatings.length > 0) {
        overallStats.avgRating = (
          staffWithRatings.reduce((sum, s) => sum + s.averageRating, 0) /
          staffWithRatings.length
        ).toFixed(1);
      }

      const staffWithTime = staffPerformance.filter((s) => s.avgResolutionTime > 0);
      if (staffWithTime.length > 0) {
        overallStats.avgResolutionTime = (
          staffWithTime.reduce((sum, s) => sum + s.avgResolutionTime, 0) /
          staffWithTime.length
        ).toFixed(1);
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Staff performance retrieved successfully',
      data: {
        staff: staffPerformance,
        overall: overallStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get complaints trend
// @route   GET /api/analytics/complaints-trend
// @access  Private (Admin only)
// ====================================
export const getComplaintsTrend = async (req, res, next) => {
  try {
    const { days = 30, groupBy = 'day' } = req.query;

    const daysNum = parseInt(days, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const trend = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' },
          },
          created: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [
                { $in: ['$status', [COMPLAINT_STATUS.COMPLETED, COMPLAINT_STATUS.CLOSED]] },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                { $in: ['$status', [COMPLAINT_STATUS.PENDING, COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.IN_PROGRESS]] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          created: 1,
          resolved: 1,
          pending: 1,
        },
      },
    ]);

    // Fill in missing dates
    const filledTrend = fillMissingDates(trend, startDate, new Date(), groupBy);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Complaints trend retrieved successfully',
      data: {
        trend: filledTrend,
        period: {
          start: startDate,
          end: new Date(),
          days: daysNum,
          groupBy,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get category-wise analytics
// @route   GET /api/analytics/categories
// @access  Private (Admin only)
// ====================================
export const getCategoryAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateMatch = {};
    if (startDate || endDate) {
      dateMatch.createdAt = {};
      if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
      if (endDate) dateMatch.createdAt.$lte = new Date(endDate);
    }

    const categoryStats = await Complaint.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.PENDING] }, 1, 0] },
          },
          assigned: {
            $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.ASSIGNED] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.IN_PROGRESS] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.COMPLETED] }, 1, 0] },
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.CLOSED] }, 1, 0] },
          },
          delayed: {
            $sum: { $cond: ['$isDelayed', 1, 0] },
          },
          avgResolutionTime: { $avg: '$resolutionTime' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          pending: 1,
          assigned: 1,
          inProgress: 1,
          completed: 1,
          closed: 1,
          delayed: 1,
          active: { $add: ['$pending', '$assigned', '$inProgress'] },
          resolved: { $add: ['$completed', '$closed'] },
          avgResolutionTime: { $round: ['$avgResolutionTime', 1] },
          resolutionRate: {
            $cond: {
              if: { $gt: ['$total', 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: [{ $add: ['$completed', '$closed'] }, '$total'] },
                      100,
                    ],
                  },
                  1,
                ],
              },
              else: 0,
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get priority distribution
    const priorityStats = await Complaint.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityDistribution = {
      High: 0,
      Medium: 0,
      Low: 0,
    };
    priorityStats.forEach((p) => {
      priorityDistribution[p._id] = p.count;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Category analytics retrieved successfully',
      data: {
        categories: categoryStats,
        priorityDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get delay analytics
// @route   GET /api/analytics/delays
// @access  Private (Admin only)
// ====================================
export const getDelayAnalytics = async (req, res, next) => {
  try {
    // Get delayed complaints by category
    const delaysByCategory = await Complaint.aggregate([
      {
        $match: {
          isDelayed: true,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get delayed complaints by staff
    const delaysByStaff = await Complaint.aggregate([
      {
        $match: {
          isDelayed: true,
          assignedTo: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff',
        },
      },
      { $unwind: '$staff' },
      {
        $project: {
          _id: 1,
          count: 1,
          staffName: '$staff.name',
          staffEmail: '$staff.email',
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get average delay duration
    const delayDuration = await Complaint.aggregate([
      {
        $match: {
          isDelayed: true,
          deadline: { $ne: null },
        },
      },
      {
        $addFields: {
          delayHours: {
            $divide: [
              { $subtract: [new Date(), '$deadline'] },
              1000 * 60 * 60,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDelayHours: { $avg: '$delayHours' },
          maxDelayHours: { $max: '$delayHours' },
          totalDelayed: { $sum: 1 },
        },
      },
    ]);

    // Get delay trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const delayTrend = await Complaint.aggregate([
      {
        $match: {
          isDelayed: true,
          updatedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Delay analytics retrieved successfully',
      data: {
        byCategory: delaysByCategory,
        byStaff: delaysByStaff,
        duration: delayDuration[0] || {
          avgDelayHours: 0,
          maxDelayHours: 0,
          totalDelayed: 0,
        },
        trend: delayTrend,
      },
    });
    // Development logging to help debug empty results
    if (process.env.NODE_ENV === 'development') {
      console.log('DEBUG: Delay analytics -> byCategory:', JSON.stringify(delaysByCategory));
      console.log('DEBUG: Delay analytics -> byStaff:', JSON.stringify(delaysByStaff));
      console.log('DEBUG: Delay analytics -> duration:', JSON.stringify(delayDuration[0] || {}));
      console.log('DEBUG: Delay analytics -> trend:', JSON.stringify(delayTrend));
    }
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get rating analytics
// @route   GET /api/analytics/ratings
// @access  Private (Admin only)
// ====================================
export const getRatingAnalytics = async (req, res, next) => {
  try {
    const [overallStats, staffRatings, ratingTrend, recentRatings] = await Promise.all([
      Rating.getStatistics(),
      Rating.getAllStaffRatings(),
      Rating.getRatingsTrend(6),
      Rating.getRecent(10),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Rating analytics retrieved successfully',
      data: {
        overall: overallStats,
        byStaff: staffRatings,
        trend: ratingTrend,
        recent: recentRatings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// HELPER FUNCTIONS
// ====================================

// Get today's statistics
async function getTodayStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [created, resolved, assigned] = await Promise.all([
    Complaint.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Complaint.countDocuments({
      completedAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Complaint.countDocuments({
      assignedAt: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  return { created, resolved, assigned };
}

// Fill missing dates in trend data
function fillMissingDates(data, startDate, endDate, groupBy) {
  const result = [];
  const dataMap = new Map(data.map((item) => [item.date, item]));

  const current = new Date(startDate);
  while (current <= endDate) {
    let dateKey;

    switch (groupBy) {
      case 'week':
        dateKey = getWeekString(current);
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        dateKey = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
    }

    if (dataMap.has(dateKey)) {
      result.push(dataMap.get(dateKey));
    } else {
      result.push({
        date: dateKey,
        created: 0,
        resolved: 0,
        pending: 0,
      });
    }
  }

  return result;
}

// Get week string (YYYY-WXX format)
function getWeekString(date) {
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const weekNum = Math.ceil(((date - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

// Export all controllers
export default {
  getDashboardStats,
  getStaffPerformance,
  getComplaintsTrend,
  getCategoryAnalytics,
  getDelayAnalytics,
  getRatingAnalytics,
};