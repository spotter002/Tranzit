const express = require('express');
const router = express.Router();
const bidController = require('../controller/bid');
const driverController = require('../controller/driver')


router.get('/:id', bidController.getBidById);
router.post('/', bidController.createBid);

router.get('/:id', driverController.getBidsByDriver);

router.put('/:id', bidController.updateBid);
router.delete('/:id', bidController.deleteBid);

module.exports = router;
