const { User, Driver, Delivery, Shipper, Wallet, Transaction } = require('../model/tranzitdb');

// get admin dashboard data
exports.getAdminDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(userId)

        // run all count and aggregate operations in parallel for better performance
        const [
            totalUsers,
            totalDrivers,
            totalShippers,
            pendingDeliveries,
            completedDeliveries,
            totalWalletBalance
        ] = await Promise.all([
            User.countDocuments(),
            Driver.countDocuments(),
            Shipper.countDocuments(),
            Delivery.countDocuments({ status: 'pending' }),
            Delivery.countDocuments({ status: 'completed' }),
            Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }])
        ]);

        // fetch wallet balance for the admin
        const wallet = await Wallet.findOne({ ownerId: userId });

        // get the most recent transactions
        const recentPayments = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // return all the data
        res.json({
            adminEarnings: wallet?.balance || 0,
            totalUsers,
            totalDrivers,
            totalShippers,
            pendingDeliveries,
            completedDeliveries,
            totalWalletBalance: totalWalletBalance[0]?.total || 0,
            recentPayments
        });

    } catch (error) {
        res.json({ message: 'Error fetching admin dashboard', error: error.message });
    }
};
