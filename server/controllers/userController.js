import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Rating from '../models/Rating.js';
import Notification from '../models/Notification.js';
import {
  MESSAGES,
  HTTP_STATUS,
  USER_ROLES,
  PAGINATION,
} from '../config/constants.js';
import { uploadFromBuffer, deleteImage } from '../config/cloudinary.js';

// ====================================
// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
// ====================================
export const getUsers = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { flatNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await User.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
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
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
// ====================================
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    // Get additional stats based on role
    let stats = {};

    if (user.role === USER_ROLES.RESIDENT) {
      const complaintStats = await Complaint.aggregate([
        { $match: { residentId: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            resolved: {
              $sum: {
                $cond: [{ $in: ['$status', ['Completed', 'Closed']] }, 1, 0]
              }
            },
          },
        },
      ]);
      stats = complaintStats[0] || { total: 0, pending: 0, resolved: 0 };
    }

    if (user.role === USER_ROLES.STAFF) {
      const [complaintStats, ratingStats] = await Promise.all([
        Complaint.aggregate([
          { $match: { assignedTo: user._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: {
                $sum: {
                  $cond: [{ $in: ['$status', ['Completed', 'Closed']] }, 1, 0]
                }
              },
              inProgress: {
                $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
              },
            },
          },
        ]),
        Rating.getStaffAverageRating(user._id),
      ]);

      stats = {
        complaints: complaintStats[0] || { total: 0, completed: 0, inProgress: 0 },
        ratings: ratingStats,
      };
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Create new user (Admin)
// @route   POST /api/users
// @access  Private (Admin only)
// ====================================
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, flatNumber, phone, expertise, isActive } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: MESSAGES.ERROR.EMAIL_EXISTS,
      });
    }

    // Build user data
    const userData = {
      name,
      email,
      password,
      role: role || USER_ROLES.RESIDENT,
      phone,
      isActive: isActive !== undefined ? isActive : true,
    };

    // Add role-specific fields
    if (userData.role === USER_ROLES.RESIDENT) {
      if (!flatNumber) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Flat number is required for residents',
        });
      }
      userData.flatNumber = flatNumber;
    }

    if (userData.role === USER_ROLES.STAFF && expertise) {
      userData.expertise = Array.isArray(expertise) ? expertise : [expertise];
    }

    // Handle profile image upload
    if (req.file) {
      const result = await uploadFromBuffer(req.file.buffer, {
        folder: 'apartment-maintenance/profiles',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        ],
      });

      if (result.success) {
        userData.profileImage = result.url;
        userData.profileImagePublicId = result.publicId;
      }
    }

    // Create user
    const user = await User.create(userData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.USER_CREATED,
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
// ====================================
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, flatNumber, phone, expertise, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    // Check if email is being changed and if new email already exists
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: MESSAGES.ERROR.EMAIL_EXISTS,
        });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    // Update role-specific fields
    if (user.role === USER_ROLES.RESIDENT) {
      if (flatNumber) user.flatNumber = flatNumber;
    } else {
      user.flatNumber = undefined;
    }

    if (user.role === USER_ROLES.STAFF) {
      if (expertise) {
        user.expertise = Array.isArray(expertise) ? expertise : [expertise];
      }
    } else {
      user.expertise = [];
    }

    // Handle profile image upload
    if (req.file) {
      // Delete old image if exists
      if (user.profileImagePublicId) {
        await deleteImage(user.profileImagePublicId);
      }

      const result = await uploadFromBuffer(req.file.buffer, {
        folder: 'apartment-maintenance/profiles',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        ],
      });

      if (result.success) {
        user.profileImage = result.url;
        user.profileImagePublicId = result.publicId;
      }
    }

    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.USER_UPDATED,
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
// ====================================
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user.id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check for active complaints
    if (user.role === USER_ROLES.RESIDENT) {
      const activeComplaints = await Complaint.countDocuments({
        residentId: user._id,
        status: { $nin: ['Completed', 'Closed'] },
      });

      if (activeComplaints > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Cannot delete user with ${activeComplaints} active complaints. Please resolve them first.`,
        });
      }
    }

    if (user.role === USER_ROLES.STAFF) {
      const assignedComplaints = await Complaint.countDocuments({
        assignedTo: user._id,
        status: { $nin: ['Completed', 'Closed'] },
      });

      if (assignedComplaints > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Cannot delete staff with ${assignedComplaints} assigned complaints. Please reassign them first.`,
        });
      }
    }

    // Delete profile image from Cloudinary
    if (user.profileImagePublicId) {
      await deleteImage(user.profileImagePublicId);
    }

    // Delete user notifications
    await Notification.deleteMany({ userId: user._id });

    // Delete user
    await user.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.USER_DELETED,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get available staff
// @route   GET /api/users/staff/available
// @access  Private (Admin only)
// ====================================
export const getAvailableStaff = async (req, res, next) => {
  try {
    const { expertise, sortByRating } = req.query;

    // Get staff with workload info
    let staff;

    if (sortByRating === 'true') {
      // Get staff sorted by rating
      staff = await User.getStaffWithRatings();
    } else {
      const query = {
        role: USER_ROLES.STAFF,
        isActive: true,
      };

      // Debug: log incoming query param for expertise
      console.debug('[getAvailableStaff] req.query:', req.query);

      if (expertise) {
        query.expertise = { $in: expertise.split(',') };
      }

      console.debug('[getAvailableStaff] mongo query:', JSON.stringify(query));

      staff = await User.find(query).select('-password');
      console.debug(`[getAvailableStaff] found ${staff.length} staff`);
    }

    // Get workload for each staff
    const staffWithWorkload = await Promise.all(
      staff.map(async (s) => {
        const workload = await Complaint.countDocuments({
          assignedTo: s._id,
          status: { $in: ['Assigned', 'In Progress'] },
        });

        const completedToday = await Complaint.countDocuments({
          assignedTo: s._id,
          completedAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        });

        const ratingData = await Rating.getStaffAverageRating(s._id);

        return {
          ...(s.toObject ? s.toObject() : s),
          currentWorkload: workload,
          completedToday,
          averageRating: ratingData.averageRating,
          totalRatings: ratingData.totalRatings,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Available staff retrieved successfully',
      data: {
        staff: staffWithWorkload,
        count: staffWithWorkload.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Private (Admin only)
// ====================================
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user.id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    // Check for active assignments before deactivating staff
    if (user.role === USER_ROLES.STAFF && user.isActive) {
      const activeAssignments = await Complaint.countDocuments({
        assignedTo: user._id,
        status: { $in: ['Assigned', 'In Progress'] },
      });

      if (activeAssignments > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Cannot deactivate staff with ${activeAssignments} active assignments`,
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Reset user password (Admin)
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
// ====================================
export const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND,
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get user counts by role
// @route   GET /api/users/counts
// @access  Private (Admin only)
// ====================================
export const getUserCounts = async (req, res, next) => {
  try {
    const counts = await User.countByRole();

    const formattedCounts = {
      total: 0,
      residents: 0,
      staff: 0,
      admins: 0,
    };

    counts.forEach((item) => {
      formattedCounts.total += item.count;
      if (item._id === USER_ROLES.RESIDENT) formattedCounts.residents = item.count;
      if (item._id === USER_ROLES.STAFF) formattedCounts.staff = item.count;
      if (item._id === USER_ROLES.ADMIN) formattedCounts.admins = item.count;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User counts retrieved successfully',
      data: {
        counts: formattedCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export all controllers
export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAvailableStaff,
  toggleUserStatus,
  resetUserPassword,
  getUserCounts,
};