const express = require('express')
const router = express.Router()
const loginController = require('../controller/loginControllers')
const driverController = require('../controller/driver')
const {auth, authorizeRoles} = require('../middleware/auth')
// user routes
router.post('/register',loginController.registerUser)
router.post('/login',loginController.loginUser)
router.get('/user',auth, loginController.getAllUsers)
router.put('/:id', loginController.updateUser)


module.exports = router