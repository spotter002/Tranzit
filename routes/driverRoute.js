const express = require('express')
const router = express.Router()
const driverController = require('../controller/driver')
const {auth, authorizeRoles} = require('../middleware/auth')
//driver routes
router.post('/driver/register',auth, authorizeRoles('admin'), driverController.registerDriver)
router.get('/driver', driverController.getDriver)
router.get('/driver/:id', driverController.getDriverById)
router.put('/driver/:id',auth, authorizeRoles('admin'), driverController.updateDriver)
router.delete('/driver/:id',auth, authorizeRoles('admin'), driverController.deleteDriver)
module.exports = router