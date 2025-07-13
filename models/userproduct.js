const mongoose = require('mongoose')

const UserProductSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    purchasedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        required: true
    },
    isPaid: {
        type: Boolean, 
        default: false
    },
     lastIncomeUpdate: { 
        type: Date, 
        default: Date.now
    }

}, {timestamps: true});

module.exports = mongoose.model('userProduct', UserProductSchema);