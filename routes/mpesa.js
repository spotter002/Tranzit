const express = require('express');
const router = express.Router();
const stkPush = require('../controller/mpesaController');
const mpesaCallback = require('../controller/mpesacallbackController');

router.post('/stkpush', stkPush);
router.post('/callback', mpesaCallback);

module.exports = router;
