const express = require('express');
const router = express.Router();
const featuredController = require('../controllers/featuredController');

router.post('/', featuredController.createFeaturedDriver);
router.get('/', featuredController.getAllFeaturedDrivers);
router.get('/:id', featuredController.getFeaturedDriverById);
router.put('/:id', featuredController.updateFeaturedDriver);
router.delete('/:id', featuredController.deleteFeaturedDriver);

module.exports = router;
