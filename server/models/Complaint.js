import mongoose from 'mongoose';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_ARRAY,
  COMPLAINT_PRIORITY,
  COMPLAINT_PRIORITY_ARRAY,
  PAYMENT_MODE,
  PAYMENT_MODE_ARRAY,
  PAYMENT_STATUS,
  PAYMENT_STATUS_ARRAY,
  VALIDATION,
  DEFAULTS,
} from '../config/constants.js';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: COMPLAINT_STATUS_ARRAY,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      required: true,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      enum: {
        values: COMPLAINT_CATEGORIES,
        message: 'Invalid complaint category',
      },
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [
        VALIDATION.DESCRIPTION_MIN_LENGTH,
        `Description must be at least ${VALIDATION.DESCRIPTION_MIN_LENGTH} characters`,
      ],
      maxlength: [
        VALIDATION.DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`,
      ],
    },
    images: {
      type: [String], // Array of Cloudinary URLs
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 images allowed per complaint',
      },
      default: [],
    },
    imagePublicIds: {
      type: [String], // For Cloudinary deletion
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: COMPLAINT_STATUS_ARRAY,
        message: 'Invalid complaint status',
      },
      default: DEFAULTS.COMPLAINT_STATUS,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: {
        values: COMPLAINT_PRIORITY_ARRAY,
        message: 'Invalid priority level',
      },
      default: DEFAULTS.COMPLAINT_PRIORITY,
    },
    preferredPayMode: {
      type: String,
      enum: {
        values: PAYMENT_MODE_ARRAY,
        message: 'Invalid payment mode',
      },
      default: PAYMENT_MODE.OFFLINE,
    },
    preferredVisit: {
      availability: {
        type: String,
        enum: ['Anytime', 'Lunch Time', 'Break Time', 'Specific Time'],
      },
      from: {
        type: String, // store as HH:MM
      },
      to: {
        type: String, // store as HH:MM
      },
    },
    payment: {
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      amount: { type: Number, default: null }, // in paise (INR × 100)
      currency: { type: String, default: 'INR' },
      status: {
        type: String,
        enum: PAYMENT_STATUS_ARRAY,
        default: PAYMENT_STATUS.PENDING,
      },
      paidAt: { type: Date, default: null },
    },
    workRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Work remarks cannot exceed 1000 characters'],
    },
    proofImages: {
      type: [String], // Array of Cloudinary URLs for work proof
      validate: {
        validator: function (v) {
          return v.length <= 3;
        },
        message: 'Maximum 3 proof images allowed',
      },
      default: [],
    },
    proofImagePublicIds: {
      type: [String],
      default: [],
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    isDelayed: {
      type: Boolean,
      default: DEFAULTS.IS_DELAYED,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionTime: {
      type: Number, // Time in hours from creation to completion
      default: null,
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

// complaintSchema.index({ complaintId: 1 }, { unique: true }); // Removed: Covered by field definition
complaintSchema.index({ residentId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ isDelayed: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ deadline: 1 }, { sparse: true });
complaintSchema.index({ status: 1, isDelayed: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ residentId: 1, status: 1 });

// ====================================
// VIRTUAL FIELDS
// ====================================

// Check if complaint is overdue
complaintSchema.virtual('isOverdue').get(function () {
  if (!this.deadline) return false;
  const finishedStatuses = [
    COMPLAINT_STATUS.COMPLETED,
    COMPLAINT_STATUS.PAYMENT_PENDING,
    COMPLAINT_STATUS.PAYMENT_RECEIVED,
    COMPLAINT_STATUS.PAYMENT_COMPLETED,
    COMPLAINT_STATUS.CLOSED,
  ];
  if (finishedStatuses.includes(this.status)) {
    return false;
  }
  return new Date() > this.deadline;
});

// Get time remaining until deadline
complaintSchema.virtual('timeRemaining').get(function () {
  if (!this.deadline) return null;
  const now = new Date();
  const diff = this.deadline - now;

  if (diff <= 0) return 'Overdue';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
});

// Get age of complaint in hours
complaintSchema.virtual('ageInHours').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60));
});

// Virtual for rating
complaintSchema.virtual('rating', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'complaintId',
  justOne: true,
});

// ====================================
// PRE-SAVE MIDDLEWARE
// ====================================

// Generate unique complaint ID before saving
complaintSchema.pre('save', async function (next) {
  if (this.isNew && !this.complaintId) {
    this.complaintId = await generateComplaintId();

    // Add initial status to history
    this.statusHistory.push({
      status: COMPLAINT_STATUS.PENDING,
      changedBy: this.residentId,
      changedAt: new Date(),
      remarks: 'Complaint created',
    });
  }
  next();
});

// Update timestamps based on status changes
complaintSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === COMPLAINT_STATUS.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
      // Calculate resolution time
      this.resolutionTime = Math.floor(
        (this.completedAt - this.createdAt) / (1000 * 60 * 60)
      );
    }
    if (this.status === COMPLAINT_STATUS.CLOSED && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

// Check and update delay status
complaintSchema.pre('save', function (next) {
  const finishedStatuses = [
    COMPLAINT_STATUS.COMPLETED,
    COMPLAINT_STATUS.PAYMENT_PENDING,
    COMPLAINT_STATUS.PAYMENT_RECEIVED,
    COMPLAINT_STATUS.PAYMENT_COMPLETED,
    COMPLAINT_STATUS.CLOSED,
  ];

  if (this.deadline && !finishedStatuses.includes(this.status)) {
    this.isDelayed = new Date() > this.deadline;
  }
  // Once the work is completed (and beyond), we stop updating isDelayed.
  // It retains its value (true if it was completed late, false if completed on time).
  next();
});

// ====================================
// INSTANCE METHODS
// ====================================

// Add status history entry
complaintSchema.methods.addStatusHistory = function (status, userId, remarks = '') {
  this.statusHistory.push({
    status,
    changedBy: userId,
    changedAt: new Date(),
    remarks,
  });
};

// Assign to staff
complaintSchema.methods.assignToStaff = function (staffId, adminId, deadline = null) {
  this.assignedTo = staffId;
  this.assignedAt = new Date();
  this.assignedBy = adminId;
  this.status = COMPLAINT_STATUS.ASSIGNED;

  if (deadline) {
    this.deadline = deadline;
  }

  this.addStatusHistory(
    COMPLAINT_STATUS.ASSIGNED,
    adminId,
    `Assigned to staff with${deadline ? '' : 'out'} deadline`
  );
};

// Update status by staff
complaintSchema.methods.updateStatus = function (newStatus, staffId, remarks = '', proofImages = []) {
  const validTransitions = {
    [COMPLAINT_STATUS.ASSIGNED]: [COMPLAINT_STATUS.IN_PROGRESS],
    [COMPLAINT_STATUS.IN_PROGRESS]: [COMPLAINT_STATUS.COMPLETED, COMPLAINT_STATUS.IN_PROGRESS],
    [COMPLAINT_STATUS.COMPLETED]: [COMPLAINT_STATUS.PAYMENT_PENDING, COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.IN_PROGRESS],
    [COMPLAINT_STATUS.PAYMENT_PENDING]: [COMPLAINT_STATUS.PAYMENT_RECEIVED, COMPLAINT_STATUS.PAYMENT_COMPLETED],
    [COMPLAINT_STATUS.PAYMENT_RECEIVED]: [COMPLAINT_STATUS.CLOSED],
    [COMPLAINT_STATUS.PAYMENT_COMPLETED]: [COMPLAINT_STATUS.CLOSED],
  };

  const allowedStatuses = validTransitions[this.status] || [];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;

  if (remarks) {
    this.workRemarks = remarks;
  }

  if (proofImages.length > 0) {
    this.proofImages = [...this.proofImages, ...proofImages];
  }

  this.addStatusHistory(newStatus, staffId, remarks);
};

// Close complaint by admin
complaintSchema.methods.closeComplaint = function (adminId, remarks = '') {
  const closeableStatuses = [
    COMPLAINT_STATUS.COMPLETED,
    COMPLAINT_STATUS.PAYMENT_RECEIVED,
    COMPLAINT_STATUS.PAYMENT_COMPLETED,
  ];
  if (!closeableStatuses.includes(this.status)) {
    throw new Error('Can only close complaints that have completed work and payment');
  }

  this.status = COMPLAINT_STATUS.CLOSED;
  this.closedAt = new Date();
  this.closedBy = adminId;

  this.addStatusHistory(COMPLAINT_STATUS.CLOSED, adminId, remarks || 'Complaint verified and closed');
};

// Get summary for display
complaintSchema.methods.getSummary = function () {
  return {
    id: this._id,
    complaintId: this.complaintId,
    category: this.category,
    status: this.status,
    priority: this.priority,
    isDelayed: this.isDelayed,
    createdAt: this.createdAt,
    deadline: this.deadline,
    timeRemaining: this.timeRemaining,
  };
};

// ====================================
// STATIC METHODS
// ====================================

// Find by complaint ID string
complaintSchema.statics.findByComplaintId = function (complaintId) {
  return this.findOne({ complaintId });
};

// Get complaints by status
complaintSchema.statics.findByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Get delayed complaints
complaintSchema.statics.findDelayed = function () {
  const finishedStatuses = [
    COMPLAINT_STATUS.COMPLETED,
    COMPLAINT_STATUS.PAYMENT_PENDING,
    COMPLAINT_STATUS.PAYMENT_RECEIVED,
    COMPLAINT_STATUS.PAYMENT_COMPLETED,
    COMPLAINT_STATUS.CLOSED,
  ];
  return this.find({
    isDelayed: true,
    status: { $nin: finishedStatuses },
  }).sort({ deadline: 1 });
};

// Get complaints for resident
complaintSchema.statics.findByResident = function (residentId) {
  return this.find({ residentId }).sort({ createdAt: -1 });
};

// Get complaints assigned to staff
complaintSchema.statics.findByStaff = function (staffId) {
  return this.find({ assignedTo: staffId }).sort({ createdAt: -1 });
};

// Get pending assignments (for admin)
complaintSchema.statics.findPendingAssignment = function () {
  return this.find({ status: COMPLAINT_STATUS.PENDING }).sort({ createdAt: 1 });
};

// Get complaints statistics
complaintSchema.statics.getStatistics = async function (dateRange = null) {
  const matchStage = {};

  if (dateRange && dateRange.start && dateRange.end) {
    matchStage.createdAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end),
    };
  }

  return this.aggregate([
    { $match: matchStage },
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
  ]);
};

// Get category-wise statistics
complaintSchema.statics.getCategoryStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [
              { $in: ['$status', [COMPLAINT_STATUS.PENDING, COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.IN_PROGRESS]] },
              1,
              0,
            ],
          },
        },
        resolved: {
          $sum: {
            $cond: [
              { $in: ['$status', [COMPLAINT_STATUS.COMPLETED, COMPLAINT_STATUS.CLOSED]] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Get complaints trend (daily/weekly/monthly)
complaintSchema.statics.getComplaintsTrend = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [
              { $in: ['$status', [COMPLAINT_STATUS.COMPLETED, COMPLAINT_STATUS.CLOSED]] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Update delayed status for all overdue complaints
complaintSchema.statics.updateDelayedStatus = async function () {
  const now = new Date();
  const finishedStatuses = [
    COMPLAINT_STATUS.COMPLETED,
    COMPLAINT_STATUS.PAYMENT_PENDING,
    COMPLAINT_STATUS.PAYMENT_RECEIVED,
    COMPLAINT_STATUS.PAYMENT_COMPLETED,
    COMPLAINT_STATUS.CLOSED,
  ];

  const result = await this.updateMany(
    {
      deadline: { $lt: now },
      isDelayed: false,
      status: { $nin: finishedStatuses },
    },
    {
      $set: { isDelayed: true },
    }
  );

  return result;
};

// ====================================
// HELPER FUNCTIONS
// ====================================

// Generate unique complaint ID
async function generateComplaintId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const complaintId = `CMPL${timestamp}${random}`;

  // Check if ID already exists (extremely rare)
  const exists = await mongoose.model('Complaint').findOne({ complaintId });
  if (exists) {
    return generateComplaintId(); // Recursively generate new ID
  }

  return complaintId;
}

// ====================================
// CREATE AND EXPORT MODEL
// ====================================

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;