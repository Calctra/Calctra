const express = require('express');
const router = express.Router();
const Data = require('../../models/data.model');
const authMiddleware = require('../middlewares/auth');
const { validations, validate } = require('../../utils/validators');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { hash } = require('../../utils/encryption');
const logger = require('../../utils/logger');

/**
 * @route POST /api/data
 * @desc Create a new dataset
 * @access Private
 */
router.post('/', 
  authMiddleware.authenticate, 
  validations.dataset.create, 
  validate, 
  async (req, res, next) => {
    try {
      const { name, description, dataType, format, metadata, isPublic, isEncrypted, tags, categories } = req.body;
      
      // Create dataset
      const dataset = await Data.create({
        owner: req.user._id,
        name,
        description,
        dataType,
        format,
        metadata: metadata || {},
        visibility: isPublic ? 'public' : 'private',
        encryption: {
          isEncrypted: isEncrypted || false,
          algorithm: isEncrypted ? 'aes-256-gcm' : 'none'
        },
        tags: tags || [],
        categories: categories || [],
        status: 'uploading',
        files: []
      });
      
      // Update user stats
      const User = require('../../models/user.model');
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.totalDatasetsUploaded': 1 }
      });
      
      res.status(201).json({
        success: true,
        message: 'Dataset created successfully',
        data: {
          dataset
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/data
 * @desc Get all datasets with filters
 * @access Private
 */
router.get('/', 
  authMiddleware.authenticate, 
  validations.dataset.list, 
  validate, 
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        visibility,
        search,
        sort = 'createdAt',
        order = 'desc',
        tags,
        categories
      } = req.query;
      
      // Build query
      let query = {};
      
      // Either owned by the user or shared with them or public
      query = {
        $or: [
          { owner: req.user._id },
          { visibility: 'public' },
          { 'accessPermissions.user': req.user._id }
        ]
      };
      
      // Add filters
      if (type) query.dataType = type;
      if (visibility) {
        if (visibility === 'mine') {
          query = { owner: req.user._id };
        } else if (visibility === 'shared') {
          query = { 'accessPermissions.user': req.user._id };
        } else if (visibility === 'public') {
          query = { visibility: 'public' };
        }
      }
      
      if (tags) {
        const tagList = tags.split(',');
        query.tags = { $in: tagList };
      }
      
      if (categories) {
        const categoryList = categories.split(',');
        query.categories = { $in: categoryList };
      }
      
      // Text search
      if (search) {
        query.$text = { $search: search };
      }
      
      // Parse sort options
      const sortOptions = {};
      if (search && sort === 'relevance') {
        sortOptions.score = { $meta: 'textScore' };
      } else {
        sortOptions[sort] = order === 'desc' ? -1 : 1;
      }
      
      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      
      // Execute query
      let datasets;
      if (search && sort === 'relevance') {
        datasets = await Data.find(query, { score: { $meta: 'textScore' } })
          .populate('owner', 'name email')
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit));
      } else {
        datasets = await Data.find(query)
          .populate('owner', 'name email')
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit));
      }
      
      // Get total count
      const total = await Data.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          datasets,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/data/:datasetId
 * @desc Get dataset by ID
 * @access Private
 */
