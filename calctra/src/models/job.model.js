const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Job requirements schema
 */
const jobRequirementsSchema = new Schema(
  {
    cpuCores: {
      type: Number,
      required: [true, 'CPU cores requirement is mandatory'],
      min: [1, 'At least 1 CPU core is required'],
    },
    memoryGb: {
      type: Number,
      required: [true, 'Memory requirement is mandatory'],
      min: [1, 'At least 1GB of memory is required'],
    },
    storageGb: {
      type: Number,
      required: [true, 'Storage requirement is mandatory'],
      min: [1, 'At least 1GB of storage is required'],
    },
    needsGpu: {
      type: Boolean,
      default: false,
    },
    gpuMemoryGb: {
      type: Number,
      min: [0, 'GPU memory cannot be negative'],
    },
    preferredGpuModel: {
      type: String,
    },
    maxPrice: {
      type: Number,
      min: [0, 'Maximum price cannot be negative'],
    },
    estimatedDuration: {
      type: Number, // Hours
      min: [0, 'Duration cannot be negative'],
    },
    packageDependencies: {
      type: [String],
    },
    specialRequirements: {
      type: String,
    },
  },
  { _id: false }
);

/**
 * Job execution result schema
 */
const jobResultSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['success', 'partial_success', 'failed'],
      required: true,
    },
    outputFiles: [{
      filename: String,
      fileSize: Number,
      fileType: String,
      checksum: String,
      path: String,
      encryptionKey: String,
      access: {
        type: String,
        enum: ['private', 'shared', 'public'],
        default: 'private',
      },
    }],
    logs: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      message: String,
      level: {
        type: String,
        enum: ['info', 'warning', 'error', 'debug'],
        default: 'info',
      },
    }],
    metrics: {
      cpuUsage: {
        type: Number, // Percentage
        min: 0,
        max: 100,
      },
      memoryUsage: {
        type: Number, // Percentage
        min: 0,
        max: 100,
      },
      gpuUsage: {
        type: Number, // Percentage
        min: 0,
        max: 100,
      },
      executionTime: {
        type: Number, // Seconds
        min: 0,
      },
      energyConsumption: {
        type: Number, // kWh
        min: 0,
      },
    },
    errorDetails: {
      code: String,
      message: String,
      stackTrace: String,
    },
  },
  { _id: false }
);

/**
 * Job schema
 */
const jobSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job creator is required'],
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    type: {
      type: String,
      enum: ['batch', 'interactive', 'streaming', 'distributed'],
      default: 'batch',
    },
    priority: {
      type: Number,
      min: [1, 'Priority must be at least 1'],
      max: [10, 'Priority cannot be more than 10'],
      default: 5,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending',
        'waiting_resources',
        'scheduled',
        'running',
        'paused',
        'completed',
        'failed',
        'cancelled',
        'timeout',
      ],
      default: 'draft',
    },
    requirements: {
      type: jobRequirementsSchema,
      required: [true, 'Job requirements are mandatory'],
    },
    inputFiles: [{
      filename: {
        type: String,
        required: true,
      },
      fileSize: Number,
      fileType: String,
      checksum: String,
      path: {
        type: String,
        required: true,
      },
      encryptionKey: String,
      sourceDataId: {
        type: Schema.Types.ObjectId,
        ref: 'Data',
      },
    }],
    code: {
      script: {
        type: String,
      },
      language: {
        type: String,
        enum: ['python', 'r', 'julia', 'bash', 'matlab', 'c', 'cpp', 'javascript', 'other'],
      },
      version: String,
      entryPoint: String,
      repository: {
        url: String,
        branch: String,
        commit: String,
      },
      containerImage: String,
    },
    assignedResources: [{
      type: Schema.Types.ObjectId,
      ref: 'Resource',
    }],
    schedule: {
      startTime: Date,
      deadline: Date,
      isRecurring: {
        type: Boolean,
        default: false,
      },
      recurringPattern: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'monthly'],
        },
        interval: {
          type: Number,
          min: [1, 'Interval must be at least 1'],
        },
        endDate: Date,
      },
    },
    results: {
      type: jobResultSchema,
    },
    privacy: {
      isPrivate: {
        type: Boolean,
        default: true,
      },
      accessibleBy: [{
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        accessLevel: {
          type: String,
          enum: ['read', 'write', 'admin'],
          default: 'read',
        },
      }],
    },
    payment: {
      status: {
        type: String,
        enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
        default: 'unpaid',
      },
      amount: {
        type: Number,
        min: [0, 'Payment amount cannot be negative'],
      },
      currency: {
        type: String,
        default: 'CAL',
      },
      transactionId: String,
      transactionTime: Date,
    },
    blockchainJobId: {
      type: String,
      sparse: true,
      unique: true,
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
jobSchema.index({ user: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ 'schedule.startTime': 1 });
jobSchema.index({ 'schedule.deadline': 1 });
jobSchema.index({ createdAt: 1 });
jobSchema.index({ updatedAt: 1 });
jobSchema.index({ assignedResources: 1 });
jobSchema.index({ tags: 1 });

// Virtual properties
jobSchema.virtual('timeToDeadline').get(function() {
  if (!this.schedule || !this.schedule.deadline) return null;
  return this.schedule.deadline - new Date();
});

jobSchema.virtual('isOverdue').get(function() {
  if (!this.schedule || !this.schedule.deadline) return false;
  return new Date() > this.schedule.deadline && 
         !['completed', 'failed', 'cancelled'].includes(this.status);
});

jobSchema.virtual('duration').get(function() {
  if (!this.results || !this.results.metrics || !this.results.metrics.executionTime) return null;
  return this.results.metrics.executionTime;
});

// Instance methods
jobSchema.methods.updateStatus = async function(newStatus, details = {}) {
  const validTransitions = {
    draft: ['pending', 'cancelled'],
    pending: ['waiting_resources', 'scheduled', 'cancelled'],
    waiting_resources: ['scheduled', 'cancelled'],
    scheduled: ['running', 'cancelled'],
    running: ['paused', 'completed', 'failed', 'timeout'],
    paused: ['running', 'cancelled'],
    completed: [],
    failed: ['pending'], // Allow retry
    cancelled: ['pending'], // Allow restart
    timeout: ['pending'], // Allow retry
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'completed' || newStatus === 'failed') {
    if (details.results) {
      this.results = { ...this.results, ...details.results };
    }
    
    // Update resource metrics
    if (this.assignedResources && this.assignedResources.length > 0) {
      const Resource = mongoose.model('Resource');
      const executionTimeHours = this.results?.metrics?.executionTime 
        ? this.results.metrics.executionTime / 3600 
        : 0;
      
      for (const resourceId of this.assignedResources) {
        const resource = await Resource.findById(resourceId);
        if (resource) {
          await resource.updateMetrics(newStatus === 'completed', executionTimeHours);
        }
      }
    }
  }
  
  return this.save();
};

jobSchema.methods.scheduleJob = async function(startTime, resources) {
  this.schedule.startTime = startTime;
  this.assignedResources = resources;
  await this.updateStatus('scheduled');
  return this;
};

// Static methods
jobSchema.statics.findDueJobs = function() {
  return this.find({
    status: 'scheduled',
    'schedule.startTime': { $lte: new Date() },
  }).sort({ 'schedule.startTime': 1 });
};

jobSchema.statics.findPendingJobs = function(limit = 10) {
  return this.find({
    status: 'pending',
  })
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

jobSchema.statics.getJobStats = async function(userId = null) {
  const match = userId ? { user: mongoose.Types.ObjectId(userId) } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: {
          $avg: '$results.metrics.executionTime',
        },
      },
    },
  ]);
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 