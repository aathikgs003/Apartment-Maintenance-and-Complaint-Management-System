import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  USER_ROLES,
  USER_ROLES_ARRAY,
  STAFF_EXPERTISE,
  VALIDATION,
  AUTH,
} from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`],
      maxlength: [VALIDATION.NAME_MAX_LENGTH, `Name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters`],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [VALIDATION.EMAIL_REGEX, VALIDATION.EMAIL_MESSAGE],
    },
    password: {
      type: String,
      required: function () {
        // Password required only when not using Google OAuth
        return !this.googleId;
      },
      minlength: [VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES_ARRAY,
        message: 'Role must be either resident, staff, or admin',
      },
      required: [true, 'Role is required'],
      default: USER_ROLES.RESIDENT,
    },
    flatNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [VALIDATION.FLAT_NUMBER_REGEX, VALIDATION.FLAT_NUMBER_MESSAGE],
      // Required only for residents - validated in pre-save hook
    },
    phone: {
      type: String,
      required: function () {
        // Phone required only for non-Google users
        return !this.googleId;
      },
      trim: true,
      match: [VALIDATION.PHONE_REGEX, VALIDATION.PHONE_MESSAGE],
    },
    expertise: {
      type: [String],
      enum: {
        values: STAFF_EXPERTISE,
        message: 'Invalid expertise category',
      },
      default: [],
      // Only applicable for staff members
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    profileImagePublicId: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Google OAuth fields
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    // Staff Workload & Performance Metrics
    activeComplaintsCount: {
      type: Number,
      default: 0,
    },
    completedComplaintsCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    onTimeCompletionRate: {
      type: Number,
      default: 100,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isProfileCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ====================================
// INDEXES
// ====================================

// Create indexes for frequently queried fields
// userSchema.index({ email: 1 }, { unique: true }); // Removed: Covered by field definition
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

userSchema.index({ expertise: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ flatNumber: 1 }, { sparse: true }); // Sparse because not all users have flatNumber

// ====================================
// VIRTUAL FIELDS
// ====================================

// Virtual to get user's full info string
userSchema.virtual('displayInfo').get(function () {
  if (this.role === USER_ROLES.RESIDENT && this.flatNumber) {
    return `${this.name} (Flat: ${this.flatNumber})`;
  }
  return this.name;
});

// Virtual for complaints raised by this user (for residents)
userSchema.virtual('complaintsRaised', {
  ref: 'Complaint',
  localField: '_id',
  foreignField: 'residentId',
});

// Virtual for complaints assigned to this user (for staff)
userSchema.virtual('complaintsAssigned', {
  ref: 'Complaint',
  localField: '_id',
  foreignField: 'assignedTo',
});

// Virtual for ratings received by this user (for staff)
userSchema.virtual('ratingsReceived', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'staffId',
});

// ====================================
// PRE-SAVE MIDDLEWARE
// ====================================

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(AUTH.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);

    // Set passwordChangedAt for new users or password changes
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is valid
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Validate flatNumber for residents
userSchema.pre('save', function (next) {
  if (this.role === USER_ROLES.RESIDENT && !this.flatNumber) {
    // For Google-created users, default flatNumber
    if (this.googleId) {
      this.flatNumber = 'G-PENDING';
    } else {
      const error = new Error('Flat number is required for residents');
      error.name = 'ValidationError';
      return next(error);
    }
  }

  // Clear expertise for non-staff users
  if (this.role !== USER_ROLES.STAFF) {
    this.expertise = [];
  }

  // Clear flatNumber for non-residents
  if (this.role !== USER_ROLES.RESIDENT) {
    this.flatNumber = undefined;
  }

  next();
});

// ====================================
// INSTANCE METHODS
// ====================================

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: AUTH.JWT_EXPIRE,
    }
  );
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    flatNumber: this.flatNumber,
    phone: this.phone,
    expertise: this.expertise,
    isActive: this.isActive,
    profileImage: this.profileImage || this.avatar,
    avatar: this.avatar || this.profileImage,
    isVerified: this.isVerified,
    isProfileCompleted: this.isProfileCompleted,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

// ====================================
// STATIC METHODS
// ====================================

// Find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Find active users by role
userSchema.statics.findByRole = function (role, activeOnly = true) {
  const query = { role };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).select('-password');
};

// Find available staff (active and with specific expertise)
userSchema.statics.findAvailableStaff = function (expertise = null) {
  const query = {
    role: USER_ROLES.STAFF,
    isActive: true,
  };

  if (expertise) {
    query.expertise = { $in: Array.isArray(expertise) ? expertise : [expertise] };
  }

  return this.find(query).select('-password');
};

// Get staff with their average ratings
userSchema.statics.getStaffWithRatings = async function () {
  return this.aggregate([
    {
      $match: {
        role: USER_ROLES.STAFF,
        isActive: true,
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
        password: 0,
        ratings: 0,
      },
    },
    {
      $sort: { averageRating: -1 },
    },
  ]);
};

// Count users by role
userSchema.statics.countByRole = async function () {
  return this.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);
};

// ====================================
// CREATE AND EXPORT MODEL
// ====================================

const User = mongoose.model('User', userSchema);

export default User;