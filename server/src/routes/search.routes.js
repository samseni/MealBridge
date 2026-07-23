const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Saved searches
router.post('/saved', searchController.saveSearch);
router.get('/saved', searchController.getSavedSearches);
router.patch('/saved/:id/use', searchController.useSavedSearch);
router.delete('/saved/:id', searchController.deleteSavedSearch);

// Search history
router.post('/history', searchController.addSearchHistory);
router.get('/history', searchController.getSearchHistory);
router.delete('/history', searchController.clearSearchHistory);

module.exports = router;