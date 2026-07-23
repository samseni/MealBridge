const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get notifications
router.get('/', notificationsController.getNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);

// Mark as read
router.patch('/:id/read', notificationsController.markAsRead);
router.patch('/read-all', notificationsController.markAllAsRead);

// Delete notifications
router.delete('/:id', notificationsController.deleteNotification);
router.delete('/', notificationsController.clearAll);

module.exports = router;