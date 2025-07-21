const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  coins: {
    type: Number,
    required: true
  },
  realPrice: {
    type: String,
    required: true
  },
  discount: {
    type: String,
    required: true
  },
  discountCoins: {
    type: String,
  },
  image: {
    type: String  // e.g. "/uploads/reward1.jpg"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reward', RewardSchema);
