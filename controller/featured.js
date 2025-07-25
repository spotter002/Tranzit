const { Featured, Driver } = require('../model/tranzitdb');

// 🔥 Create a Featured Driver
exports.createFeaturedDriver = async (req, res) => {
  const { driverId, startDate, endDate, priorityBoost } = req.body;
  console.log(req.body);

  try {
    if (!driverId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    // Optional: validate driver exists
    const driverExists = await Driver.findById(driverId);
    if (!driverExists) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const newFeatured = new Featured({
      driverId,
      startDate,
      endDate,
      priorityBoost: priorityBoost || 1,
    });

    await newFeatured.save();
    res.status(201).json({ message: 'Featured driver created', featured: newFeatured });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔍 Get all Featured Drivers
exports.getAllFeaturedDrivers = async (req, res) => {
  try {
    const featuredDrivers = await Featured.find()
      .populate('driverId', 'name email phone licenseNumber');

    res.status(200).json(featuredDrivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔍 Get Featured Driver by ID
exports.getFeaturedDriverById = async (req, res) => {
  try {
    const featured = await Featured.findById(req.params.id)
      .populate('driverId', 'name email phone');

    if (!featured) return res.status(404).json({ message: 'Featured driver not found' });

    res.status(200).json(featured);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✏️ Update Featured Driver
exports.updateFeaturedDriver = async (req, res) => {
  try {
    const updatedFeatured = await Featured.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedFeatured) return res.status(404).json({ message: 'Featured driver not found' });

    res.status(200).json({ message: 'Featured driver updated', updatedFeatured });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ❌ Delete Featured Driver
exports.deleteFeaturedDriver = async (req, res) => {
  try {
    const deletedFeatured = await Featured.findByIdAndDelete(req.params.id);
    if (!deletedFeatured) return res.status(404).json({ message: 'Featured driver not found' });

    res.status(200).json({ message: 'Featured driver removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
