const express = require('express');
const router = express.Router();
const walletController = require('../controller/transaction');
const {auth, authorizeRoles} = require('../middleware/auth')
router.post('/create', auth, authorizeRoles('shipper', 'driver', 'admin', 'super-admin'), walletController.createWallet);
router.post('/deposit', auth, authorizeRoles('shipper', 'driver', 'admin'),walletController.depositFunds);
router.post('/pay-driver', auth, authorizeRoles('shipper', 'driver', 'admin'),walletController.payDriver);
router.get('/get-wallet',auth, authorizeRoles('shipper', 'driver', 'admin'), walletController.getWallet);
router.post('/withdraw',auth, authorizeRoles('shipper', 'driver', 'admin'), walletController.withdrawFunds);
router.get('/get-all-transactions', auth, authorizeRoles('admin'), walletController.getAllTransactions);
router.get('/get-all-wallets', auth, authorizeRoles('admin'), walletController.getAllWallets);
router.delete('/:id', auth, authorizeRoles('admin'), walletController.deleteWallet);
module.exports = router;
