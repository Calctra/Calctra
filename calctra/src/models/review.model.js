const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Review schema for resources
 */
const reviewSchema = new Schema(
  {
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource ID is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
    response: {
      comment: {
        type: String,
        maxlength: [500, 'Response cannot be more than 500 characters'],
      },
      date: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
    },
    isVerifiedCustomer: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      count: {
        type: Number,
        default: 0,
      },
      users: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
    reportedBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      date: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Only allow one review per resource per user (unless from different jobs)
reviewSchema.index({ resource: 1, user: 1, job: 1 }, { unique: true });

// Static method to get average rating and count
reviewSchema.statics.getAverageRating = async function(resourceId) {
  const stats = await this.aggregate([
    {
      $match: { resource: resourceId, status: 'approved' },
    },
    {
      $group: {
        _id: '$resource',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.length > 0
    ? {
        average: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
        count: stats[0].count,
      }
    : {
        average: 0,
        count: 0,
      };
};

// Pre-save middleware to set isVerifiedCustomer
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.job) {
    // If review is linked to a job, mark as verified customer
    this.isVerifiedCustomer = true;
    
    // Auto-approve verified customer reviews
    this.status = 'approved';
  }
  next();
});

// Post-save middleware to update resource rating
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const Resource = mongoose.model('Resource');
  
  // Calculate new average rating
  const { average, count } = await Review.getAverageRating(this.resource);
  
  // Update resource with new rating
  await Resource.findByIdAndUpdate(this.resource, {
    'rating.average': average,
    'rating.count': count,
  });
});

// Post-remove middleware to update resource rating
reviewSchema.post('remove', async function() {
  const Review = this.constructor;
  const Resource = mongoose.model('Resource');
  
  // Calculate new average rating
  const { average, count } = await Review.getAverageRating(this.resource);
  
  // Update resource with new rating
  await Resource.findByIdAndUpdate(this.resource, {
    'rating.average': average,
    'rating.count': count,
  });
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 