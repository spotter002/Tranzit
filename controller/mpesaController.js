// controller/paymentController.js
const axios = require('axios');
const moment = require('moment');
const { User, Driver, Transaction } = require('../model/tranzitdb');
const { getToken } = require('../utils/mpesaAuth'); // Helper for auth

exports.handleBidPayment = async (req, res) => {
  const { shipperId, driverId, phone, bidAmount } = req.body;

  if (!shipperId || !driverId || !phone || !bidAmount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [shipper, driver] = await Promise.all([
      User.findById(shipperId),
      Driver.findById(driverId)
    ]);

    if (!shipper || shipper.role !== 'shipper') {
      return res.status(404).json({ message: 'Invalid shipper' });
    }
    if (!driver) {
      return res.status(404).json({ message: 'Invalid driver' });
    }

    // Fee calculations
    const platformFeeDriver = bidAmount * 0.20;
    const platformFeeShipper = bidAmount * 0.20;
    const driverPayout = bidAmount - platformFeeDriver;
    const totalToPay = bidAmount + platformFeeShipper;

    // M-Pesa auth and STK push
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: totalToPay,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: 'Tranzit Payment',
      TransactionDesc: `Payment for driver bid`
    };

    const token = await getToken();
    const stkRes = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Save transaction log
    const transaction = new Transaction({
      shipper: shipperId,
      driver: driverId,
      phone,
      amount: bidAmount,
      driverShare: driverPayout,
      platformShare: platformFeeDriver + platformFeeShipper,
      totalPaid: totalToPay,
      status: 'pending',
      mpesaResponse: stkRes.data
    });

    await transaction.save();

    res.status(200).json({
      message: 'STK Push sent to shipper',
      data: stkRes.data
    });

  } catch (err) {
    console.error('STK Push error:', err);
    res.status(500).json({ message: 'Payment error', error: err.message });
  }
};
