const { Transaction, User, Delivery } = require('../model/tranzitdb');

// 💰 Create a Transaction
exports.createTransaction = async (req, res) => {
  const {
    userId,
    jobId,
    amount,
    type,
    method,
    status,
    referenceId
  } = req.body;

  console.log(req.body);

  try {
    // Validate required fields
    if (!userId || !amount || !type || !method) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Optional: validate user & job
    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: 'User not found' });

    if (jobId) {
      const jobExists = await Delivery.findById(jobId);
      if (!jobExists) return res.status(404).json({ message: 'Job/Delivery not found' });
    }

    const newTransaction = new Transaction({
      userId,
      jobId,
      amount,
      type,
      method,
      status: status || 'pending',
      referenceId
    });

    await newTransaction.save();
    res.status(201).json({ message: 'Transaction recorded', transaction: newTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 📄 Get All Transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .populate('jobId', 'cargoTitle pickup dropoff');

    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔍 Get Transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('jobId', 'cargoTitle');

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✏️ Update Transaction
exports.updateTransaction = async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedTransaction) return res.status(404).json({ message: 'Transaction not found' });

    res.status(200).json({ message: 'Transaction updated', updatedTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ❌ Delete Transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) return res.status(404).json({ message: 'Transaction not found' });

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
