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
const driverAuth = require('./routes/driverRoute')
app.use('/driver/Auth',driverAuth)

//shipper route
const shipperAuth = require('./routes/shipperRoute')
app.use('/shipper/Auth',shipperAuth)

//delivery route
const deliveryAuth = require('./routes/deliveryRoute')
app.use('/delivery/Auth',deliveryAuth)

//bid route
const bidAuth = require('./routes/bidRoute')
app.use('/bid/Auth',bidAuth)

//featured route
const featuredAuth = require('./routes/featuredRoute')
app.use('/featured/Auth',featuredAuth)

//transaction route
const transactionAuth = require('./routes/transactionRoute')
app.use('/transaction/Auth',transactionAuth)

//rating route
const ratingAuth = require('./routes/ratingRoute')
app.use('/rating/Auth',ratingAuth)

//dashboard route
const dashboardAuth = require('./routes/dashboardRoutes')
app.use('/dashboard/Auth',dashboardAuth)

// //mpesaroutes
// const mpesaAuth = require('./routes/mpesa')
// app.use('/mpesa/Auth',mpesaAuth)

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
