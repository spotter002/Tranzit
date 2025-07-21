const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');

router.post('/', bidController.createBid);
router.get('/', bidController.getAllBids);
router.get('/:id', bidController.getBidById);
router.put('/:id', bidController.updateBid);
router.delete('/:id', bidController.deleteBid);

module.exports = router;
