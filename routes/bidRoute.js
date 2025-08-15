const express = require('express');
const router = express.Router();
const bidController = require('../controller/bid');
const driverController = require('../controller/driver')


router.get('/:id', bidController.getBidById);
router.post('/', bidController.createBid);

// ✅ point to the right controller & match param name
router.get('/driver/:driverId', bidController.getBidsByDriver);

router.get('/', bidController.getAllBids);
router.put('/:id', bidController.updateBid);
router.delete('/:id', bidController.deleteBid);

// NEW: Get bids for specific job
router.get('/job/:jobId', authMiddleware, bidController.getBidsByJob);

// NEW: Accept bid and reject others
router.post('/accept/:bidId', authMiddleware, bidController.acceptBid);


module.exports = router;
