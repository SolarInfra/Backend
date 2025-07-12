const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    // Personal Information
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profImg: {
      type: Number,
      default: '',
    },

    // Bank & Payment Info
    accHold: {
      type: String,
    },
    accNo: {
      type: String,
      unique: true,
    },
    ifsc: {
      type: String,
    },
    phonepeNo: {
      type: String,
    },

    // Referral System
    myReferralCode: {
      type: String,
      required: true
    },
    isRefered: {
      type: Boolean,
      default: false,
    },
    byRefered: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    referedpeople: {
      type: Number,
      default: '0',
    },
    refcoins: {
      type: Number,
      default: '0',
    },

    // Balance Information
    currentBalance: {
      type: Number,
      default: '0',
    },
    withdrawBalance: {
      type: Number,
      default: '0',
    },
    rechargeBalance: {
      type: Number,
      default: '0',
    },

    // Withdrawal History
    withdrawals: [
      {
        amount: {
          type: Number,
        },
        withdraType: {
          type: String, // You might clarify what this field means
        },
        method: {
          type: String, // e.g., "UPI", "Bank", "PhonePe"
        },
        status: {
          type: String,
          default: 'pending', // pending, success, failed
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Metadata
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
