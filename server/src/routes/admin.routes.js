const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/verifications', authMiddleware, roleMiddleware('admin'), adminController.getPendingVerifications);
router.patch('/verify/:userId', authMiddleware, roleMiddleware('admin'), adminController.verifyUser);
router.get('/stats', authMiddleware, roleMiddleware('admin'), adminController.getStats);
router.get('/users', authMiddleware, roleMiddleware('admin'), adminController.getUsers);

module.exports = router;