const express = require('express');
const router = express.Router();
const bidController = require('../controller/bid');
const driverController = require('../controller/driver')


// NEW: Get bids for specific job
router.get('/job/:jobId', bidController.getBidsByJob);

// NEW: Accept bid and reject others
router.post('/accept/:bidId', bidController.acceptBid);


// ✅ point to the right controller & match param name
router.get('/driver/:driverId', bidController.getBidsByDriver);

router.get('/', bidController.getAllBids);
router.post('/', bidController.createBid);
router.put('/:id', bidController.updateBid);
router.delete('/:id', bidController.deleteBid);


router.get('/:id', bidController.getBidById);

module.exports = router;
