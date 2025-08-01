// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();

const  AdminDashboard = require('../controller/admindash');
const  ShipperDashboard  = require('../controller/shipperdash');
const  DriverDashboard  = require('../controller/driverdash');
const  {auth , authorizeRoles}  = require('../middleware/auth');

// Admin Dashboard
router.get('/admin', auth , authorizeRoles('super-admin','admin'), AdminDashboard.getAdminDashboard);

// Shipper Dashboard
router.get('/shipper',auth , authorizeRoles('admin' ,'super-admin', 'shipper'), ShipperDashboard.getShipperDashboard);

// Driver Dashboard
router.get('/driver', auth, authorizeRoles('admin' , 'super-admin','driver'), DriverDashboard.getDriverDashboard);

module.exports = router;
