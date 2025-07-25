const { User, Driver, Shipper, Wallet ,Transaction } = require('../model/tranzitdb');

// Create a wallet for a user or driver
exports.createWallet = async (req, res) => {
  try {
    let ownerId = req.user.userId;
    const user = await User.findById(ownerId).populate(['shipper', 'driver']); // Populate related models if needed
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let phone;
    let ownerType = user.role;
    let name = user.name || 'Unknown';

    // Determine phone number based on role
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
      return res.status(400).json({ message: 'Invalid user role' });
    }

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ phone });
    if (existingWallet) {
      return res.status(400).json({ message: 'Wallet already exists' });
    }

    // Create new wallet
    const wallet = await Wallet.create({
      phone,
      ownerType,
      name,
      ownerId
    });

    res.status(201).json({ message: 'Wallet created successfully', wallet });
  } catch (err) {
    res.status(500).json({ message: 'Error creating wallet', error: err.message });
  }
};

//get all wallets
exports.getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find();
    res.status(200).json(wallets);
  } catch (err) {
    res.status(500).json({ message: 'Error getting wallets', error: err.message });
  }
}

// get wallet by id 
exports.getWallet = async (req, res) => {
  try {
    const walletId = req.user.userId
    const wallet = await Wallet.findOne({ownerId: walletId});
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    return res.status(200).json(wallet);
  } catch (err) {
    res.status(500).json({ message: 'Error getting wallet', error: err.message });
  }
};

// Deposit funds into shipper's wallet
exports.depositFunds = async (req, res) => {
  try {
    const shipperId = req.user.userId
    console.log("Shipper Id",shipperId)
    const{amount} = req.body
    if (!shipperId || !amount) {
      return res.status(400).json({ message: 'Login to deposit funds' });
    }

    const shipper = await User.findById({_id: shipperId}).populate('shipper');
    if (!shipper) return res.status(404).json({ message: 'Shipper not found' });
    console.log("Our Shipper =",shipper)
    const wallet = await Wallet.findOne({ phone: shipper.shipper.phone });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    wallet.balance += amount;
    await wallet.save();

    const transaction = new Transaction({
      toWallet: wallet._id,
      amount,
      type: 'deposit',
      status: 'completed'
    });
    await transaction.save();

    return res.status(200).json({ message: 'Deposit successful', wallet });
  } catch (err) {
    res.status(500).json({ message: 'Error depositing funds', error: err.message });
  }
};

// withdraw funds
exports.withdrawFunds = async (req, res) => {
   try {
    const shipperId = req.user.userId
    console.log("Shipper Id",shipperId)
    const{amount} = req.body
    if (!shipperId || !amount) {
      return res.status(400).json({ message: 'Login to deposit funds' });
    }

    const shipper = await User.findById({_id: shipperId}).populate('shipper');
    if (!shipper) return res.status(404).json({ message: 'Shipper not found' });
    console.log("Our Shipper =",shipper)
    const wallet = await Wallet.findOne({ phone: shipper.shipper.phone });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    wallet.balance -= amount;
    await wallet.save();

    const transaction = new Transaction({
      fromWallet: wallet._id,
      amount,
      type: 'withdrawal',
      status: 'completed'
    });
    await transaction.save();

    return res.status(200).json({ message: 'withdraw successful', wallet });
  } catch (err) {
    res.status(500).json({ message: 'Error depositing funds', error: err.message });
  }
};

// Transfer funds with 80/20 split (escrow logic)
exports.payDriver = async (req, res) => {
  try {
    const userId = req.user.userId
    const user = await User.findById(userId)
    const shipperId = user.shipper._id
    const{amount , driverId } = req.body
    const shipper = await Shipper.findById(shipperId)
    const shipperPhone = shipper.phone
    const driver = await Driver.findById({_id: driverId})
    const driverPhone = driver.phone
   
    if (!shipperPhone) {
      return res.status(400).json({ message: 'login to transfer funds' });
    }
    if( !driverPhone || !amount){
      return res.status(400).json({ message: ' driver id, and amount are required' });
    }

    const shipperWallet = await Wallet.findOne({ phone: shipperPhone });
    const driverWallet = await Wallet.findOne({ phone: driverPhone });
    if (!shipperWallet) return res.status(404).json({ message: 'Shipper wallet not found' });
    if (!driverWallet) return res.status(404).json({ message: 'Driver wallet not found' });

    // Check balance
    if (shipperWallet.balance < amount) return res.status(400).json({ message: 'Insufficient funds in shipper wallet' });

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

    await transaction.save();

    return res.status(200).json({
      message: `Payment of ${amount} successful. Driver received ${driverShare}, Platform kept ${platformShare}.`,
      shipperWallet,
      driverWallet
    });
  } catch (err) {
    res.status(500).json({ message: 'Error processing payment', error: err.message });
  }
};

// delete wallet 
exports.deleteWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findByIdAndDelete(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    return res.status(200).json({ message: 'Wallet deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting wallet', error: err.message });
  }
};












