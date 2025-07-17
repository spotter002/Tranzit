const { User, Driver } = require('../model/tranzitdb');
const bcrypt = require('bcrypt');

// Register Driver
exports.registerDriver = async (req, res) => {
    try {
        const { name, email, password, phone, vehicleType, vehicleDetails, licenseNumber, idNumber } = req.body;
        const plate= vehicleDetails.plateNumber;

        if (!name || !email || !password || !phone || !vehicleType || !vehicleDetails || !licenseNumber || !idNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const emailExistsInUser = await User.findOne({ email });

        const emailExistsInDriver = await Driver.findOne({ email });
        console.log(emailExistsInDriver);
        if (emailExistsInUser || emailExistsInDriver) {
            return res.status(400).json({ message: 'Driver already exists' });
        }
        // Check if vehicle plate number already exists
        const existingCar = await Driver.findOne({ 'vehicleDetails.plateNumber': plate });

        if (existingCar) {
            return res.status(400).json({ message: 'Car already exists' });
        }


        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
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
            availableForJobs: true
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

        res.status(201).json({
            message: 'Driver registered successfully',
            driver: newDriver,
            user: newUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all Drivers
exports.getDriver = async (req, res) => {
    try {
        const drivers = await Driver.find();
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
                return res.status(404).json({ message: 'Linked driver not found' });
            }
            targetDriverId = linkedUser.driver;
        }

        const driver = await Driver.findById(targetDriverId);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const linkedUser = await User.findOne({ driver: targetDriverId });
        if (!linkedUser) {
            return res.status(404).json({ message: 'Linked user not found' });
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
            licenseNumber,
            idNumber,
            availableForJobs
        } = req.body;

        if (name) {
            driver.name = name;
            linkedUser.name = name;
        }

        if (email) {
            driver.email = email;
            linkedUser.email = email;
        }

        if (phone) driver.phone = phone;
        if (vehicleType) driver.vehicleType = vehicleType;
        if (vehicleDetails) driver.vehicleDetails = vehicleDetails;
        if (licenseNumber) driver.licenseNumber = licenseNumber;
        if (idNumber) driver.idNumber = idNumber;
        if (typeof availableForJobs === 'boolean') driver.availableForJobs = availableForJobs;

        if (userRole) {
            if (!isAdmin) {
                return res.status(403).json({ message: 'Only admins can update driver roles.' });
            }
            linkedUser.role = userRole;
        }

        if (password) {
            if (!isSelf) {
                return res.status(403).json({ message: 'Admins cannot update other users\' passwords.' });
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
                });
            }
            const salt = await bcrypt.genSalt(10);
            linkedUser.password = await bcrypt.hash(password, salt);
        }

        await driver.save();
        await linkedUser.save();

        res.status(200).json({ message: 'Driver updated successfully', driver, user: linkedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Driver
exports.deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        await User.findOneAndDelete({ driver: req.params.id });

        res.status(200).json({ message: 'Driver and user deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
