const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getProfile);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.patch('/change-password', authMiddleware, authController.changePassword);
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;