const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Data access permission schema
 */
const accessPermissionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accessLevel: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read',
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  { _id: false }
);

/**
 * File metadata schema
 */
const fileMetadataSchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
    },
    mimetype: {
      type: String,
    },
    encoding: {
      type: String,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    checksum: {
      type: String,
    },
    lastModified: {
      type: Date,
    },
    extension: {
      type: String,
    },
  },
  { _id: false }
);

/**
 * Encryption metadata schema
 */
const encryptionMetadataSchema = new Schema(
  {
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    algorithm: {
      type: String,
      enum: ['aes-256-gcm', 'chacha20-poly1305', 'homomorphic', 'none'],
      default: 'none',
    },
    keyId: {
      type: String,
    },
    iv: {
      type: String,
    },
    authTag: {
      type: String,
    },
    publicKeyUsed: {
      type: String,
    },
    encryptedChunks: {
      type: Boolean,
      default: false,
    },
    chunkSize: {
      type: Number,
    },
  },
  { _id: false }
);

/**
 * Dataset schema
 */
const dataSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Data owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Dataset name is required'],
      trim: true,
      maxlength: [200, 'Name cannot be more than 200 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    dataType: {
      type: String,
      enum: [
        'dataset',
        'model',
        'algorithm',
        'result',
        'visualization',
        'document',
        'image',
        'audio',
        'video',
        'other',
      ],
      required: [true, 'Data type is required'],
    },
    format: {
      type: String,
    },
    files: {
      type: [fileMetadataSchema],
      validate: {
        validator: function(files) {
          return files.length > 0;
        },
        message: 'At least one file is required',
      },
    },
    totalSize: {
      type: Number,
      default: 0,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    tags: {
      type: [String],
    },
    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },
    accessPermissions: {
      type: [accessPermissionSchema],
    },
    encryption: {
      type: encryptionMetadataSchema,
      default: () => ({}),
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'available', 'archived', 'deleted'],
      default: 'uploading',
    },
    sourceJobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
    },
    sourceDataId: {
      type: Schema.Types.ObjectId,
      ref: 'Data',
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    blockchainDataId: {
      type: String,
      sparse: true,
      unique: true,
    },
    categories: {
      type: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
dataSchema.index({ name: 'text', description: 'text' });
dataSchema.index({ owner: 1 });
dataSchema.index({ visibility: 1 });
dataSchema.index({ status: 1 });
dataSchema.index({ dataType: 1 });
dataSchema.index({ tags: 1 });
dataSchema.index({ categories: 1 });
dataSchema.index({ createdAt: 1 });
dataSchema.index({ expiresAt: 1 });

// Virtual reference to jobs that use this data
dataSchema.virtual('usedInJobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'inputFiles.sourceDataId',
});

// Instance methods
dataSchema.methods.addFile = function(fileData) {
  this.files.push(fileData);
  this.totalSize += fileData.size;
  return this.save();
};

dataSchema.methods.removeFile = function(fileId) {
  const fileIndex = this.files.findIndex(f => f._id.toString() === fileId.toString());
  if (fileIndex === -1) return false;
  
  const removedSize = this.files[fileIndex].size;
  this.files.splice(fileIndex, 1);
  this.totalSize -= removedSize;
  
  return this.save();
};

dataSchema.methods.updateStatus = function(newStatus) {
  const validTransitions = {
    uploading: ['processing', 'available', 'deleted'],
    processing: ['available', 'deleted'],
    available: ['processing', 'archived', 'deleted'],
    archived: ['available', 'deleted'],
    deleted: [],
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  return this.save();
};

dataSchema.methods.grantAccess = function(userId, accessLevel, grantingUser, expiration = null) {
  // Check if user already has permissions
  const existingPermIndex = this.accessPermissions.findIndex(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingPermIndex !== -1) {
    // Update existing permission
    this.accessPermissions[existingPermIndex].accessLevel = accessLevel;
    this.accessPermissions[existingPermIndex].grantedBy = grantingUser;
    this.accessPermissions[existingPermIndex].grantedAt = new Date();
    this.accessPermissions[existingPermIndex].expiresAt = expiration;
  } else {
    // Add new permission
    this.accessPermissions.push({
      user: userId,
      accessLevel,
      grantedBy: grantingUser,
      grantedAt: new Date(),
      expiresAt: expiration,
    });
  }
  
  return this.save();
};

dataSchema.methods.revokeAccess = function(userId) {
  const initialLength = this.accessPermissions.length;
  this.accessPermissions = this.accessPermissions.filter(
    p => p.user.toString() !== userId.toString()
  );
  
  if (this.accessPermissions.length !== initialLength) {
    return this.save();
  }
  
  return this;
};

dataSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// Static methods
dataSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId });
};

dataSchema.statics.findSharedWithUser = function(userId) {
  return this.find({
    $or: [
      { 'accessPermissions.user': userId },
      { visibility: 'public' },
    ],
  });
};

dataSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: { $ne: 'deleted' },
  });
};

dataSchema.statics.search = function(query, options = {}) {
  const searchQuery = {
    $text: { $search: query },
  };
  
  if (options.owner) {
    searchQuery.owner = options.owner;
  }
  
  if (options.dataType) {
    searchQuery.dataType = options.dataType;
  }
  
  if (options.visibility) {
    searchQuery.visibility = options.visibility;
  }
  
  if (options.tags && options.tags.length > 0) {
    searchQuery.tags = { $in: options.tags };
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

const Data = mongoose.model('Data', dataSchema);

module.exports = Data; 