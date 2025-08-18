const express = require('express');
const router = express.Router();
const ratingController = require('../controller/rating');
const driverController = require('../controller/driver'); // already being used
const { auth, authorizeRoles } = require('../middleware/auth');

// ⭐ Create rating
router.post('/', auth, ratingController.createRating);

// ⭐ Get all ratings
router.get('/',auth, ratingController.getAllRatings);

// ⭐ Get ratings by shipper userId
router.get('/shipper/:id', ratingController.getRatingsByShipper);

// ⭐ Get ratings by driver userId
router.get('/driver/:id', ratingController.getRatingsByDriver);

// ⭐ Top rated drivers
router.get('/featured/top-rated-drivers', ratingController.getTopRatedDrivers);

// ⭐ Top rated shippers
router.get('/featured/top-rated-shippers', ratingController.getTopRatedShippers);

// ⭐ Update rating
router.put('/:id', auth, ratingController.updateRating);

// ❌ Delete rating
router.delete('/:id', auth, ratingController.deleteRating);

// ⭐ Get single rating(s) by userId (checks driver/shipper)
router.get('/:id', ratingController.getRatingById);


module.exports = router;
