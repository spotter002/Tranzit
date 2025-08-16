const express = require('express');
const router = express.Router();
const bidController = require('../controller/bid');
const { auth, authorizeRoles } = require('../middleware/auth');

// More specific routes first
router.get(
  '/job/:jobId',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.getBidsByJob
);

router.post(
  '/accept/:bidId',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.acceptBid
);

// PATCH /bid/:bidId/status
router.patch(
  '/:bidId/:status',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.updateBidStatus
);


router.get(
  '/driver/:driverId',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.getBidsByDriver
);

// General routes
router.get(
  '/',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.getAllBids
);

router.post(
  '/',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.createBid
);

router.put(
  '/:id',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.updateBid
);

router.delete(
  '/:id',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.deleteBid
);

router.get(
  '/:id',
  auth,
  authorizeRoles('shipper', 'driver', 'admin'),
  bidController.getBidById
);

module.exports = router;
