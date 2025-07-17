const express = require('express')
const router = express.Router()
const shipperController = require('../controller/shipper')
const {auth, authorizeRoles} = require('../middleware/auth')

// shipper route
router.post('/', shipperController.registerShipper)
router.get('/',shipperController.getAllShippers)
router.get('/:id',auth, shipperController.getShipperById)
router.put('/:id',auth, authorizeRoles('admin','shipper' ), shipperController.updateShipper)
router.delete('/:id',auth, authorizeRoles('admin' , 'shipper'), shipperController.deleteShipper)
module.exports = router