// driver logic
const {User} = require('../model/tranzitdb')
const{Driver} = require('../model/tranzitdb')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// register driver
exports.registerDriver = async (req,res) => {
    const {name, email,password, phone,vehicleType, vehicleDetails, licenseNumber, idNumber} = req.body
    try {
        if(!name || !email || !password || !phone || !vehicleType || !vehicleDetails || !licenseNumber || !idNumber){
            return res.status(400).json({message:"All fields are required"})
        }
        // check if driver already exists
        const driver = await User.findOne({email})
        if(driver){return res.status(400).json({message:"Driver already exists"})}

        // validate password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 8 characters
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.' });
        }
        // hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        // create new driver
        const newDriver = new Driver({name, email, password: hashedPassword, phone, vehicleType, vehicleDetails, licenseNumber, idNumber, isVerifiedDriver: false, rating: 0, totalCompletedJobs: 0, availableForJobs: true})
        await newDriver.save()
        res.status(200).json({message:"Driver registered successfully", driver: newDriver})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error"})
    }
}

// get driver
exports.getDriver = async (req,res) => {
    try {
        const driver = await Driver.find()
        res.status(200).json(driver)
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error", error: error.message})
    }
}

// get driver by id
exports.getDriverById = async (req,res) => {
    try {
        const driver = await Driver.findById(req.params.id)
        if(!driver){return res.status(404).json({message:"Driver not found"})}
        res.status(200).json(driver)
        } catch (error) {
            console.error(error)
            res.status(500).json({message:"Server error", error: error.message})
        }
}

//update driver
exports.updateDriver = async (req,res) => {
    try {
        const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {new: true})
        if(!driver){return res.status(404).json({message:"Driver not found"})}
        res.status(200).json(driver)
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error", error: error.message})
    }
}

// delete driver
exports.deleteDriver = async (req,res) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id)
        if(!driver){return res.status(404).json({message:"Driver not found"})}
        res.status(200).json({message:"Driver deleted successfully"})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error", error: error.message})
    }
}