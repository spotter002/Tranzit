// controllers/driverController.js
const { User, Driver, Delivery, Shipper, Wallet, Transaction } = require('../model/tranzitdb');

exports.getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('driver');
    const driverId = user.driver._id;

    // Wallet info
    const wallet = await Wallet.findOne({ ownerId: driverId });

    // Job stats
    const assignedJobs = await Delivery.find({ driverId, status: 'assigned' });
    const completedJobs = await Delivery.countDocuments({ driverId, status: 'completed' });
    const inProgressJobs = await Delivery.countDocuments({ driverId, status: 'in-progress' });
    const cancelledJobs = await Delivery.countDocuments({ driverId, status: 'cancelled' });

    // Earnings breakdown (last 7 days)
    const last7DaysEarnings = await Transaction.aggregate([
      { $match: { ownerId: driverId, type: 'credit', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          date: { $first: "$createdAt" },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Top shippers worked with
    const topShippers = await Delivery.aggregate([
      { $match: { driverId, status: 'completed' } },
      { $group: { _id: "$shipperId", jobs: { $sum: 1 } } },
      { $sort: { jobs: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "shippers",
          localField: "_id",
          foreignField: "_id",
          as: "shipperDetails"
        }
      },
      { $unwind: "$shipperDetails" },
      { $project: { _id: 0, name: "$shipperDetails.name", jobs: 1 } }
    ]);

    // Monthly earnings trend (last 6 months)
    const monthlyEarnings = await Transaction.aggregate([
      { $match: { ownerId: driverId, type: 'credit', createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      earnings: wallet?.balance || 0,
      jobStats: {
        completedJobs,
        assignedJobs: assignedJobs.length,
        inProgressJobs,
        cancelledJobs
      },
      recentEarnings: last7DaysEarnings.map(e => ({
        date: e.date,
        total: e.total
      })),
      monthlyEarnings,
      topShippers,
      activeJobs: assignedJobs, // so they can see them in detail
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching driver dashboard', error: error.message });
  }
};
