const mongoose = require('mongoose');
const { Schema } = mongoose;
const { password: passwordUtils } = require('../utils/encryption');

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    walletAddress: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow multiple null values (not all users will have wallets)
    },
    role: {
      type: String,
      enum: ['user', 'provider', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: Date,
    // User preferences
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      notificationEmail: {
        type: Boolean,
        default: true,
      },
      notificationSite: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },
    // Statistics and metrics
    stats: {
      totalJobsCreated: {
        type: Number,
        default: 0,
      },
      totalResourcesRegistered: {
        type: Number,
        default: 0,
      },
      totalDatasetsUploaded: {
        type: Number,
        default: 0,
      },
      reputation: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual properties
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password
    this.password = await passwordUtils.hash(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.verifyPassword = async function(candidatePassword) {
  return await passwordUtils.verify(candidatePassword, this.password);
};

userSchema.methods.updateLoginStats = function(success) {
  if (success) {
    this.lastLogin = new Date();
    this.loginCount += 1;
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
  } else {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15); // Lock for 15 minutes
      this.lockedUntil = lockTime;
    }
  }
  
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ walletAddress });
};

const User = mongoose.model('User', userSchema);

module.exports = User; 