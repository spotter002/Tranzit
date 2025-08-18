const { User, Driver, Shipper, Wallet ,Transaction } = require('../model/tranzitdb');
const mongoose = require('mongoose');

// Create a wallet for a user or driver
exports.createWallet = async (req, res) => {
  try {
    let ownerId = req.user.userId;
    const user = await User.findById(ownerId).populate(['shipper', 'driver']);
    if (!user) {
      return res.json({ message: 'User not found' });
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
      return res.json({ message: 'Invalid user role' });
    }

    const existingWallet = await Wallet.findOne({ ownerId });
    if (existingWallet) {
      return res.json({ message: 'Wallet already exists' });
    }

    // First create the wallet, then the transaction
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

    res.json({ message: 'Wallet created successfully', wallet });
  } catch (err) {
    res.json({ message: 'Error creating wallet', error: err.message });
  }
};


//get all wallets
exports.getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find();
    res.json(wallets);
  } catch (err) {
    res.json({ message: 'Error getting wallets', error: err.message });
  }
}

// get wallet by id 
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(['shipper', 'driver']);
    console.log('user', user);

    if (!user) return res.status(404).json({ message: 'User not found' });

    let ownerId;

    if (user.role === 'shipper' && user.shipper) {
      ownerId = user.shipper._id;
    } else if (user.role === 'driver' && user.driver) {
      ownerId = user.driver._id;
    } else {
      // For admin/super-admin, just use the user._id
      ownerId = user._id;
    }

    console.log('ownerId', ownerId);

    const wallet = await Wallet.findOne({ ownerId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    console.log('wallet', wallet);
    return res.json(wallet);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error getting wallet', error: err.message });
  }
};



// Deposit funds into logged-in user's wallet
exports.depositFunds = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!userId || !amount) {
      return res.json({ message: 'Login to deposit funds' });
    }

    const user = await User.findById(userId).populate(['shipper', 'driver']);
    if (!user) return res.json({ message: 'User not found' });

    // console.log('user',user);
    let ownerId;
    if (user.role === 'shipper') ownerId = user.shipper?._id;
    else if (user.role === 'driver') ownerId = user.driver?._id;
    else ownerId = mongoose.Types.ObjectId(userId); // super-admin or admin

    const wallet = await Wallet.findOne({ ownerId });
    if (!wallet) return res.json({ message: 'Wallet not found' });

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
      toWallet: wallet._id,
      amount,
      type: 'deposit',
      status: 'completed'
    });

    return res.json({ message: 'Deposit successful', wallet });
  } catch (err) {
    res.json({ message: 'Error depositing funds', error: err.message });
  }
};

// Withdraw funds from logged-in user's wallet
exports.withdrawFunds = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!userId || !amount) {
      return res.json({ message: 'Login to withdraw funds' });
    }

    const user = await User.findById(userId).populate(['shipper', 'driver']);
    if (!user) return res.json({ message: 'User not found' });

    // console.log('user',user);
    let ownerId;
    if (user.role === 'shipper') ownerId = user.shipper?._id;
    else if (user.role === 'driver') ownerId = user.driver?._id;
    else ownerId = mongoose.Types.ObjectId(userId); // super-admin or admin

    const wallet = await Wallet.findOne({ ownerId });
    if (!wallet) return res.json({ message: 'Wallet not found' });

    if (wallet.balance < amount) {
      return res.json({ message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      fromWallet: wallet._id,
      amount,
      type: 'withdrawal',
      status: 'completed'
    });

    return res.json({ message: 'Withdraw successful', wallet });
  } catch (err) {
    res.json({ message: 'Error withdrawing funds', error: err.message });
  }
};


