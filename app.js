// Entry file
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

// middlewares
const app = express()
app.use(cors())
app.use(express.json()) 

// routes
// user route
const userAuth = require('./routes/loginRoute')
app.use('/user/Auth',userAuth)

// driver route
const driverAuth = require('./routes/loginRoute')
app.use('/driver/Auth',driverAuth)

//shipper route
const shipperAuth = require('./routes/shipperRoute')
app.use('/shipper/Auth',shipperAuth)

//static files
app.use('/uploads', express.static('uploads'))

// database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err)) 

// server listening
const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})