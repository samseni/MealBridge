const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authMiddleware } = require('../middleware/auth');
const profileUpload = require('../middleware/profileUpload');

// All routes require authentication
router.use(authMiddleware);

// Profile management
router.get('/profile', usersController.getProfile);
router.patch('/profile', usersController.updateProfile);
router.patch('/password', usersController.changePassword);

// Profile picture
router.post('/profile/picture', profileUpload.single('picture'), usersController.uploadProfilePicture);
router.delete('/profile/picture', usersController.deleteProfilePicture);

module.exports = router;
