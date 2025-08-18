const express = require('express')
const router = express.Router()
const driverController = require('../controller/driver')
const {auth, authorizeRoles} = require('../middleware/auth')
//driver routes
router.post('/driver/register', driverController.registerDriver)
router.get('/driver', driverController.getDriver)
router.get('/driver/:id', driverController.getDriverById)
router.put('/driver/:id',auth, authorizeRoles('admin','super-admin'), driverController.updateDriver)
router.delete('/driver/:id',auth, authorizeRoles('admin','super-admin'), driverController.deleteDriver)
module.exports = router
