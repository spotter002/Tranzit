const { Bid, Driver, Delivery } = require('../model/tranzitdb');

// 📤 Create a Bid
exports.createBid = async (req, res) => {
  const { jobId, driverId, amount, estimatedArrivalMinutes } = req.body;
  // console.log(req.body);

  try {
    if (!jobId || !driverId || !amount) {
      return res.json({ message: 'Missing required fields' });
    }

    // Optional: validate driver & job
    const driverExists = await Driver.findById(driverId);
    // console.log(driverExists)
    if (!driverExists) return res.json({ message: 'Driver not found' });
    console.log(jobId)
    const jobExists = await Delivery.findById(jobId);
    console.log(jobExists)
    if (!jobExists) return res.json({ message: 'Job/Delivery not found' });

    const newBid = new Bid({
      jobId,
      driverId,
      amount,
      estimatedArrivalMinutes
    });

    await newBid.save();
    res.json({ message: 'Bid created successfully', bid: newBid });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
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

// 📄 Get all bids by a specific driver
exports.getBidsByDriver = async (req, res) => {
  try {
    const bids = await Bid.find({ driverId: req.params.driverId })
      .populate('jobId', 'cargoTitle pickup dropoff')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

