// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();

const  AdminDashboard = require('../controller/admindash');
const  ShipperDashboard  = require('../controller/shipperdash');
const  DriverDashboard  = require('../controller/driverdash');
const  {auth , authorizeRoles}  = require('../middleware/auth');

// Admin Dashboard
router.get('/admin', AdminDashboard.getAdminDashboard);

// Shipper Dashboard
router.get('/shipper', ShipperDashboard.getShipperDashboard);

// Driver Dashboard
router.get('/driver', DriverDashboard.getDriverDashboard);

module.exports = router;
