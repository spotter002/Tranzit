const {User} = require('../model/tranzitdb')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// register a new user
exports.registerUser = async (req, res) => {
    const { name, email, password, secretKey , phone } = req.body;
    try {

        if (!name || !email || !secretKey || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // Check if secret key matches
        if (secretKey !== process.env.secretKey) {
            return res.status(403).json({ message: 'Unauthorezed Account Creation' })
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 8 characters
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.' });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        const newUser = new User({
            name,
            phone,
            email,
            password: hashedPassword,
            role: 'admin', // Default role, can be changed later
            isActive: true // Set to true for new users
        });
        // Save user to database
        await newUser.save()
        
        res.status(201).json({
            message: 'User registered successfully',
            newUser})
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' })
    }
    
}

// login user
exports.loginUser = async (req,res) => {
    const {email, password} = req.body
    try {

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        // find user by email
        const user = await User.findOne({email})
        if(!user){return res.status(404).json({message:"invalid credentials"})}
        // if(!user.isActive){return res.status(403).json({message:'Account Deactivated'})}
        // check if password is correct
        const valid = await bcrypt.compare(password, user.password)
        if(!valid){return res.status(401).json({message:"invalid credentials"})}

        // generate token
        const token = jwt.sign({userId: user._id, role: user.role},process.env.JWT_SECRET,{expiresIn:'4800h'})

        //return user data without password
       res.status(200).json({message: 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            },
            token: token
        })
    } catch (error) {
        console.error('Error logging in',error)
        res.status(500).json({message:'Internal Server Error'})
    }
}

// get all users
exports.getAllUsers = async (req,res) => {
    try {
        const users = await User.find()
        res.status(200).json(users)
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error", error: error.message})
    }
}

//update user
exports.updateUser = async (req,res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {new: true})
        if(!updatedUser){return res.status(404).json({message:"User not found"})}
        res.status(200).json(updatedUser)
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error", error: error.message})
    }
}
