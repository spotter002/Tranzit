// controllers/shipperController.js
const { User, Driver, Delivery, Shipper, Wallet ,Transaction } = require('../model/tranzitdb');


exports.getShipperDashboard = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming JWT has shipper's userId
    const user = await User.findById(userId).populate('shipper');
    const shipperId = user.shipper._id;
    const wallet = await Wallet.findOne({ ownerId: shipperId });

    const activeJobs = await Delivery.find({ shipperId, status: { $in: ['pending', 'assigned'] } });
    const jobHistory = await Delivery.find({ shipperId, status: 'completed' }).sort({ completedAt: -1 }).limit(10);

    res.status(200).json({
      walletBalance: wallet?.balance || 0,
      activeJobs,
      jobHistory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching shipper dashboard', error: error.message });
  }
};
