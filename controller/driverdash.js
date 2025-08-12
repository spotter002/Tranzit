// controllers/driverController.js
const { User, Driver, Delivery, Shipper, Wallet, Transaction, Rating } = require('../model/tranzitdb');
const mongoose = require('mongoose');

exports.getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('driver');
    if (!user || !user.driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const driverId = user.driver._id;

    // Wallet info
    const wallet = await Wallet.findOne({ ownerId: driverId });

    // Jobs
    const assignedJobs = await Delivery.find({ driverId, status: 'assigned' });
    const completedJobs = await Delivery.countDocuments({ driverId, status: 'completed' });
    const pendingJobs = await Delivery.countDocuments({ driverId, status: 'pending' });
    const cancelledJobs = await Delivery.countDocuments({ driverId, status: 'cancelled' });

    // Recent jobs
    const recentJobs = await Delivery.find({ driverId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('shipper', 'name')
      .select('pickupLocation dropoffLocation status price createdAt');

    // Earnings over last 7 days
    const earningsLast7Days = await Transaction.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(driverId), type: 'credit' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Ratings
    const ratingsData = await Rating.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(driverId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$stars" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Top pickup & dropoff locations
    const topLocations = await Delivery.aggregate([
      { $match: { driverId: new mongoose.Types.ObjectId(driverId) } },
      {
        $group: {
          _id: "$pickupLocation",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      walletBalance: wallet?.balance || 0,
      jobs: {
        assigned: assignedJobs.length,
        completed: completedJobs,
        pending: pendingJobs,
        cancelled: cancelledJobs
      },
      earningsLast7Days,
      ratings: ratingsData[0] || { avgRating: 0, totalRatings: 0 },
      recentJobs,
      topPickupLocations: topLocations,
      charts: {
        jobStatus: [
          { label: 'Assigned', value: assignedJobs.length },
          { label: 'Completed', value: completedJobs },
          { label: 'Pending', value: pendingJobs },
          { label: 'Cancelled', value: cancelledJobs }
        ]
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching driver dashboard', error: error.message });
  }
};
