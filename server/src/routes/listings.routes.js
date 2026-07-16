const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, roleMiddleware('donor'), listingsController.createListing);
router.get('/nearby', authMiddleware, roleMiddleware('ngo'), listingsController.getNearbyListings);
router.get('/mine', authMiddleware, listingsController.getMyListings);
router.get('/:id', authMiddleware, listingsController.getListingById);
router.patch('/:id', authMiddleware, roleMiddleware('donor'), listingsController.updateListing);
router.delete('/:id', authMiddleware, roleMiddleware('donor'), listingsController.deleteListing);

module.exports = router;