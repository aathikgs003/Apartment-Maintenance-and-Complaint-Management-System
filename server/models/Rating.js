import mongoose from 'mongoose';
import { VALIDATION } from '../config/constants.js';

const ratingSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
      unique: true, // One rating per complaint
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident ID is required'],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [VALIDATION.RATING_MIN, `Rating must be at least ${VALIDATION.RATING_MIN}`],
      max: [VALIDATION.RATING_MAX, `Rating cannot exceed ${VALIDATION.RATING_MAX}`],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback cannot exceed 500 characters'],
      default: '',
    },
    aspects: {
      timeliness: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      quality: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
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

ratingSchema.index({ complaintId: 1 }, { unique: true });
ratingSchema.index({ staffId: 1 });
ratingSchema.index({ residentId: 1 });
ratingSchema.index({ rating: 1 });
ratingSchema.index({ createdAt: -1 });
ratingSchema.index({ staffId: 1, createdAt: -1 });

// ====================================
// VIRTUAL FIELDS
// ====================================

// Get star display string
ratingSchema.virtual('starsDisplay').get(function () {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Get rating category
ratingSchema.virtual('ratingCategory').get(function () {
  if (this.rating >= 5) return 'Excellent';
  if (this.rating >= 4) return 'Good';
  if (this.rating >= 3) return 'Average';
  if (this.rating >= 2) return 'Below Average';
  return 'Poor';
});

// ====================================
// INSTANCE METHODS
// ====================================

// Get formatted rating for display
ratingSchema.methods.getFormatted = function () {
  return {
    id: this._id,
    rating: this.rating,
    starsDisplay: this.starsDisplay,
    ratingCategory: this.ratingCategory,
    feedback: this.feedback,
    aspects: this.aspects,
    createdAt: this.createdAt,
  };
};

// ====================================
// STATIC METHODS
// ====================================

// Check if complaint is already rated
ratingSchema.statics.isComplaintRated = async function (complaintId) {
  const rating = await this.findOne({ complaintId });
  return !!rating;
};

// Get rating by complaint ID
ratingSchema.statics.getByComplaint = function (complaintId) {
  return this.findOne({ complaintId })
    .populate('residentId', 'name flatNumber')
    .populate('staffId', 'name');
};

// Get ratings for staff member
ratingSchema.statics.getByStaff = function (staffId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  return this.find({ staffId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('complaintId', 'complaintId category')
    .populate('residentId', 'name flatNumber');
};

// Get ratings given by resident
ratingSchema.statics.getByResident = function (residentId) {
  return this.find({ residentId })
    .sort({ createdAt: -1 })
    .populate('complaintId', 'complaintId category status')
    .populate('staffId', 'name');
};

// Get average rating for staff
ratingSchema.statics.getStaffAverageRating = async function (staffId) {
  const result = await this.aggregate([
    { $match: { staffId: new mongoose.Types.ObjectId(staffId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };
  }

  const data = result[0];
  return {
    averageRating: Math.round(data.averageRating * 10) / 10, // Round to 1 decimal
    totalRatings: data.totalRatings,
    distribution: {
      5: data.fiveStars,
      4: data.fourStars,
      3: data.threeStars,
      2: data.twoStars,
      1: data.oneStar,
    },
  };
};

// Get all staff ratings summary
ratingSchema.statics.getAllStaffRatings = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$staffId',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
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
        staffName: '$staff.name',
        staffEmail: '$staff.email',
        expertise: '$staff.expertise',
        averageRating: { $round: ['$averageRating', 1] },
        totalRatings: 1,
      },
    },
    { $sort: { averageRating: -1 } },
  ]);
};

// Get rating statistics
ratingSchema.statics.getStatistics = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalRatings: 0,
      averageRating: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const data = result[0];
  return {
    totalRatings: data.totalRatings,
    averageRating: Math.round(data.averageRating * 10) / 10,
    distribution: {
      5: data.fiveStars,
      4: data.fourStars,
      3: data.threeStars,
      2: data.twoStars,
      1: data.oneStar,
    },
  };
};

// Get recent ratings
ratingSchema.statics.getRecent = function (limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('complaintId', 'complaintId category')
    .populate('residentId', 'name flatNumber')
    .populate('staffId', 'name');
};

// Get ratings trend (monthly)
ratingSchema.statics.getRatingsTrend = async function (months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: {
                if: { $lt: ['$_id.month', 10] },
                then: { $concat: ['0', { $toString: '$_id.month' }] },
                else: { $toString: '$_id.month' },
              },
            },
          ],
        },
        averageRating: { $round: ['$averageRating', 1] },
        count: 1,
      },
    },
  ]);
};

// ====================================
// PRE-SAVE MIDDLEWARE
// ====================================

// Validate that the complaint exists and is completed/closed
ratingSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Complaint = mongoose.model('Complaint');
    const complaint = await Complaint.findById(this.complaintId);
    
    if (!complaint) {
      const error = new Error('Complaint not found');
      error.name = 'ValidationError';
      return next(error);
    }
    
    if (!['Completed', 'Closed', 'Payment Received', 'Payment Completed'].includes(complaint.status)) {
      const error = new Error('Can only rate completed, closed, or paid complaints');
      error.name = 'ValidationError';
      return next(error);
    }
    
    if (!complaint.assignedTo.equals(this.staffId)) {
      const error = new Error('Staff ID does not match the assigned staff');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// ====================================
// CREATE AND EXPORT MODEL
// ====================================

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;