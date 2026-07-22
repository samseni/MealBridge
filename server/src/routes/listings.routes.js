const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Image upload routes
router.post('/upload-images', authMiddleware, roleMiddleware('donor'), upload.array('images', 5), listingsController.uploadImages);
router.delete('/images/:filename', authMiddleware, roleMiddleware('donor'), listingsController.deleteImage);

// Listing routes
router.post('/', authMiddleware, roleMiddleware('donor'), listingsController.createListing);
router.get('/all', authMiddleware, roleMiddleware('ngo'), listingsController.getAllListings);
router.get('/nearby', authMiddleware, roleMiddleware('ngo'), listingsController.getNearbyListings);
router.get('/mine', authMiddleware, listingsController.getMyListings);
router.get('/:id', authMiddleware, listingsController.getListingById);
router.patch('/:id', authMiddleware, roleMiddleware('donor'), listingsController.updateListing);
router.delete('/:id', authMiddleware, roleMiddleware('donor'), listingsController.deleteListing);

module.exports = router;