const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Notification schema
 */
const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot be more than 500 characters'],
    },
    type: {
      type: String,
      enum: [
        'job_completed',
        'job_failed',
        'job_started',
        'job_scheduled',
        'resource_matched',
        'resource_status',
        'payment_received',
        'payment_sent',
        'account_update',
        'system_alert',
        'data_shared',
        'review_received',
        'custom',
      ],
      required: [true, 'Notification type is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
    linkType: {
      type: String,
      enum: ['none', 'job', 'resource', 'data', 'payment', 'user', 'review', 'other'],
      default: 'none',
    },
    linkId: {
      type: Schema.Types.ObjectId,
      refPath: 'linkModel',
    },
    linkModel: {
      type: String,
      enum: ['Job', 'Resource', 'Data', 'User', 'Review'],
    },
    linkUrl: {
      type: String,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
    },
    deliveryStatus: {
      email: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        error: String,
      },
      push: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        error: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRemoved: 1, createdAt: -1 });

// TTL index for expiring notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, isRead: false, isRemoved: false });
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { user: userId, isRead: false, isRemoved: false },
    { isRead: true, updatedAt: new Date() }
  );
  return result.nModified;
};

notificationSchema.statics.removeAll = async function(userId) {
  const result = await this.updateMany(
    { user: userId, isRemoved: false },
    { isRemoved: true, updatedAt: new Date() }
  );
  return result.nModified;
};

notificationSchema.statics.createNotification = async function(data) {
  const { user, title, message, type, priority, linkType, linkId, linkModel, linkUrl, metadata, expiresAt } = data;
  
  // Create notification
  const notification = await this.create({
    user,
    title,
    message,
    type,
    priority: priority || 'normal',
    linkType: linkType || 'none',
    linkId,
    linkModel,
    linkUrl,
    metadata,
    expiresAt,
  });
  
  // Send notification via configured channels
  try {
    // Get user preferences
    const User = mongoose.model('User');
    const userDoc = await User.findById(user);
    
    if (!userDoc) {
      throw new Error('User not found');
    }
    
    // Check if user wants email notifications
    if (userDoc.preferences.notificationEmail) {
      // In a real implementation, this would send an email
      // For now, just mark as sent
      notification.deliveryStatus.email = {
        sent: true,
        sentAt: new Date(),
      };
    }
    
    // Check if user wants site notifications
    if (userDoc.preferences.notificationSite) {
      // In a real implementation, this might notify via WebSockets
      // For now, just mark as available on site
    }
    
    await notification.save();
  } catch (error) {
    // Log error but don't fail the notification creation
    console.error(`Failed to deliver notification ${notification._id}:`, error);
  }
  
  return notification;
};

// Instance methods
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.updatedAt = new Date();
  return this.save();
};

notificationSchema.methods.remove = async function() {
  this.isRemoved = true;
  this.updatedAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 