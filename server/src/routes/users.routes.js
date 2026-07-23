const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Profile management
router.get('/profile', usersController.getProfile);
router.patch('/profile', usersController.updateProfile);
router.patch('/password', usersController.changePassword);

module.exports = router;
