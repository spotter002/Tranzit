// controllers/shipperController.js
const { User, Driver, Delivery, Shipper, Wallet, Transaction } = require('../model/tranzitdb');
const mongoose = require('mongoose');

exports.getShipperDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('shipper');
    if (!user?.shipper) {
      return res.status(404).json({ message: 'Shipper profile not found' });
    }

    const shipperId = user.shipper._id;
    const objectShipperId = new mongoose.Types.ObjectId(shipperId);

    const [
      wallet,
      activeJobs,
      completedJobs,
      canceledJobs,
      recentDeliveries,
      totalEarnings,
      lastMonthEarnings,
      deliveryStatsByDate,
      walletGrowthStats,
      recentTransactions
    ] = await Promise.all([
      Wallet.findOne({ ownerId: shipperId }),
      Delivery.find({ shipperId, status: { $in: ['pending', 'assigned'] } }),
      Delivery.find({ shipperId, status: 'completed' }),
      Delivery.find({ shipperId, status: 'canceled' }),
      Delivery.find({ shipperId }).sort({ createdAt: -1 }).limit(5).lean(),

      // Total earnings
      Transaction.aggregate([
        { $match: { ownerId: objectShipperId, type: 'credit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Last month earnings
      Transaction.aggregate([
        { 
          $match: { 
            ownerId: objectShipperId, 
            type: 'credit', 
            createdAt: { 
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) 
            } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Delivery stats by day
      Delivery.aggregate([
        { $match: { shipperId: objectShipperId } },
        { 
          $group: { 
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
          } 
        },
        { $sort: { _id: 1 } }
      ]),

      // Wallet growth over time
      Wallet.aggregate([
        { $match: { ownerId: objectShipperId } },
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            balance: 1
          }
        },
        {
          $group: {
            _id: '$date',
            balance: { $last: '$balance' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Last 5 transactions
      Transaction.find({ ownerId: shipperId }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    // Completion rate
    const totalJobs = completedJobs.length + activeJobs.length + canceledJobs.length;
    const completionRate = totalJobs > 0 ? ((completedJobs.length / totalJobs) * 100).toFixed(1) : 0;

    res.json({
      walletBalance: wallet?.balance || 0,
      totalEarnings: totalEarnings[0]?.total || 0,
      lastMonthEarnings: lastMonthEarnings[0]?.total || 0,
      completionRate: `${completionRate}%`,
      totalCompleted: completedJobs.length,
      totalPending: activeJobs.length,
      totalCanceled: canceledJobs.length,
      activeJobs,
      recentDeliveries,
      deliveryStatsByDate,
      walletGrowthStats,
      recentTransactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching shipper dashboard', error: error.message });
  }
};
