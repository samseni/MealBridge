const express = require('express');
const router = express.Router();
const claimsController = require('../controllers/claims.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.post('/:listingId', authMiddleware, roleMiddleware('ngo'), claimsController.createClaim);
router.get('/mine', authMiddleware, claimsController.getMyClaims);
router.patch('/:id/pickup', authMiddleware, roleMiddleware('ngo'), claimsController.markInTransit);
router.patch('/:id/complete', authMiddleware, roleMiddleware('donor'), claimsController.markCompleted);
router.delete('/:id', authMiddleware, roleMiddleware('ngo'), claimsController.cancelClaim);

module.exports = router;