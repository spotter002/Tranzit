const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//
// 📍 Reusable Location Schema (no _id or timestamps needed)
//
const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true }
})

//
// 👤 User Schema
//
const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'shipper', 'driver'], required: true },
  shipper: { type:mongoose.Schema.Types.ObjectId, ref: 'Shipper', default: null },
  driver: { type:mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

//
// 🛵 Driver Schema
//
const driverSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  password: { type: String },
  vehicleType: { type: String, enum: ['boda', 'pickup', 'truck'], required: true },
  vehicleDetails: {
    plateNumber: { type: String, required: true, unique: true },
    capacityKg: { type: Number },
    model: { type: String }
  },
  licenseNumber: { type: String, required: true },
  idNumber: { type: String },
  isVerifiedDriver: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  totalCompletedJobs: { type: Number, default: 0 },
  availableForJobs: { type: Boolean, default: true }
}, { timestamps: true });

//
// 👨‍🌾 Shipper Schema
//
const shipperSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  defaultPickupLocation: locationSchema,
  companyName: { type: String },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true })


//
// 🚚 Delivery Schema
//
const deliverySchema = new Schema({
  shipperUserId: { type:mongoose.Schema.Types.ObjectId, ref: 'Shipper', required: true },
  shipperEmail: { type: String},
  shipperName:{type: String},
  cargoTitle: { type: String },
  cargoDescription: { type: String },
  cargoType: { type: String }, // e.g. produce, furniture, etc.
  weightEstimate: { type: Number },
  pickup: locationSchema,
  dropoff: locationSchema,
  specialInstructions: { type: String },
  status: {
    type: String,
    enum: ['posted', 'assigned', 'picked_up', 'delivered', 'cancelled'],
    default: 'posted'
  },
  selectedBidId: { type:mongoose.Schema.Types.ObjectId, ref: 'Bid' }
}, { timestamps: true });

//
// ⭐ Rating Schema
//
const ratingSchema = new Schema({
  jobId: { type:mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
  shipperId: { type:mongoose.Schema.Types.ObjectId, ref: 'Shipper' },
  driverId: { type:mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  stars: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String }
}, { timestamps: true });

//
// 🔥 Featured Driver Schema
//
const featuredSchema = new Schema({
  driverId: { type:mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  priorityBoost: { type: Number, default: 1 }
}, { timestamps: true });

//
// 📤 Bid Schema
//
const bidSchema = new Schema({
  jobId: { type:mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true },
  driverId: { type:mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  amount: { type: Number, required: true },
  estimatedArrivalMinutes: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

//
// 💰 Transaction Schema
//
const transactionSchema = new Schema({
  userId: { type:mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobId: { type:mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
  amount: { type: Number },
  type: { type: String, enum: ['job_fee', 'payout', 'bonus'], required: true },
  method: { type: String, enum: ['mpesa', 'card', 'wallet'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  referenceId: { type: String }
}, { timestamps: true });


//
// 🧠 Export Models
//
module.exports = {
  User: mongoose.model('User', userSchema),
  Driver: mongoose.model('Driver', driverSchema),
  Shipper: mongoose.model('Shipper', shipperSchema),
  Delivery: mongoose.model('Delivery', deliverySchema),
  Bid: mongoose.model('Bid', bidSchema),
  Rating: mongoose.model('Rating', ratingSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Featured: mongoose.model('Featured', featuredSchema)
};
