const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Resource specifications schema
 */
const resourceSpecsSchema = new Schema(
  {
    cpuCores: {
      type: Number,
      required: [true, 'CPU cores are required'],
      min: [1, 'CPU cores must be at least 1'],
    },
    memoryGb: {
      type: Number,
      required: [true, 'Memory is required'],
      min: [1, 'Memory must be at least 1GB'],
    },
    storageGb: {
      type: Number,
      required: [true, 'Storage is required'],
      min: [1, 'Storage must be at least 1GB'],
    },
    gpuModel: {
      type: String,
    },
    gpuCount: {
      type: Number,
      min: [0, 'GPU count cannot be negative'],
      default: 0,
    },
    gpuMemoryGb: {
      type: Number,
      min: [0, 'GPU memory cannot be negative'],
    },
    hasSpecializedHardware: {
      type: Boolean,
      default: false,
    },
    specializedHardwareDesc: {
      type: String,
    },
    performanceScore: {
      type: Number,
      min: [0, 'Performance score cannot be negative'],
    },
  },
  { _id: false }
);

/**
 * Availability schema
 */
const availabilitySchema = new Schema(
  {
    schedule: {
      days: {
        type: [Number], // 0-6 for Sunday-Saturday
        validate: {
          validator: function(days) {
            return days.every(day => day >= 0 && day <= 6);
          },
          message: 'Days must be between 0 (Sunday) and 6 (Saturday)',
        },
      },
      startHour: {
        type: Number,
        min: [0, 'Start hour must be between 0 and 23'],
        max: [23, 'Start hour must be between 0 and 23'],
      },
      endHour: {
        type: Number,
        min: [0, 'End hour must be between 0 and 23'],
        max: [23, 'End hour must be between 0 and 23'],
      },
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    availabilityStart: {
      type: Date,
    },
    availabilityEnd: {
      type: Date,
    },
    isAlwaysAvailable: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Resource schema
 */
const resourceSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resource owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Resource description is required'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    specs: {
      type: resourceSpecsSchema,
      required: [true, 'Resource specifications are required'],
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price cannot be negative'],
    },
    pricingModel: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'per-job'],
      default: 'hourly',
    },
    minRentalTime: {
      type: Number, // Minimum rental time in hours
      default: 1,
      min: [0, 'Minimum rental time cannot be negative'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function(coordinates) {
            return coordinates.length === 2 &&
              coordinates[0] >= -180 && coordinates[0] <= 180 &&
              coordinates[1] >= -90 && coordinates[1] <= 90;
          },
          message: 'Invalid coordinates',
        },
      },
      country: {
        type: String,
      },
      region: {
        type: String,
      },
    },
    availability: {
      type: availabilitySchema,
      required: [true, 'Availability information is required'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationDetails: {
      verifiedAt: Date,
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      notes: String,
    },
    // Performance and reliability metrics
    metrics: {
      uptime: {
        type: Number, // Percentage
        min: 0,
        max: 100,
        default: 100,
      },
      reliability: {
        type: Number, // Percentage
        min: 0,
        max: 100,
        default: 100,
      },
      averageResponseTime: {
        type: Number, // Milliseconds
        min: 0,
      },
      successfulJobs: {
        type: Number,
        default: 0,
      },
      failedJobs: {
        type: Number,
        default: 0,
      },
      totalComputeTime: {
        type: Number, // Hours
        default: 0,
      },
    },
    // Reviews and ratings
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
resourceSchema.index({ 'specs.cpuCores': 1, 'specs.memoryGb': 1, 'specs.storageGb': 1 });
resourceSchema.index({ active: 1 });
resourceSchema.index({ pricePerUnit: 1 });
resourceSchema.index({ location: '2dsphere' });
resourceSchema.index({ 'rating.average': -1 });
resourceSchema.index({ tags: 1 });

// Virtual population for reviews
resourceSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'resource',
  justOne: false,
});

// Instance methods
resourceSchema.methods.isAvailableAt = function(date) {
  // Default availability
  if (this.availability.isAlwaysAvailable) return true;
  
  // Check if date is within availability period
  const checkDate = date || new Date();
  if (this.availability.availabilityStart && checkDate < this.availability.availabilityStart) {
    return false;
  }
  if (this.availability.availabilityEnd && checkDate > this.availability.availabilityEnd) {
    return false;
  }
  
  // Check if date matches schedule
  const dayOfWeek = checkDate.getDay(); // 0-6 for Sunday-Saturday
  if (!this.availability.schedule.days.includes(dayOfWeek)) {
    return false;
  }
  
  // Convert to provider's timezone
  const options = { timeZone: this.availability.timezone };
  const providerTime = new Date(checkDate.toLocaleString('en-US', options));
  const hour = providerTime.getHours();
  
  // Check if current hour is within schedule
  const { startHour, endHour } = this.availability.schedule;
  if (startHour <= endHour) {
    // Normal schedule (e.g., 9AM - 5PM)
    return hour >= startHour && hour < endHour;
  } else {
    // Overnight schedule (e.g., 8PM - 6AM)
    return hour >= startHour || hour < endHour;
  }
};

resourceSchema.methods.updateMetrics = function(jobSuccessful, computeTimeHours) {
  if (jobSuccessful) {
    this.metrics.successfulJobs += 1;
  } else {
    this.metrics.failedJobs += 1;
  }
  
  this.metrics.totalComputeTime += computeTimeHours || 0;
  
  // Calculate reliability
  const totalJobs = this.metrics.successfulJobs + this.metrics.failedJobs;
  this.metrics.reliability = totalJobs > 0 
    ? (this.metrics.successfulJobs / totalJobs) * 100 
    : 100;
  
  return this.save();
};

// Static methods
resourceSchema.statics.findAvailable = function(specs, options = {}) {
  const query = {
    active: true,
    'specs.cpuCores': { $gte: specs.minCpuCores || 1 },
    'specs.memoryGb': { $gte: specs.minMemoryGb || 1 },
    'specs.storageGb': { $gte: specs.minStorageGb || 1 },
  };
  
  if (specs.needsGpu) {
    query['specs.gpuCount'] = { $gt: 0 };
    
    if (specs.minGpuMemoryGb) {
      query['specs.gpuMemoryGb'] = { $gte: specs.minGpuMemoryGb };
    }
  }
  
  if (options.maxPrice) {
    query.pricePerUnit = { $lte: options.maxPrice };
  }
  
  if (options.location && options.maxDistance) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: options.location.coordinates,
        },
        $maxDistance: options.maxDistance * 1000, // Convert to meters
      },
    };
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  return this.find(query);
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource; 