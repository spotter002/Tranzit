const { User, Driver, Bid, Delivery, Rating } = require('../model/tranzitdb');
const bcrypt = require('bcrypt');

// Register Driver
exports.registerDriver = async (req, res) => {
    try {
        const { name, email, password, phone,photo, vehicleType, vehicleDetails, licenseNumber, idNumber , isPremium } = req.body;
        const plate= vehicleDetails.plateNumber;

        if (!name || !email || !password || !phone || !vehicleType || !vehicleDetails || !licenseNumber || !idNumber) {
            return res.json({ message: 'All fields are required' });
        }

        const emailExistsInUser = await User.findOne({ email });

        const emailExistsInDriver = await Driver.findOne({ email });
        console.log(emailExistsInDriver);
        if (emailExistsInUser || emailExistsInDriver) {
            return res.json({ message: 'Driver already exists' });
        }
        // Check if vehicle plate number already exists
        const existingCar = await Driver.findOne({ 'vehicleDetails.plateNumber': plate });

        if (existingCar) {
            return res.json({ message: 'Car already exists' });
        }


        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.json({
                message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and a number'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newDriver = new Driver({
            name,
            email,
            password: hashedPassword,
            phone,
            vehicleType,
            vehicleDetails,
            licenseNumber,
            idNumber,
            isVerifiedDriver: false,
            rating: 0,
            totalCompletedJobs: 0,
            isPremium: false,
            availableForJobs: true,
            photo
        });

        await newDriver.save();

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'driver',
            driver: newDriver._id
        });

        await newUser.save();

        res.json({
            message: 'Driver registered successfully',
            driver: newDriver,
            user: newUser
        });
    } catch (error) {
        res.json({ message: 'Server error', error: error.message });
    }
};

// Get all Drivers
exports.getDriver = async (req, res) => {
    try {
        const drivers = await Driver.find();
        res.json(drivers);
    } catch (error) {
        res.json({ message: 'Server error', error: error.message });
    }
};

// Get Driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driverId = req.params.id
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.json({ message: 'Driver not found' });
        }
        res.json(driver);
    } catch (error) {
        res.json({ message: 'Server error', error: error.message });
    }
};

// Update Driver
exports.updateDriver = async (req, res) => {
    try {
        const requestingUser = req.user;
        const { role, userId } = requestingUser;
        let targetDriverId = req.params.id;

        if (role === 'driver') {
            const linkedUser = await User.findById(userId);
            if (!linkedUser || !linkedUser.driver) {
                return res.json({ message: 'Linked driver not found' });
            }
            targetDriverId = linkedUser.driver;
        }

        const driver = await Driver.findById(targetDriverId);
        if (!driver) {
            return res.json({ message: 'Driver not found' });
        }

        const linkedUser = await User.findOne({ driver: targetDriverId });
        if (!linkedUser) {
            return res.json({ message: 'Linked user not found' });
        }

        const isAdmin = role === 'admin';
        const isSelf = linkedUser._id.toString() === userId.toString();

        const {
            name,
            email,
            password,
            userRole,
            phone,
            vehicleType,
            vehicleDetails,
            isPremium,
            licenseNumber,
            rating,
            isverifiedDriver,
            idNumber,
            availableForJobs,
            photo
        } = req.body;

        if (name) {
            driver.name = name;
            linkedUser.name = name;
        }

        if (email) {
            driver.email = email;
            linkedUser.email = email;
        }
        if (photo) driver.photo = photo;
        if (rating) driver.rating = rating;
        if (phone) driver.phone = phone;
        if (vehicleType) driver.vehicleType = vehicleType;
        if (vehicleDetails) driver.vehicleDetails = vehicleDetails;
        if (licenseNumber) driver.licenseNumber = licenseNumber;
        if (idNumber) driver.idNumber = idNumber;
        if (typeof availableForJobs === 'boolean') driver.availableForJobs = availableForJobs;
        if (typeof isverifiedDriver === 'boolean') driver.isverifiedDriver = isverifiedDriver;
        if (typeof isPremium === 'boolean') driver.isPremium = isPremium;

      
        if (userRole) {
            if (!isAdmin) {
                return res.json({ message: 'Only admins can update driver roles.' });
            }
            linkedUser.role = userRole;
        }

        if (password) {
            if (!isSelf) {
                return res.json({ message: 'Admins cannot update other users\' passwords.' });
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.json({
                    message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
                });
            }
            const salt = await bcrypt.genSalt(10);
            linkedUser.password = await bcrypt.hash(password, salt);
        }

        await driver.save();
        await linkedUser.save();

        res.json({ message: 'Driver updated successfully', driver, user: linkedUser });
    } catch (error) {
        res.json({ message: 'Server error', error: error.message });
    }
};

// Delete Driver
exports.deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) {
            return res.json({ message: 'Driver not found' });
        }

        await User.findOneAndDelete({ driver: req.params.id });

        res.json({ message: 'Driver and user deleted successfully' });
    } catch (error) {
        res.json({ message: 'Server error', error: error.message });
    }
};

// get all drivers bids 
exports.getDriverBids = async (req, res) => {
    try {
        const bids = await Bid.find({ driverId: req.params.id })
            .populate('jobId', 'cargoTitle pickup dropoff')
            .populate('driverId', 'name email phone');
        res.json(bids);
    } catch (error) {
        console.error(error);
        res.json({ message: 'Server error', error: error.message });
    }
};

// get all driver ratings
exports.getDriverRatings = async (req, res) => {
    try {
         const driverId = req.user.userId
        // Get the driver's nested driver._id
        const driver = await User.findById(driverId).populate('driver');

        console.log(driver)
        console.log(driver.driver._id)
        const ratings = await Rating.find({driverId: driver.driver._id})
            .populate('jobId', 'cargoTitle pickup dropoff')
            .populate('shipperId')
            .populate('driverId', 'name email');
            const averageRating = (ratings.reduce((total, rating) => total + rating.stars, 0) / ratings.length).toFixed(2);
        res.json({ratings,message:'Your Overall Rating:',averageRating});
    } catch (error) {
        console.error(error);
        res.json({ message: 'Server error', error: error.message });
    }
};



