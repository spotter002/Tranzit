// shipper logic
const {User} = require('../model/tranzitdb')
const{Shipper} = require('../model/tranzitdb')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// register shipper
exports.registerShipper = async (req, res) => {
    try {
        const { name, email, password, phone, defaultPickupLocation, companyName } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' })
            }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 8 characters
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const shipper = new Shipper({
            name,
            email,
            password: hashedPassword,
            phone,
            defaultPickupLocation,
            companyName
        })
        await shipper.save()
        res.status(200).json({ message: 'Shipper registered successfully', shipper })
    } catch (error) {
        res.status(500).json({ message: 'Error registering shipper', error })
    }
}

// get shippers
exports.getShipper = async (req, res) => {
    try {
        const shipper = await Shipper.find()
        res.status(200).json(shipper)
    } catch (error) {
        res.status(500).json({ message: 'Error getting shipper', error })
    }
}

// get shipper by id
exports.getShipperById = async (req, res) => {
    try {
        const shipper = await Shipper.findById(req.params.id)
        if (!shipper) {
            return res.status(404).json({ message: 'Shipper not found' })
        }
        res.status(200).json(shipper)
    } catch (error) {
        res.status(500).json({ message: 'Error getting shipper', error })
    }
} 

// update shipper
exports.updateShipper = async (req, res) => {
    try {
        const shipper = await Shipper.findById(req.params.id)
        if (!shipper) {
            return res.status(404).json({ message: 'Shipper not found' })
        }
        const updatedShipper = await Shipper.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.status(200).json(updatedShipper)
    } catch (error) {
        res.status(500).json({ message: 'Error updating shipper', error })
    }
}

// delete shipper
exports.deleteShipper = async (req, res) => {
    try {
        const shipper = await Shipper.findByIdAndDelete(req.params.id)
        if (!shipper) {
            return res.status(404).json({ message: 'Shipper not found' })
        }
        res.status(200).json({ message: 'Shipper deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting shipper', error })
    }
}
