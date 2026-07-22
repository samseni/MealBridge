const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authMiddleware } = require('../middleware/auth');

router.get('/my-analytics', authMiddleware, analyticsController.getMyAnalytics);

module.exports = router;