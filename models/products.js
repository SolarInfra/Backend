const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({

    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    dailyIncome: {
        type: String,
        required: true
    },
    totalReturn: {
        type: String,
        required: true
    },
    color: {
        type: String,
    },


}, {timestamps: true});

module.exports = mongoose.model('Product', ProductSchema);