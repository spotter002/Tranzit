const express = require('express')
const router = express.Router()
const DeliveryController = require('../controller/delivery')
const {auth, authorizeRoles} = require('../middleware/auth')

// shipper route
router.post('/', DeliveryController.createDelivery)
// router.get('/',DeliveryController.getAllShippers)
// router.get('/:id',auth, DeliveryController.getShipperById)
// router.put('/:id',auth, authorizeRoles('admin','shipper' ), DeliveryController.updateShipper)
// router.delete('/:id',auth, authorizeRoles('admin' , 'shipper'), DeliveryController.deleteShipper)
module.exports = router