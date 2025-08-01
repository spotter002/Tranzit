// controllers/driverController.js
const { User, Driver, Delivery, Shipper, Wallet ,Transaction } = require('../model/tranzitdb');


exports.getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('driver');
    const driverId = user.driver._id;
    const wallet = await Wallet.findOne({ ownerId: driverId });

    const assignedJobs = await Delivery.find({ driverId, status: 'assigned' });
    const completedJobs = await Delivery.countDocuments({ driverId, status: 'completed' });

    res.json({
      earnings: wallet?.balance || 0,
      completedJobs,
      assignedJobs
    });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Error fetching driver dashboard', error: error.message });
  }
};
