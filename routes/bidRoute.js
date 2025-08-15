const express = require('express');
const router = express.Router();
const bidController = require('../controller/bid');
const driverController = require('../controller/driver')
const {auth, authorizeRoles} = require('../middleware/auth')


// NEW: Get bids for specific job
router.get('/job/:jobId',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.getBidsByJob);

// NEW: Accept bid and reject others
router.post('/accept/:bidId',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.acceptBid);


// ✅ point to the right controller & match param name
router.get('/driver/:driverId',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.getBidsByDriver);

router.get('/',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.getAllBids);
router.post('/',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.createBid);
router.put('/:id',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.updateBid);
router.delete('/:id',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.deleteBid);


router.get('/:id',auth, authorizeRoles('shipper', 'driver', 'admin'), bidController.getBidById);

module.exports = router;
