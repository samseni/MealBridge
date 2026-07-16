const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratings.controller');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, ratingsController.createRating);
router.get('/received', authMiddleware, ratingsController.getReceivedRatings);

module.exports = router;