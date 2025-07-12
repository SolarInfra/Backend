const mongoose = require('mongoose');

const RechargeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  txnId: { type: String }, // User's entered UPI Transaction ID
  screenshot: { type: String }, // Optional file path if you want to allow upload
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recharge', RechargeSchema);
