const express = require('express')
const router = express.Router()
const DeliveryController = require('../controller/delivery')
const {auth, authorizeRoles} = require('../middleware/auth')

// shipper route
router.post('/', auth,DeliveryController.createDelivery)
router.get('/',DeliveryController.getAllDeliveries)
router.get('/:id',auth, DeliveryController.getDeliveryById)
router.put('/:id',auth, authorizeRoles('admin','shipper' ), DeliveryController.updateDelivery)
router.delete('/:id',auth, authorizeRoles('admin' , 'shipper'), DeliveryController.deleteDelivery)
module.exports = router