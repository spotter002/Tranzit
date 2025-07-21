const { Rating, User, Shipper, Driver, Delivery } = require('../model/tranzitdb');

// ⭐ Create a new rating
exports.createRating = async (req, res) => {
  const { jobId, shipperId, driverId, stars, comment } = req.body;
  console.log(req.body);

  try {
    // Basic validation
    if (!jobId || !shipperId || !driverId || !stars) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const rating = new Rating({
      jobId,
      shipperId,
      driverId,
      stars,
      comment,
    });

    await rating.save();
    res.status(201).json({ message: 'Rating created successfully', rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ⭐ Get all ratings
exports.getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate('jobId', 'cargoTitle pickup dropoff') // Populate job details
      .populate('shipperId', 'name email')
      .populate('driverId', 'name email');
    res.status(200).json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ⭐ Get rating by ID
exports.getRatingById = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate('jobId', 'cargoTitle pickup dropoff')
      .populate('shipperId', 'name email')
      .populate('driverId', 'name email');

    if (!rating) return res.status(404).json({ message: 'Rating not found' });

    res.status(200).json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ⭐ Update rating
exports.updateRating = async (req, res) => {
  try {
    const updatedRating = await Rating.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRating) return res.status(404).json({ message: 'Rating not found' });

    res.status(200).json({ message: 'Rating updated', updatedRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ❌ Delete rating
exports.deleteRating = async (req, res) => {
  try {
    const deletedRating = await Rating.findByIdAndDelete(req.params.id);
    if (!deletedRating) return res.status(404).json({ message: 'Rating not found' });

    res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
