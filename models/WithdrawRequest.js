const mongoose = require('mongoose');

const WithdrawRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  requestedAt: { type: Date, default: Date.now },
  // Optional: store snapshot of bank details at request time
  accountHolder: String,
  accountNumber: String,
  ifscCode: String,
  contactNo: String,
  UPI: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
