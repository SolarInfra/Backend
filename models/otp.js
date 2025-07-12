const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // expires in 5 mins
});

module.exports = mongoose.model('Otp', OtpSchema);
