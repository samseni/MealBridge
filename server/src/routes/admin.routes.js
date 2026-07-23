const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// User management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/status', adminController.toggleUserStatus);

// NGO verification
router.get('/verifications/pending', adminController.getPendingVerifications);
router.patch('/verifications/:id/approve', adminController.approveNGO);
router.patch('/verifications/:id/reject', adminController.rejectNGO);

// Platform statistics
router.get('/stats', adminController.getPlatformStats);

// Recent activity
router.get('/activity', adminController.getRecentActivity);

module.exports = router;
