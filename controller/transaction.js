const { User, Driver, Shipper, Wallet, Transaction } = require('../model/tranzitdb');
const mongoose = require('mongoose');

// Create a wallet
exports.createWallet = async (req, res) => {
  try {
    let ownerId = req.user.userId;
    const user = await User.findById(ownerId).populate(['shipper', 'driver']);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let phone;
    let ownerType = user.role;
    let name = user.name || 'Unknown';

    if (user.role === 'super-admin') {
      phone = user.phone;
      ownerId = user._id;
    } else if (user.role === 'shipper') {
      phone = user.shipper?.phone;
      name = user.shipper?.name || name;
      ownerId = user.shipper._id;
    } else if (user.role === 'driver') {
      phone = user.driver?.phone;
      name = user.driver?.name || name;
      ownerId = user.driver._id;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    const existingWallet = await Wallet.findOne({ phone });
    if (existingWallet) {
      return res.status(400).json({ success: false, message: 'Wallet already exists' });
    }

    const wallet = await Wallet.create({
      phone,
      ownerType,
      name,
      ownerId
    });

    await Transaction.create({
      toWallet: wallet._id,
      amount: 0,
      type: 'wallet_creation',
      status: 'completed'
    });

    res.json({ success: true, message: 'Wallet created successfully', wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating wallet', error: err.message });
  }
};

// Get wallet
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(['shipper', 'driver']);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let ownerId;
    if (user.role === 'shipper') ownerId = user.shipper?._id;
    else if (user.role === 'driver') ownerId = user.driver?._id;
    else ownerId = mongoose.Types.ObjectId(req.user.userId);

    const wallet = await Wallet.findOne({ ownerId });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    return res.json({ success: true, wallet });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error getting wallet', error: err.message });
  }
};

// Deposit
exports.depositFunds = async (req, res) => {
  try {
    const shipperId = req.user.userId;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount' });
    }

    const shipper = await User.findById(shipperId).populate('shipper');
    if (!shipper) return res.status(404).json({ success: false, message: 'Shipper not found' });

    const wallet = await Wallet.findOne({ phone: shipper.shipper.phone });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
      toWallet: wallet._id,
      amount,
      type: 'deposit',
      status: 'completed'
    });

    return res.json({ success: true, message: 'Deposit successful', wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error depositing funds', error: err.message });
  }
};

// Withdraw
exports.withdrawFunds = async (req, res) => {
  try {
    const shipperId = req.user.userId;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount' });
    }

    const shipper = await User.findById(shipperId).populate('shipper');
    if (!shipper) return res.status(404).json({ success: false, message: 'Shipper not found' });

    const wallet = await Wallet.findOne({ phone: shipper.shipper.phone });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds' });
    }

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      fromWallet: wallet._id,
      amount,
      type: 'withdrawal',
      status: 'completed'
    });

    return res.json({ success: true, message: 'Withdrawal successful', wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error withdrawing funds', error: err.message });
  }
};

// Pay Driver
exports.payDriver = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, driverId } = req.body;

    if (!amount || amount <= 0 || !driverId) {
      return res.status(400).json({ success: false, message: 'Driver ID and valid amount are required' });
    }

    const user = await User.findById(userId).populate('shipper');
    const shipperId = user.shipper._id;
    const shipperPhone = user.shipper.phone;

    const driver = await Driver.findById(driverId);
    const driverPhone = driver.phone;

    const shipperWallet = await Wallet.findOne({ phone: shipperPhone });
    const driverWallet = await Wallet.findOne({ phone: driverPhone });

    if (!shipperWallet) return res.status(404).json({ success: false, message: 'Shipper wallet not found' });
    if (!driverWallet) return res.status(404).json({ success: false, message: 'Driver wallet not found' });

    if (shipperWallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds in shipper wallet' });
    }

    shipperWallet.balance -= amount;
    await shipperWallet.save();

    const platformShare = amount * 0.20;
    const driverShare = amount * 0.80;

    driverWallet.balance += driverShare;
    await driverWallet.save();

    const AdminWallet = await Wallet.findOne({ ownerType: 'super-admin' });
    if (AdminWallet) {
      AdminWallet.balance += platformShare;
      await AdminWallet.save();
    }

    await Transaction.create({
      fromWallet: shipperWallet._id,
      toWallet: driverWallet._id,
      amount,
      platformShare,
      adminShare: platformShare,
      driverShare,
      type: 'escrow',
      status: 'completed'
    });

    return res.json({
      success: true,
      message: `Payment of ${amount} successful. Driver received ${driverShare}, Platform kept ${platformShare}.`,
      shipperWallet,
      driverWallet
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing payment', error: err.message });
  }
};
