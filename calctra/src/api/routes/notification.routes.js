const express = require('express');
const router = express.Router();
const Notification = require('../../models/notification.model');
const authMiddleware = require('../middlewares/auth');
const { BadRequestError, NotFoundError } = require('../../utils/errors');

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        unreadOnly = false,
        type,
        priority,
      } = req.query;
      
      // Build query
      const query = { 
        user: req.user._id,
        isRemoved: false,
      };
      
      // Add filters
      if (unreadOnly === 'true') query.isRead = false;
      if (type) query.type = type;
      if (priority) query.priority = priority;
      
      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      
      // Get notifications
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      // Get total count
      const total = await Notification.countDocuments(query);
      
      // Get unread count
      const unreadCount = await Notification.getUnreadCount(req.user._id);
      
      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const unreadCount = await Notification.getUnreadCount(req.user._id);
      
      res.json({
        success: true,
        data: {
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/notifications/:id
 * @desc Get notification by ID
 * @access Private
 */
router.get('/:id', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }
      
      // Check ownership
      if (notification.user.toString() !== req.user._id.toString()) {
        throw new BadRequestError('You do not have permission to view this notification', 'UNAUTHORIZED');
      }
      
      res.json({
        success: true,
        data: {
          notification,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }
      
      // Check ownership
      if (notification.user.toString() !== req.user._id.toString()) {
        throw new BadRequestError('You do not have permission to update this notification', 'UNAUTHORIZED');
      }
      
      // Mark as read
      if (!notification.isRead) {
        await notification.markAsRead();
      }
      
      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/notifications/:id/unread
 * @desc Mark notification as unread
 * @access Private
 */
router.put('/:id/unread', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }
      
      // Check ownership
      if (notification.user.toString() !== req.user._id.toString()) {
        throw new BadRequestError('You do not have permission to update this notification', 'UNAUTHORIZED');
      }
      
      // Mark as unread
      notification.isRead = false;
      notification.updatedAt = new Date();
      await notification.save();
      
      res.json({
        success: true,
        message: 'Notification marked as unread',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/notifications/:id
 * @desc Remove notification
 * @access Private
 */
router.delete('/:id', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const notification = await Notification.findById(id);
      
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }
      
      // Check ownership
      if (notification.user.toString() !== req.user._id.toString()) {
        throw new BadRequestError('You do not have permission to remove this notification', 'UNAUTHORIZED');
      }
      
      // Remove notification
      await notification.remove();
      
      res.json({
        success: true,
        message: 'Notification removed',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const count = await Notification.markAllAsRead(req.user._id);
      
      res.json({
        success: true,
        message: `${count} notifications marked as read`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/notifications/remove-all
 * @desc Remove all notifications
 * @access Private
 */
router.delete('/remove-all', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const count = await Notification.removeAll(req.user._id);
      
      res.json({
        success: true,
        message: `${count} notifications removed`,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 