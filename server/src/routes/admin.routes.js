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
router.get('/verifications', adminController.getVerificationRequests);
router.patch('/verifications/:id/review', adminController.reviewVerification);
router.patch('/verifications/:id/approve', adminController.approveNGO);
router.patch('/verifications/:id/reject', adminController.rejectNGO);

// Platform statistics & analytics
router.get('/stats', adminController.getPlatformStats);
router.get('/analytics', adminController.getAnalytics);

// Reports
router.get('/reports/export', adminController.exportReport);

// Recent activity
router.get('/activity', adminController.getRecentActivity);

module.exports = router;
