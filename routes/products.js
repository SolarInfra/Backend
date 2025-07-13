const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const Product = require('../models/products');
const Reward = require('../models/rewards');
const User = require('../models/user');
const Redemption = require('../models/redemption');


//Route:1 Add a product
router.post('/addproduct', [
  body('productName', 'Product name is required').notEmpty(),
  body('price', 'Price is required').notEmpty(),
  body('duration', 'Duration is required').notEmpty(),
  body('dailyIncome', 'Daily income is required').notEmpty(),
  body('totalReturn', 'Total return is required').notEmpty()
],
async (req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()) return res.status(400).json({ errors: error.array() });

    try {
        const { productName, price, duration, dailyIncome, totalReturn, color } = req.body;

        const newProduct = new Product({
        productName,
        price,
        duration,
        dailyIncome,
        totalReturn,
        color
        });

        await newProduct.save();
        res.status(200).json({ message: 'Product added successfully', newProduct})
    } catch(err) {
        console.error(err);
        res.status(500).send('Internal server error')
    }
});



//Route:2 Add a product
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return res.status(404).json({ error: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



//Route:3 Get all Products
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



router.post('/redeem/:rewardId', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const rewardId = req.params.rewardId;

    const reward = await Reward.findById(rewardId);
    if (!reward) return res.status(404).json({ error: 'Reward not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rewardCost = Number(reward.coins);

    if (user.refcoins < rewardCost) {
      return res.status(400).json({ error: 'Not enough coins.' });
    }

    // Deduct coins
    user.refcoins -= rewardCost;
    await user.save();

    // Create redemption record
    await Redemption.create({ user: user._id, reward: reward._id });

    res.json({ message: 'Reward redeemed successfully!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



router.get('/getallreward', async (req, res) => {
  try {
    const all = await Redemption.find()
      .populate('user')
      .populate('reward');

    res.json(all);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



router.get('/getallredemptions', async (req, res) => {
  try {
    const redemptions = await Redemption.find()
      .populate('user')
      .populate('reward');
    res.json(redemptions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



// PATCH approve redemption
router.patch('/redemption/:id/approve', async (req, res) => {
  try {
    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) return res.status(404).send('Redemption not found');

    redemption.status = 'Approved';
    await redemption.save();

    res.json({ message: 'Redemption approved!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



// PATCH reject redemption
router.patch('/redemption/:id/reject', async (req, res) => {
  try {
    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) return res.status(404).send('Redemption not found');

    redemption.status = 'Rejected';
    await redemption.save();

    res.json({ message: 'Redemption rejected!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



module.exports = router