const express = require('express');
const chatController = require('../controller/chatController');
const {authorizeRoles, auth} = require('../middleware/auth');
const router = express.Router();

router.post('/send', chatController.sendMessage);
router.get('/:deliveryId', chatController.getChat);

module.exports = router;
