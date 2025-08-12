// controllers/driverController.js
const { User, Driver, Delivery, Shipper, Wallet, Transaction, Rating } = require('../model/tranzitdb');
const mongoose = require('mongoose');

exports.getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('driver');
    if (!user || !user.driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driverId = user.driver._id;

    // Wallet & Earnings
    const wallet = await Wallet.findOne({ ownerId: driverId });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayEarnings, weekEarnings, monthEarnings, totalEarnings] = await Promise.all([
      Transaction.aggregate([
        { $match: { ownerId: driverId, type: 'credit', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ownerId: driverId, type: 'credit', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ownerId: driverId, type: 'credit', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ownerId: driverId, type: 'credit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Job Stats
    const [pendingJobs, inProgressJobs, completedJobs, cancelledJobs] = await Promise.all([
      Delivery.countDocuments({ driverId, status: 'pending' }),
      Delivery.countDocuments({ driverId, status: 'in-progress' }),
      Delivery.countDocuments({ driverId, status: 'completed' }),
      Delivery.countDocuments({ driverId, status: 'cancelled' })
    ]);

    // Ratings Summary
    const ratings = await Rating.aggregate([
      { $match: { driverId: driverId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Recent Transactions
    const recentTransactions = await Transaction.find({ ownerId: driverId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly Earnings History (last 6 months)
    const monthlyEarnings = await Transaction.aggregate([
      { $match: { ownerId: driverId, type: 'credit' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    // Recent Deliveries
    const recentDeliveries = await Delivery.find({ driverId })
      .populate('shipper', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      walletBalance: wallet?.balance || 0,
      earnings: {
        today: todayEarnings[0]?.total || 0,
        thisWeek: weekEarnings[0]?.total || 0,
        thisMonth: monthEarnings[0]?.total || 0,
        total: totalEarnings[0]?.total || 0
      },
      jobs: {
        pending: pendingJobs,
        inProgress: inProgressJobs,
        completed: completedJobs,
        cancelled: cancelledJobs
      },
      ratings: {
        average: ratings[0]?.avgRating?.toFixed(2) || 0,
        totalReviews: ratings[0]?.totalReviews || 0
      },
      recentTransactions,
      monthlyEarnings,
      recentDeliveries
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching driver dashboard', error: error.message });
  }
};
