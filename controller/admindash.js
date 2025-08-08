const { User, Driver, Delivery, Shipper, Wallet, Transaction } = require('../model/tranzitdb');
const mongoose = require('mongoose');

exports.getAdminDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      totalUsers,
      totalDrivers,
      totalShippers,
      pendingDeliveries,
      completedDeliveries,
      totalWalletBalance,
      recentAdmins,
      recentUsers,
      recentDrivers,
      recentShippers,
      recentPayments,
      registrationsByDate,
      deliveriesByDate,
      walletGrowthByDate,
      wallet
    ] = await Promise.all([
      User.countDocuments(),
      Driver.countDocuments(),
      Shipper.countDocuments(),
      Delivery.countDocuments({ status: 'pending' }),
      Delivery.countDocuments({ status: 'completed' }),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      User.find({ role: 'admin' }).sort({ createdAt: -1 }).limit(5).lean(),
      User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5).lean(),
      Driver.find().sort({ createdAt: -1 }).limit(5).lean(),
      Shipper.find().sort({ createdAt: -1 }).limit(5).lean(),
      Transaction.find().sort({ createdAt: -1 }).limit(5).lean(),

      // Registrations chart aggregation (drivers + shippers by date)
      // Group by date string YYYY-MM-DD
      Driver.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        }
      ]),
      Shipper.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        }
      ]),

      // Completed vs total deliveries by date
      Delivery.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Wallet growth for admin by date (assuming wallet updated with timestamps)
      Wallet.aggregate([
        { $match: { ownerId: mongoose.Types.ObjectId(userId) } },
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

      Wallet.findOne({ ownerId: userId }) // get current wallet balance for admin
    ]);

    // Format registrations data into chart-ready shape
    // We got driversByDate and shippersByDate separately, merge by date
    // registrationsByDate = [driversAgg, shippersAgg]
    // Actually, due to Promise.all, we put driver and shipper agg in separate positions,
    // so shift them for clarity:

    const driversByDate = registrationsByDate; // alias for clarity
    const shippersByDate = deliveriesByDate; // wrong, we need to fix this below

    // We messed order in Promise.all; let's fix the call order for clarity:
    // We'll unpack registrationsByDate and deliveriesByDate and walletGrowthByDate properly:

    // Let's rewrite Promise.all with comments to track order:

    // Here's the better promise structure:

    const [
      totalUsersCount,
      totalDriversCount,
      totalShippersCount,
      pendingDeliveriesCount,
      completedDeliveriesCount,
      totalWalletSum,
      recentAdminsList,
      recentUsersList,
      recentDriversList,
      recentShippersList,
      recentPaymentsList,
      driversRegistrations,
      shippersRegistrations,
      deliveriesStatsByDate,
      walletGrowthStats,
      adminWallet
    ] = await Promise.all([
      User.countDocuments(),
      Driver.countDocuments(),
      Shipper.countDocuments(),
      Delivery.countDocuments({ status: 'pending' }),
      Delivery.countDocuments({ status: 'completed' }),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      User.find({ role: 'admin' }).sort({ createdAt: -1 }).limit(5).lean(),
      User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5).lean(),
      Driver.find().sort({ createdAt: -1 }).limit(5).lean(),
      Shipper.find().sort({ createdAt: -1 }).limit(5).lean(),
      Transaction.find().sort({ createdAt: -1 }).limit(5).lean(),

      Driver.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        }
      ]),

      Shipper.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        }
      ]),

      Delivery.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Wallet.aggregate([
        { $match: { ownerId: mongoose.Types.ObjectId(userId) } },
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

      Wallet.findOne({ ownerId: userId })
    ]);

    // Merge driver and shipper registrations by date for chart
    const registrationDatesSet = new Set();
    driversRegistrations.forEach(d => registrationDatesSet.add(d._id));
    shippersRegistrations.forEach(s => registrationDatesSet.add(s._id));
    const allDates = Array.from(registrationDatesSet).sort();

    const registrationsChartData = allDates.map(date => {
      const driverEntry = driversRegistrations.find(d => d._id === date);
      const shipperEntry = shippersRegistrations.find(s => s._id === date);
      return {
        date,
        drivers: driverEntry ? driverEntry.count : 0,
        shippers: shipperEntry ? shipperEntry.count : 0
      };
    });

    res.json({
      adminEarnings: adminWallet?.balance || 0,
      totalUsers: totalUsersCount,
      totalDrivers: totalDriversCount,
      totalShippers: totalShippersCount,
      pendingDeliveries: pendingDeliveriesCount,
      completedDeliveries: completedDeliveriesCount,
      totalWalletBalance: totalWalletSum[0]?.total || 0,
      recentAdmins: recentAdminsList,
      recentUsers: recentUsersList,
      recentDrivers: recentDriversList,
      recentShippers: recentShippersList,
      recentPayments: recentPaymentsList,
      registrationsChartData, // for drivers & shippers registration chart
      deliveriesStatsByDate,
      walletGrowthStats
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ message: 'Error fetching admin dashboard', error: error.message });
  }
};