// Transfer funds with 80/20 split (escrow logic)
exports.payDriver = async (req, res) => {
  try {
    const userId = req.user.userId
    // console.log('userId',userId);
    const user = await User.findById(userId)
    // console.log('user',user);
    const shipperId = user.shipper._id
    // console.log('shipperId',shipperId);
    const{amount , driverId } = req.body
    // console.log('amount',amount);
    // console.log('driverId',driverId);
    const shipper = await Shipper.findById(shipperId)
    // console.log('shipper',shipper);
    const shipperPhone = shipper.phone
    // console.log('shipperPhone',shipperPhone);
    const driver = await Driver.findById({_id: driverId})
    // console.log('driver',driver);
    const driverPhone = driver.phone
    // console.log('driverPhone',driverPhone);
   
    if (!shipperPhone) {
      return res.json({ message: 'login to transfer funds' });
    }
    if( !driverPhone || !amount){
      return res.json({ message: ' driver id, and amount are required' });
    }

    const shipperWallet = await Wallet.findOne({ phone: shipperPhone });
    // console.log('shipperWallet',shipperWallet);
    const driverWallet = await Wallet.findOne({ phone: driverPhone });
    // console.log('driverWallet',driverWallet);
    if (!shipperWallet) return res.json({ message: 'Shipper wallet not found' });
    if (!driverWallet) return res.json({ message: 'Driver wallet not found' });

    // Check balance
    if (shipperWallet.balance < amount) return res.json({ message: 'Insufficient funds in shipper wallet' });

    // Deduct from shipper
    shipperWallet.balance -= amount;
    await shipperWallet.save();

    // Split 80/20
    const platformShare = amount * 0.20;
    const driverShare = amount * 0.80;

    // Add to driver
    driverWallet.balance += driverShare;
    await driverWallet.save();

    // send platformShare to users wallet
    const AdminWallet = await Wallet.findOne({ ownerType: 'super-admin' })
    // console.log('AdminWallet',AdminWallet);
    AdminWallet.balance += platformShare
    await AdminWallet.save()

    // Log transaction
    const transaction = new Transaction({
      fromWallet: shipperWallet._id,
      toWallet: driverWallet._id,
      amount,
      platformShare,
      adminShare: platformShare,
      driverShare,
      type: 'escrow',
      status: 'completed'
    });
    // console.log('transaction',transaction);

    await transaction.save();

    return res.json({
      message: `Payment of ${amount} successful. Driver received ${driverShare}, Platform kept ${platformShare}.`,
      shipperWallet,
      driverWallet
    });
  } catch (err) {
    res.json({ message: 'Error processing payment', error: err.message });
  }
};

// delete wallet 
exports.deleteWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findByIdAndDelete(req.params.id);
    if (!wallet) return res.json({ message: 'Wallet not found' });
    return res.json({ message: 'Wallet deleted successfully' });
  } catch (err) {
    res.json({ message: 'Error deleting wallet', error: err.message });
  }
};


// get transactions depending on role
exports.getAllTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(['shipper', 'driver']);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let filter = {};

    // Admins see everything
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      let ownerId;
      if (user.role === 'shipper') ownerId = user.shipper?._id;
      else if (user.role === 'driver') ownerId = user.driver?._id;
      // else ownerId = mongoose.Types.ObjectId(req.user.userId);

      // filter transactions involving this wallet
      filter = { 
        $or: [
          { fromWallet: ownerId }, 
          { toWallet: ownerId }
        ]
      };
    }

    const transactions = await Transaction.find(filter)
      .populate('fromWallet', 'name phone ownerType')
      .populate('toWallet', 'name phone ownerType')
      .sort({ createdAt: -1 });

    return res.json(transactions);
  } catch (err) {
    return res.json({ message: 'Error fetching transactions', error: err.message });
  }
};

// authController.js or wherever fits your auth logic

exports.checkWalletStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(['shipper', 'driver']);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Admin users skip wallet check
    if (user.role === 'admin' || user.role === 'super-admin') {
      return res.json({ hasWallet: true, isAdmin: true });
    }

    let ownerId;
    if (user.role === 'shipper') ownerId = user.shipper?._id;
    else if (user.role === 'driver') ownerId = user.driver?._id;
    else ownerId = mongoose.Types.ObjectId(req.user.userId);

    const wallet = await Wallet.findOne({ ownerId });
    if (wallet) {
      return res.json({ hasWallet: true, isAdmin: false });
    } else {
      return res.json({ hasWallet: false, isAdmin: false });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Error checking wallet status', error: err.message });
  }
};
