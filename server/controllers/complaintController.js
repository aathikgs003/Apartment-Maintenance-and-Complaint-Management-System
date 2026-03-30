import Complaint from '../models/Complaint.js';
import { generateComplaintId } from '../utils/generateToken.js';
import User from '../models/User.js';
import Rating from '../models/Rating.js';
import Notification from '../models/Notification.js';
import {
  MESSAGES,
  HTTP_STATUS,
  USER_ROLES,
  COMPLAINT_STATUS,
  NOTIFICATION_TYPES,
  PAGINATION,
} from '../config/constants.js';
import { uploadFromBuffer, deleteImage, deleteMultipleImages } from '../config/cloudinary.js';
import { createNotification, notifyStaffAssigned } from '../services/notificationService.js';
import sendEmail from '../utils/mailer.js';
import { complaintRaisedTemplate } from '../utils/emailTemplates.js';

// ====================================
// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (Resident only)
// ====================================
export const createComplaint = async (req, res, next) => {
  try {
    const { category, description, priority } = req.body;

    // Build complaint data
    const complaintData = {
      residentId: req.user._id,
      category,
      description,
      priority: priority || 'Medium',
    };

    // Preferred visit handling (required)
    const availability = req.body.preferredVisitAvailability || req.body.preferredVisit?.availability;
    const from = req.body.preferredVisitFrom || req.body.preferredVisit?.from;
    const to = req.body.preferredVisitTo || req.body.preferredVisit?.to;

    if (!availability) {
      return res.status(400).json({ success: false, message: 'Preferred visit availability is required' });
    }

    complaintData.preferredVisit = {
      availability,
    };

    if (availability === 'Specific Time') {
      complaintData.preferredVisit.from = from;
      complaintData.preferredVisit.to = to;
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      const imagePublicIds = [];

      for (const file of req.files) {
        const result = await uploadFromBuffer(file.buffer, {
          folder: 'apartment-maintenance/complaints',
        });

        if (result.success) {
          imageUrls.push(result.url);
          imagePublicIds.push(result.publicId);
        }
      }

      complaintData.images = imageUrls;
      complaintData.imagePublicIds = imagePublicIds;
    }

    // Ensure a unique complaintId is present before creating (avoid pre-save race)
    if (!complaintData.complaintId) {
      complaintData.complaintId = generateComplaintId();
    }

    // Debug: log payload summary before create
    console.log('Creating complaint with payload:', {
      complaintId: complaintData.complaintId,
      residentId: complaintData.residentId,
      category: complaintData.category,
      descriptionLength: complaintData.description ? complaintData.description.length : 0,
      imagesCount: complaintData.images ? complaintData.images.length : 0,
    });

    // Create complaint
    const complaint = await Complaint.create(complaintData);

    // Populate resident info
    await complaint.populate('residentId', 'name email flatNumber phone');

    // Get resident info for notification
    const resident = await User.findById(req.user.id);

    // Send notifications to all admins
    const admins = await User.findByRole(USER_ROLES.ADMIN);
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        type: NOTIFICATION_TYPES.COMPLAINT_RAISED,
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        category: complaint.category,
        residentName: resident.name,
      });
      // Send email to admin (best-effort, don't block on failures)
      try {
        await sendEmail(admin.email, 'New Complaint Raised', complaintRaisedTemplate(complaint));
      } catch (err) {
        console.error('Failed to send complaint email to admin', admin.email, err.message);
      }
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.COMPLAINT_CREATED,
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get all complaints (role-based)
// @route   GET /api/complaints
// @access  Private
// ====================================
export const getComplaints = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      category,
      priority,
      isDelayed,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = req.query;

    // Build query based on user role
    let query = {};

    if (req.user.role === USER_ROLES.RESIDENT) {
      // Residents can only see their own complaints
      query.residentId = req.user._id;
    } else if (req.user.role === USER_ROLES.STAFF) {
      // Staff can only see assigned complaints
      query.assignedTo = req.user.id;
    }
    // Admin can see all complaints (no filter)

    // Apply filters
    if (status) {
      // Accept status as comma-separated string or repeated query params (array)
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else if (typeof status === 'string' && status.includes(',')) {
        query.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        query.status = status;
      }
    }

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = priority;
    }

    if (isDelayed === 'true') {
      query.isDelayed = true;
    }

    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    // Debug: log who is requesting and the query
    console.log('getComplaints request by user:', req.user?.id, 'role:', req.user?.role);
    console.log('getComplaints query:', JSON.stringify(query));

    const complaints = await Complaint.find(query)
      .populate('residentId', 'name email flatNumber phone')
      .populate('assignedTo', 'name email phone expertise')
      .populate('assignedBy', 'name')
      .populate('closedBy', 'name')
      .populate({
        path: 'rating',
        populate: {
          path: 'residentId',
          select: 'name flatNumber',
        },
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Complaint.countDocuments(query);
    console.log('getComplaints returned:', complaints.length, 'totalCount:', total);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: {
        complaints,
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
// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
// ====================================
export const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('residentId', 'name email flatNumber phone profileImage')
      .populate('assignedTo', 'name email phone expertise profileImage')
      .populate('assignedBy', 'name email')
      .populate('closedBy', 'name email')
      .populate('statusHistory.changedBy', 'name role')
      .populate({
        path: 'rating',
        populate: {
          path: 'residentId',
          select: 'name flatNumber',
        },
      });

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    // Check access rights
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === USER_ROLES.RESIDENT &&
      complaint.residentId._id.toString() !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
      });
    }

    if (userRole === USER_ROLES.STAFF &&
      complaint.assignedTo?._id.toString() !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Complaint retrieved successfully',
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private (Resident - own, Admin - all)
// ====================================
export const updateComplaint = async (req, res, next) => {
  try {
    const { description, category, priority } = req.body;

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    // Check if resident owns this complaint
    if (req.user.role === USER_ROLES.RESIDENT &&
      complaint.residentId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
      });
    }

    // Only allow updates if status is Pending
    if (complaint.status !== COMPLAINT_STATUS.PENDING &&
      req.user.role !== USER_ROLES.ADMIN) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Can only update pending complaints',
      });
    }

    // Update fields
    if (description) complaint.description = description;
    if (category) complaint.category = category;
    if (priority && req.user.role === USER_ROLES.ADMIN) {
      complaint.priority = priority;
    }

    // Allow resident to update preferred visit when complaint is still pending
    const availability = req.body.preferredVisitAvailability || req.body.preferredVisit?.availability;
    const from = req.body.preferredVisitFrom || req.body.preferredVisit?.from;
    const to = req.body.preferredVisitTo || req.body.preferredVisit?.to;

    if (availability) {
      complaint.preferredVisit = { availability };
      if (availability === 'Specific Time') {
        complaint.preferredVisit.from = from;
        complaint.preferredVisit.to = to;
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      const newImagePublicIds = [];

      for (const file of req.files) {
        const result = await uploadFromBuffer(file.buffer, {
          folder: 'apartment-maintenance/complaints',
        });

        if (result.success) {
          newImageUrls.push(result.url);
          newImagePublicIds.push(result.publicId);
        }
      }

      // Add to existing images (max 5)
      const totalImages = complaint.images.length + newImageUrls.length;
      if (totalImages > 5) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Maximum 5 images allowed per complaint',
        });
      }

      complaint.images = [...complaint.images, ...newImageUrls];
      complaint.imagePublicIds = [...complaint.imagePublicIds, ...newImagePublicIds];
    }

    await complaint.save();

    // Populate fields
    await complaint.populate('residentId', 'name email flatNumber');
    await complaint.populate('assignedTo', 'name email');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.COMPLAINT_UPDATED,
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin only)
// ====================================
export const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    // Delete images from Cloudinary
    if (complaint.imagePublicIds && complaint.imagePublicIds.length > 0) {
      await deleteMultipleImages(complaint.imagePublicIds);
    }

    if (complaint.proofImagePublicIds && complaint.proofImagePublicIds.length > 0) {
      await deleteMultipleImages(complaint.proofImagePublicIds);
    }

    // Delete associated rating
    await Rating.deleteOne({ complaintId: complaint._id });

    // Delete associated notifications
    await Notification.deleteMany({ complaintId: complaint._id });

    // Delete complaint
    await complaint.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.COMPLAINT_DELETED,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Assign complaint to staff
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin only)
// ====================================
export const assignComplaint = async (req, res, next) => {
  try {
    const { staffId, deadline, priority } = req.body;

    // Validate staff ID
    if (!staffId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Staff ID is required',
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    // Check if complaint can be assigned
    if (![COMPLAINT_STATUS.PENDING, COMPLAINT_STATUS.ASSIGNED].includes(complaint.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ERROR.CANNOT_ASSIGN,
      });
    }

    // Verify staff exists and is active
    const staff = await User.findOne({
      _id: staffId,
      role: USER_ROLES.STAFF,
      isActive: true,
    });

    if (!staff) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.STAFF_NOT_FOUND,
      });
    }

    // Set deadline (default: 48 hours from now)
    const deadlineDate = deadline
      ? new Date(deadline)
      : new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Update priority if provided
    if (priority) {
      complaint.priority = priority;
    }

    // Assign complaint
    complaint.assignToStaff(staffId, req.user.id, deadlineDate);
    await complaint.save();

    // Increment activeComplaintsCount
    staff.activeComplaintsCount = (staff.activeComplaintsCount || 0) + 1;
    await staff.save();

    // Populate fields
    await complaint.populate('residentId', 'name email phone flatNumber');
    await complaint.populate('assignedTo', 'name email phone');

    // Send notifications to both staff and resident (using specialized helper)
    await notifyStaffAssigned(complaint, staff, complaint.residentId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.COMPLAINT_ASSIGNED,
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Auto-assign complaint to best staff
// @route   PUT /api/complaints/:id/auto-assign
// @access  Private (Admin only)
// ====================================
export const autoAssignComplaint = async (req, res, next) => {
  try {
    // 1. Validate complaint status
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    if (complaint.status !== COMPLAINT_STATUS.PENDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Only pending complaints can be auto-assigned',
      });
    }

    // 2. Fetch eligible staff
    // Criteria: role='staff', isActive=true, isAvailable=true, expertise includes complaint.category
    const eligibleStaff = await User.find({
      role: USER_ROLES.STAFF,
      isActive: true,
      isAvailable: true,
      expertise: complaint.category,
    });

    if (!eligibleStaff || eligibleStaff.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'No eligible staff found for this category',
      });
    }

    // 3. Calculate Scores
    const scoredStaff = eligibleStaff.map((staff) => {
      // Expertise Score (1 if matches, which is guaranteed by query)
      const expertiseScore = 1;

      // Workload Score = 1 / (activeComplaintsCount + 1)
      // If count is 0, score is 1. If count is 1, score is 0.5.
      const workloadScore = 1 / ((staff.activeComplaintsCount || 0) + 1);

      // Rating Score = averageRating / 5
      const ratingScore = (staff.averageRating || 0) / 5;

      // Performance Score = onTimeCompletionRate / 100
      const performanceScore = (staff.onTimeCompletionRate || 100) / 100;

      // Weighted Final Score
      // (Expertise Match × 40%) + (Workload Score × 30%) + (Rating Score × 20%) + (On-Time Performance × 10%)
      const finalScore =
        expertiseScore * 0.4 +
        workloadScore * 0.3 +
        ratingScore * 0.2 +
        performanceScore * 0.1;

      return {
        staff,
        score: finalScore,
        // Tie-breaker: activeComplaintsCount (ascending)
        workload: staff.activeComplaintsCount || 0,
      };
    });

    // 4. Select Best Staff
    // Sort descending by score. If tied, choose lower workload.
    scoredStaff.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Higher score first
      }
      return a.workload - b.workload; // Lower workload first
    });

    const selectedStaff = scoredStaff[0].staff;

    // 5. Assign Complaint
    // Default deadline: 48 hours from now
    const deadlineDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

    complaint.assignToStaff(selectedStaff._id, req.user.id, deadlineDate);
    await complaint.save();

    // 6. Update Staff Metrics
    // Increment activeComplaintsCount
    selectedStaff.activeComplaintsCount = (selectedStaff.activeComplaintsCount || 0) + 1;
    await selectedStaff.save();

    // 7. Populate Response
    await complaint.populate('residentId', 'name email flatNumber');
    await complaint.populate('assignedTo', 'name email phone expertise');

    // 8. Notifications
    // Notify Staff
    await createNotification({
      userId: selectedStaff._id,
      type: NOTIFICATION_TYPES.STAFF_ASSIGNED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      category: complaint.category,
    });

    // Notify Resident
    await createNotification({
      userId: complaint.residentId._id,
      type: NOTIFICATION_TYPES.STAFF_ASSIGNED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      staffName: selectedStaff.name,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Complaint auto-assigned successfully',
      data: {
        assignedTo: selectedStaff._id,
        staffName: selectedStaff.name,
        score: scoredStaff[0].score,
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Update complaint status (Staff)
// @route   PUT /api/complaints/:id/status
// @access  Private (Staff only)
// ====================================
export const updateStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    // Validate status
    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Status is required',
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    // Verify staff is assigned to this complaint
    if (complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not assigned to this complaint',
      });
    }

    // Handle proof image uploads (for completion)
    let proofImages = [];
    let proofImagePublicIds = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadFromBuffer(file.buffer, {
          folder: 'apartment-maintenance/proof-images',
        });

        if (result.success) {
          proofImages.push(result.url);
          proofImagePublicIds.push(result.publicId);
        }
      }
    }

    try {
      // Update status using model method
      complaint.updateStatus(status, req.user.id, remarks, proofImages);

      if (proofImagePublicIds.length > 0) {
        complaint.proofImagePublicIds = [
          ...complaint.proofImagePublicIds,
          ...proofImagePublicIds,
        ];
      }

      await complaint.save();

      // Update Staff Metrics if Completed
      if (status === COMPLAINT_STATUS.COMPLETED) {
        const staff = await User.findById(complaint.assignedTo);
        if (staff) {
          // Decrement active count
          staff.activeComplaintsCount = Math.max((staff.activeComplaintsCount || 0) - 1, 0);

          // Increment completed count
          const oldCompletedCount = staff.completedComplaintsCount || 0;
          staff.completedComplaintsCount = oldCompletedCount + 1;

          // Update On-Time Rate
          const oldRate = staff.onTimeCompletionRate || 100;
          const oldOnTimeCount = Math.round((oldRate / 100) * oldCompletedCount);

          // Check if on time
          // If no deadline, it's always on time? Or we ignore? Assume on time if no deadline.
          // If deadline exists, check completedAt <= deadline
          const isOnTime = !complaint.deadline || (complaint.completedAt <= complaint.deadline);

          const newOnTimeCount = oldOnTimeCount + (isOnTime ? 1 : 0);
          staff.onTimeCompletionRate = (newOnTimeCount / staff.completedComplaintsCount) * 100;

          await staff.save();
        }
      }
    } catch (err) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: err.message,
      });
    }

    // Populate fields
    await complaint.populate('residentId', 'name email flatNumber');
    await complaint.populate('assignedTo', 'name email');

    // Send notification to resident
    let notifType = NOTIFICATION_TYPES.STATUS_UPDATED;
    if (status === COMPLAINT_STATUS.COMPLETED) notifType = NOTIFICATION_TYPES.WORK_COMPLETED;
    else if (status === COMPLAINT_STATUS.PAYMENT_PENDING) notifType = NOTIFICATION_TYPES.PAYMENT_INITIATED;
    else if (status === COMPLAINT_STATUS.PAYMENT_RECEIVED) notifType = NOTIFICATION_TYPES.PAYMENT_RECEIVED;
    else if (status === COMPLAINT_STATUS.PAYMENT_COMPLETED) notifType = NOTIFICATION_TYPES.PAYMENT_COMPLETED;

    await createNotification({
      userId: complaint.residentId._id,
      type: notifType,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      status: status,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.STATUS_UPDATED,
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Close complaint (Admin)
// @route   PUT /api/complaints/:id/close
// @access  Private (Admin only)
// ====================================
export const closeComplaint = async (req, res, next) => {
  try {
    const { remarks } = req.body;

    // Find complaint
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    try {
      // Close complaint using model method
      complaint.closeComplaint(req.user.id, remarks);
      await complaint.save();
    } catch (err) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: err.message,
      });
    }

    // Populate fields
    await complaint.populate('residentId', 'name email flatNumber');
    await complaint.populate('assignedTo', 'name email');
    await complaint.populate('closedBy', 'name');

    // Send notification to resident
    await createNotification({
      userId: complaint.residentId._id,
      type: NOTIFICATION_TYPES.COMPLAINT_CLOSED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.COMPLAINT_CLOSED,
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Rate a completed complaint
// @route   POST /api/complaints/:id/rate
// @access  Private (Resident only)
// ====================================
export const rateComplaint = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.COMPLAINT_NOT_FOUND,
      });
    }

    // Verify resident owns this complaint
    if (complaint.residentId.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
      });
    }

    // Check if complaint is completed or closed (including payment states)
    const ratableStatuses = [
      COMPLAINT_STATUS.PAYMENT_RECEIVED,
      COMPLAINT_STATUS.PAYMENT_COMPLETED,
      COMPLAINT_STATUS.CLOSED
    ];
    if (!ratableStatuses.includes(complaint.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ERROR.CANNOT_RATE,
      });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({ complaintId: complaint._id });
    if (existingRating) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ERROR.ALREADY_RATED,
      });
    }

    // Create rating
    const newRating = await Rating.create({
      complaintId: complaint._id,
      residentId: req.user.id,
      staffId: complaint.assignedTo,
      rating: parseInt(rating, 10),
      feedback: feedback || '',
    });

    // Update Staff Average Rating
    const staffId = complaint.assignedTo;
    const stats = await Rating.aggregate([
      { $match: { staffId: staffId } },
      { $group: { _id: '$staffId', avgRating: { $avg: '$rating' } } }
    ]);

    if (stats.length > 0) {
      await User.findByIdAndUpdate(staffId, {
        averageRating: stats[0].avgRating
      });
    }

    // Populate rating
    await newRating.populate('staffId', 'name');
    await newRating.populate('residentId', 'name flatNumber');

    // Send notification to staff
    await createNotification({
      userId: complaint.assignedTo,
      type: NOTIFICATION_TYPES.RATING_RECEIVED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
      rating: rating,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.RATING_SUBMITTED,
      data: {
        rating: newRating,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get delayed complaints
// @route   GET /api/complaints/delayed
// @access  Private (Admin only)
// ====================================
export const getDelayedComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.findDelayed()
      .populate('residentId', 'name email flatNumber')
      .populate('assignedTo', 'name email phone');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Delayed complaints retrieved successfully',
      data: {
        complaints,
        count: complaints.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Get complaint statistics for resident
// @route   GET /api/complaints/my-stats
// @access  Private (Resident only)
// ====================================
export const getMyComplaintStats = async (req, res, next) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { residentId: req.user._id } },
      {
        $group: {
          _id: null,
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
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    [
                      COMPLAINT_STATUS.COMPLETED,
                      COMPLAINT_STATUS.PAYMENT_PENDING,
                      COMPLAINT_STATUS.PAYMENT_RECEIVED,
                      COMPLAINT_STATUS.PAYMENT_COMPLETED,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.CLOSED] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Complaint statistics retrieved successfully',
      data: {
        stats: stats[0] || {
          total: 0,
          pending: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0,
          closed: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export all controllers
export default {
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
};