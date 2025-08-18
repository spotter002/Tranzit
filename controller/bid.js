const { Bid, Driver, Delivery, User } = require('../model/tranzitdb');

const mongoose = require('mongoose');

// 📤 Create a Bid
exports.createBid = async (req, res) => {
  const { jobId, amount, estimatedArrivalMinutes } = req.body;

  try {
    // ✅ Validate required fields
    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Validate ObjectId format early to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const userId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    console.log('userId', userId);

    // ✅ Fetch and validate user & driver
    const user = await User.findById(userId).populate('driver');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.driver) return res.status(404).json({ message: 'User driver profile not found' });
    console.log('user', user);
    console.log('user.driver', user.driver);
    const driverId = user.driver._id;
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ message: 'Invalid driver ID format' });
    }
    console.log('driverId', driverId);
    // ✅ Ensure driver exists
    const driverExists = await Driver.findById(driverId);
    if (!driverExists) return res.status(404).json({ message: 'Driver not found' });
    console
    // ✅ Ensure job exists
    const jobExists = await Delivery.findById(jobId);
    if (!jobExists) return res.status(404).json({ message: 'Job/Delivery not found' });
    console.log('jobExists', jobExists);
    // ✅ Create and save bid
    const newBid = new Bid({
      jobId,
      driverId,
      amount,
      estimatedArrivalMinutes
    });

    await newBid.save();
    console.log('newBid', newBid);
    res.json({ message: 'Bid created successfully', bid: newBid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// 📄 Get all Bids
exports.getAllBids = async (req, res) => {
  try {
    const bids = await Bid.find()
      .populate('jobId', 'cargoTitle pickup dropoff')
      .populate('driverId', 'name email phone');
    res.json(bids);
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

// 📄 Get Bid by ID
exports.getBidById = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('jobId', 'cargoTitle pickup dropoff')
      .populate('driverId', 'name email');

    if (!bid) return res.json({ message: 'Bid not found' });

    res.json(bid);
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

// ✏️ Update Bid
exports.updateBid = async (req, res) => {
  try {
    const updatedBid = await Bid.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedBid) return res.json({ message: 'Bid not found' });

    res.json({ message: 'Bid updated', updatedBid });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

// ❌ Delete Bid
exports.deleteBid = async (req, res) => {
  try {
    const deletedBid = await Bid.findByIdAndDelete(req.params.id);
    if (!deletedBid) return res.json({ message: 'Bid not found' });

    res.json({ message: 'Bid deleted successfully' });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

// 📄 Get all bids by the authenticated driver
exports.getBidsByDriver = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Login required' });
    }

    const user = await User.findById(userId).populate(['shipper', 'driver']);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.driver) return res.status(404).json({ message: 'User driver profile not found' });

    const driverId = user.driver._id;
    if (!driverId) return res.status(404).json({ message: 'Driver not found' });

    const bids = await Bid.find({ driverId })
      .populate('jobId', 'cargoTitle pickup dropoff')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// 📄 Get bids for a specific job
exports.getBidsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const bids = await Bid.find({ jobId })
      .populate('driverId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Accept a bid and reject others
exports.acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: 'Bid not found' });

    // Accept this bid
    bid.status = 'accepted';
    await bid.save();

    // Reject all other bids for the same job
    await Bid.updateMany(
      { jobId: bid.jobId, _id: { $ne: bidId } },
      { $set: { status: 'rejected' } }
    );

    // Optionally update delivery with driverId
    await Delivery.findByIdAndUpdate(bid.jobId, {
      driverId: bid.driverId,
      status: 'assigned'
    });

    res.json({ message: 'Bid accepted and others rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.updateBidStatus = async (req, res) => {
  try {
    const bidId = req.params.bidId;
    const newStatus = req.params.newStatus; // ✅ Correct
    const allowedStatuses = ["assigned", "picked_up", "delivered"];

    console.log('bidId', bidId);
    console.log('newStatus', newStatus);

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

     // Find the bid
    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    console.log('bid', bid);
    // Find the related delivery
    const delivery = await Delivery.findById(bid.jobId);
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });
     console.log('delivery', delivery);
    delivery.status = newStatus;
   await delivery.save();

    res.json({ message: "Delivery status updated", delivery });
  } catch (err) {
    console.error("❌ Error marking as picked up:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// const { Bid, Delivery } = require('../models');

// exports.markAsPickedUp = async (req, res) => {
//   try {
//     const { bidId } = req.params;

//     // Find the bid
//     const bid = await Bid.findById(bidId);
//     if (!bid) return res.status(404).json({ message: "Bid not found" });

//     // Find the related delivery
//     const delivery = await Delivery.findById(bid.jobId);
//     if (!delivery) return res.status(404).json({ message: "Delivery not found" });

//     // Update delivery status
//     delivery.status = "picked_up";
//     await delivery.save();

//     res.json({ message: "Delivery status updated", delivery });
//   } catch (err) {
//     console.error("❌ Error marking as picked up:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

