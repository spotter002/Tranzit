const { Rating, User, Shipper, Driver, Delivery } = require('../model/tranzitdb');

// ⭐ Create a new rating
exports.createRating = async (req, res) => {
  const { jobId, driverId, stars, comment } = req.body;
  console.log(req.body);

  try {
    // Basic validation
    if (!jobId || !driverId || !stars) {
      return res.json({ message: 'Missing required fields' });
    }
   const existJob = await Delivery.findById(jobId);
   const existDriver = await Driver.findById(driverId);
   console.log(existJob)
if (!existJob) return res.json({ message: 'Job/Delivery not found' });

const shipperId = existJob.shipperUserId;
const shipperName = existJob.shipperName;
const driverName = existDriver.name;

    console.log(shipperId, shipperName)
    const rating = new Rating({
      jobId,
      shipperId,
      driverId,
      stars,
      comment,
    });

    await rating.save();
    res.json({ message: `${driverName} has been rated ${stars} stars by ${shipperName}`, rating  });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
//   const existingRating = await Rating.findOne({ jobId, driverId, shipperId });
// if (existingRating) {
//   return res.json({ message: 'You already rated this job/driver' });
// }

};

// ⭐ Get all ratings
exports.getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate('jobId', 'cargoTitle pickup dropoff') // Populate job details
      .populate('shipperId', 'name email')
      .populate('driverId', 'name email');
    res.json(ratings);
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

// ⭐ Get rating by ID
exports.getRatingById = async (req, res) => {
  try {
    const rating = await Rating.find({driverId:req.params.id})
      .populate('jobId', 'cargoTitle pickup dropoff')
      .populate('shipperId', 'name email')
      .populate('driverId', 'name email');

    if (!rating) return res.json({ message: 'Rating not found' });

    res.json(rating);
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

// ⭐ Update rating
exports.updateRating = async (req, res) => {
  try {
    const updatedRating = await Rating.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRating) return res.json({ message: 'Rating not found' });

    res.json({ message: 'Rating updated', updatedRating });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};

// ❌ Delete rating
exports.deleteRating = async (req, res) => {
  try {
    const deletedRating = await Rating.findByIdAndDelete(req.params.id);
    if (!deletedRating) return res.json({ message: 'Rating not found' });

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error(error);
    res.json({ message: 'Server error', error: error.message });
  }
};


// GET /featured/top-rated
exports.getTopRatedDrivers = async (req, res) => {
  try {
    const topDrivers = await Rating.aggregate([
      { $group: { _id: "$driverId", avgRating: { $avg: "$stars" } } },
      { $sort: { avgRating: -1 } },
      { $limit: 5 }
    ]);
    res.json(topDrivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
