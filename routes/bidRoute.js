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


module.exports = router;
