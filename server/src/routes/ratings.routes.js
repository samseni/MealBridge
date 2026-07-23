const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratings.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Create and view ratings
router.post('/', authMiddleware, ratingsController.createRating);
router.get('/received', authMiddleware, ratingsController.getReceivedRatings);

// Rating interactions
router.post('/:rating_id/reply', authMiddleware, ratingsController.replyToRating);
router.post('/:rating_id/report', authMiddleware, ratingsController.reportRating);
router.post('/:rating_id/vote', authMiddleware, ratingsController.voteHelpful);

// Admin - rating reports
router.get('/reports', authMiddleware, roleMiddleware('admin'), ratingsController.getRatingReports);
router.patch('/reports/:id/resolve', authMiddleware, roleMiddleware('admin'), ratingsController.resolveRatingReport);

module.exports = router;