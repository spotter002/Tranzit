// controller/mpesaCallbackController.js

const Transaction = require('../model/Transaction');

exports.handleStkCallback = async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;

    const merchantRequestID = callbackData.MerchantRequestID;
    const checkoutRequestID = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;

    console.log("M-Pesa Callback Received:", callbackData);

    const transaction = await Transaction.findOne({ checkoutRequestID });

    if (!transaction) {
      return res.json({ message: 'Transaction not found' });
    }

    if (resultCode === 0) {
      const amountPaid = callbackData.CallbackMetadata.Item.find(i => i.Name === 'Amount').Value;
      const mpesaReceipt = callbackData.CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber').Value;

      transaction.status = 'success';
      transaction.mpesaReceiptNumber = mpesaReceipt;
      transaction.paidAmount = amountPaid;
    } else {
      transaction.status = 'failed';
    }

    await transaction.save();

    res.json({ message: 'Callback processed' });

  } catch (err) {
    console.error('Callback Error:', err.message);
    res.json({ message: 'Callback server error', error: err.message });
  }
};