router.get('/:datasetId', 
  authMiddleware.authenticate, 
  validations.dataset.getById, 
  validate, 
  async (req, res, next) => {
    try {
      const { datasetId } = req.params;
      
      const dataset = await Data.findById(datasetId)
        .populate('owner', 'name email')
        .populate('sourceJobId', 'title status')
        .populate('sourceDataId', 'name');
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check if user is authorized to view this dataset
      const isOwner = dataset.owner._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      const hasAccess = dataset.accessPermissions.some(
        perm => perm.user.toString() === req.user._id.toString()
      );
      
      if (!isOwner && !isAdmin && !hasAccess && dataset.visibility !== 'public') {
        throw new ForbiddenError('You do not have permission to view this dataset');
      }
      
      // Increment view count if not owner
      if (!isOwner) {
        await Data.findByIdAndUpdate(datasetId, { $inc: { viewCount: 1 } });
      }
      
      res.json({
        success: true,
        data: {
          dataset
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/data/:datasetId
 * @desc Update dataset details
 * @access Private
 */
router.put('/:datasetId', 
  authMiddleware.authenticate, 
  validations.dataset.update, 
  validate, 
  async (req, res, next) => {
    try {
      const { datasetId } = req.params;
      const { name, description, isPublic, tags, categories, metadata } = req.body;
      
      // Find dataset
      const dataset = await Data.findById(datasetId);
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check ownership
      if (dataset.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to update this dataset');
      }
      
      // Update fields
      if (name !== undefined) dataset.name = name;
      if (description !== undefined) dataset.description = description;
      if (isPublic !== undefined) dataset.visibility = isPublic ? 'public' : 'private';
      if (tags !== undefined) dataset.tags = tags;
      if (categories !== undefined) dataset.categories = categories;
      
      // Update metadata (merge with existing)
      if (metadata) {
        if (!dataset.metadata) dataset.metadata = new Map();
        
        for (const [key, value] of Object.entries(metadata)) {
          dataset.metadata.set(key, value);
        }
      }
      
      // Save changes
      await dataset.save();
      
      res.json({
        success: true,
        message: 'Dataset updated successfully',
        data: {
          dataset
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/data/:datasetId
 * @desc Mark a dataset as deleted
 * @access Private
 */
router.delete('/:datasetId', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { datasetId } = req.params;
      
      // Find dataset
      const dataset = await Data.findById(datasetId);
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check ownership
      if (dataset.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to delete this dataset');
      }
      
      // Mark as deleted instead of deleting it
      await dataset.updateStatus('deleted');
      
      // TODO: Schedule physical deletion of files
      
      res.json({
        success: true,
        message: 'Dataset deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/data/:datasetId/files
 * @desc Add a file to a dataset
 * @access Private
 */
router.post('/:datasetId/files', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { datasetId } = req.params;
      const { filename, originalName, mimetype, encoding, size, path, checksum } = req.body;
      
      if (!filename || !size || !path) {
        throw new BadRequestError('Filename, size, and path are required');
      }
      
      // Find dataset
      const dataset = await Data.findById(datasetId);
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check ownership
      if (dataset.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to modify this dataset');
      }
      
      // Calculate file checksum if not provided
      let fileChecksum = checksum;
      if (!fileChecksum) {
        // In a real implementation, we would calculate checksum from file content
        fileChecksum = hash.sha256(`${filename}-${Date.now()}`);
      }
      
      // Create file metadata
      const fileData = {
        filename,
        originalName: originalName || filename,
        mimetype: mimetype || 'application/octet-stream',
        encoding: encoding || 'utf8',
        size,
        path,
        checksum: fileChecksum,
        lastModified: new Date(),
        extension: filename.split('.').pop()
      };
      
      // Add file to dataset
      await dataset.addFile(fileData);
      
      // If this was the first file, update status to available
      if (dataset.status === 'uploading' && dataset.files.length === 1) {
        await dataset.updateStatus('available');
      }
      
      res.status(201).json({
        success: true,
        message: 'File added successfully',
        data: {
          file: fileData,
          dataset: {
            id: dataset._id,
            name: dataset.name,
            totalSize: dataset.totalSize,
            fileCount: dataset.files.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/data/:datasetId/files/:fileId
 * @desc Remove a file from a dataset
 * @access Private
 */
router.delete('/:datasetId/files/:fileId', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { datasetId, fileId } = req.params;
      
      // Find dataset
      const dataset = await Data.findById(datasetId);
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check ownership
      if (dataset.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to modify this dataset');
      }
      
      // Remove file
      const removed = await dataset.removeFile(fileId);
      
      if (!removed) {
        throw new NotFoundError('File not found in dataset');
      }
      
      // If no files left, update status
      if (dataset.files.length === 0) {
        await dataset.updateStatus('uploading');
      }
      
      res.json({
        success: true,
        message: 'File removed successfully',
        data: {
          dataset: {
            id: dataset._id,
            name: dataset.name,
            totalSize: dataset.totalSize,
            fileCount: dataset.files.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/data/:datasetId/share
 * @desc Share dataset with another user
 * @access Private
 */
router.post('/:datasetId/share', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { datasetId } = req.params;
      const { email, accessLevel = 'read', expiration } = req.body;
      
      if (!email) {
        throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
      }
      
      // Find dataset
      const dataset = await Data.findById(datasetId);
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check ownership
      if (dataset.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to share this dataset');
      }
      
      // Find user to share with
      const User = require('../../models/user.model');
      const targetUser = await User.findByEmail(email);
      
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }
      
      // Set expiration date if provided
      let expirationDate = null;
      if (expiration) {
        expirationDate = new Date(expiration);
      }
      
      // Grant access
      await dataset.grantAccess(targetUser._id, accessLevel, req.user._id, expirationDate);
      
      // If dataset was private, update to shared
      if (dataset.visibility === 'private') {
        dataset.visibility = 'shared';
        await dataset.save();
      }
      
      res.json({
        success: true,
        message: 'Dataset shared successfully',
        data: {
          shared: {
            user: {
              id: targetUser._id,
              email: targetUser.email,
              name: targetUser.name
            },
            accessLevel,
            expiration: expirationDate
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/data/:datasetId/share/:userId
 * @desc Remove dataset sharing for a user
 * @access Private
 */
router.delete('/:datasetId/share/:userId', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { datasetId, userId } = req.params;
      
      // Find dataset
      const dataset = await Data.findById(datasetId);
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check ownership
      if (dataset.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to modify dataset sharing');
      }
      
      // Revoke access
      await dataset.revokeAccess(userId);
      
      // If no more shares, set visibility back to private
      if (dataset.accessPermissions.length === 0 && dataset.visibility === 'shared') {
        dataset.visibility = 'private';
        await dataset.save();
      }
      
      res.json({
        success: true,
        message: 'Dataset sharing removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/data/:datasetId/download/:fileId
 * @desc Generate download URL/token for a file
 * @access Private
 */
router.get('/:datasetId/download/:fileId', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { datasetId, fileId } = req.params;
      
      // Find dataset
      const dataset = await Data.findById(datasetId);
      
      if (!dataset) {
        throw new NotFoundError('Dataset not found');
      }
      
      // Check access permissions
      const isOwner = dataset.owner.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      const hasAccess = dataset.accessPermissions.some(
        perm => perm.user.toString() === req.user._id.toString()
      );
      const isPublic = dataset.visibility === 'public';
      
      if (!isOwner && !isAdmin && !hasAccess && !isPublic) {
        throw new ForbiddenError('You do not have permission to download this file');
      }
      
      // Find the file
      const file = dataset.files.find(f => f._id.toString() === fileId);
      
      if (!file) {
        throw new NotFoundError('File not found');
      }
      
      // Increment download count
      await dataset.incrementDownloadCount();
      
      // Generate download token (in a real app, this would create a signed URL)
      const downloadToken = hash.random.token(16);
      
      // Store token with short expiration (in a real app, this would be stored in Redis)
      // For now, we'll just return the file path and token
      
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/download/${downloadToken}`,
          token: downloadToken,
          file: {
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype
          },
          expiresIn: '10 minutes'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/data/search
 * @desc Search for datasets
 * @access Private
 */
router.post('/search', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { query, filters = {}, page = 1, limit = 10 } = req.body;
      
      if (!query) {
        throw new BadRequestError('Search query is required');
      }
      
      // Build search options
      const searchOptions = {
        limit: Number(limit),
        ...filters
      };
      
      // Ensure user can only see what they have access to
      searchOptions.visibility = 'public';
      
      // Execute search
      const results = await Data.search(query, searchOptions);
      
      // Get total count (approximate)
      const total = results.length;
      
      res.json({
        success: true,
        data: {
          results,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 