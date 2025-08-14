// shipper logic
const { User } = require('../model/tranzitdb');
const { Shipper } = require('../model/tranzitdb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// register shipper
exports.registerShipper = async (req, res) => {
    try {
        const { email } = req.body;
        const existUserEmail = await User.findOne({ email });
        if (existUserEmail) {
            return res.json({ message: 'Shipper already exists' });
        }

        const existEmail = await Shipper.findOne({ email });
        if (existEmail) {
            return res.json({ message: 'Shipper already exists' });
        }

        const newShipper = new Shipper(req.body);
        await newShipper.save();

        const defaultPassword = 'password';
        const password = await bcrypt.hash(defaultPassword, 10);

        const newUser = new User({
            name: newShipper.name,
            email: newShipper.email,
            password,
            role: 'shipper',
            shipper: newShipper._id
        });

        await newUser.save();
        res.json({ message: 'Shipper registered successfully', shipper: newShipper, user: newUser });
    } catch (error) {
        res.json({ message: 'Internal server error', error: error.message });
    }
};

// get all shippers
exports.getAllShippers = async (req, res) => {
    try {
        const shippers = await Shipper.find();
        res.json(shippers);
    } catch (error) {
        res.json({ message: 'Error getting shippers', error: error.message });
    }
};

// get shipper by ID
exports.getShipperById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).populate('shipper');
        if (!user) {
            return res.json({ message: 'user not found' });
        }
        if (!user.shipper) {
            return res.json({ message: 'shipper not found' });
        }
        res.json(user.shipper);
    } catch (error) {
        res.json({ message: 'Error getting shipper', error: error.message });
    }
};

// update shipper
exports.updateShipper = async (req, res) => {
    try {
        const requestingUser = req.user;
        const { role, userId } = requestingUser;
        let targetShipperId = req.params.id;

        if (role === 'shipper') {
            const linkedUser = await User.findById(userId);
            if (!linkedUser || !linkedUser.shipper) {
                return res.json({ message: 'Linked shipper not found' });
            }
            targetShipperId = linkedUser.shipper;
        }

        const shipper = await Shipper.findById(targetShipperId);
        if (!shipper) {
            return res.json({ message: 'Shipper not found' });
        }

        const linkedUser = await User.findOne({ shipper: targetShipperId });
        if (!linkedUser) {
            return res.json({ message: 'Linked user not found' });
        }

        const isAdmin = role === 'admin';
        const isSelf = linkedUser._id.toString() === userId.toString();

        const { name, email, password, userRole, companyName, phone } = req.body;
        if (name) {
            shipper.name = name;
            linkedUser.name = name;
        }
        if (email) {
            shipper.email = email;
            linkedUser.email = email;
        }
        if (companyName) {
            shipper.companyName = companyName;
        }
        if (phone) {
            shipper.phone = phone;
        }
        if (userRole) {
            if (!isAdmin) {
                return res.json({ message: 'Only admins can update shipper roles.' });
            }
            shipper.role = userRole;
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

        await shipper.save();
        await linkedUser.save();

        res.json({ message: 'Shipper updated successfully', shipper, user: linkedUser });
    } catch (error) {
        res.json({ message: 'Error updating shipper', error: error.message });
    }
};

// delete shipper
exports.deleteShipper = async (req, res) => {
    try {
        const shipper = await Shipper.findByIdAndDelete(req.params.id);
        if (!shipper) {
            return res.json({ message: 'Shipper not found' });
        }
        await User.findOneAndDelete({ shipper: req.params.id });
        res.json({ message: 'Shipper and user deleted successfully' });
    } catch (error) {
        res.json({ message: 'Error deleting shipper', error: error.message });
    }
};


