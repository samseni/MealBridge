const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Message routes
router.post('/', messagesController.sendMessage);
router.get('/conversations', messagesController.getUserConversations);
router.get('/claim/:claim_id', messagesController.getClaimMessages);
router.patch('/claim/:claim_id/read', messagesController.markAsRead);

module.exports = router;