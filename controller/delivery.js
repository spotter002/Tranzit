// delivery logic
const {User} = require('../model/tranzitdb')
const{Delivery} = require('../model/tranzitdb')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const { Delivery } = require('../model/tranzitdb');

// 📦 Create a new delivery
exports.createDelivery = async (req, res) => {
  const {
    shipperId,
    cargoTitle,
    cargoDescription,
    cargoType,
    weightEstimate,
    pickup,
    dropoff,
    specialInstructions
  } = req.body;

  try {
//     if (!shipperId || !pickup || !dropoff) {
//       return res.status(400).json({ message: 'Shipper ID, pickup, and dropoff are required' });
//     }

    const newDelivery = new Delivery({
      shipperId,
      cargoTitle,
      cargoDescription,
      cargoType,
      weightEstimate,
      pickup,
      dropoff,
      specialInstructions
    });

    await newDelivery.save();
    res.status(201).json({ message: 'Delivery created successfully', delivery: newDelivery });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 📬 Get all deliveries
exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
    .populate('shipperId','name email phone')
    res.status(200).json(deliveries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 📦 Get delivery by ID
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
    .populate('shipperId','name email phone')
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.status(200).json(delivery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✏️ Update delivery
exports.updateDelivery = async (req, res) => {
  try {
    const updatedDelivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDelivery) return res.status(404).json({ message: 'Delivery not found' });
    res.status(200).json(updatedDelivery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ❌ Delete delivery
exports.deleteDelivery = async (req, res) => {
  try {
    const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!deletedDelivery) return res.status(404).json({ message: 'Delivery not found' });
    res.status(200).json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
