const express = require('express');
const router = express.Router();
const ratingController = require('../controller/rating');
const driverController = require('../controller/driver');

const {auth, authorizeRoles} = require('../middleware/auth')
router.post('/', ratingController.createRating);
router.get('/rating',auth, driverController.getDriverRatings);
router.get('/', ratingController.getAllRatings);
router.get('/:id', ratingController.getRatingById);
router.put('/:id', ratingController.updateRating);
router.delete('/:id', ratingController.deleteRating);

module.exports = router;
