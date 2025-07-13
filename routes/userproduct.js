const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const User = require('../models/user');
const Product = require('../models/products');
const UserProduct = require('../models/userproduct');



// router.post('/assign', fetchuser, async (req, res) => {
//   const userId = req.user.id;
//   const { productId } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ error: 'Product not found' });
//     }

//     // ✅ Check if user has enough rechargeAmount
//     if (user.rechargeBalance < product.price) {
//       return res.status(400).json({ error: 'Insufficient balance to buy this product' });
//     }

//     // ✅ Deduct product price from user's rechargeAmount
//     user.rechargeBalance -= product.price;
//     await user.save();

//     const userProduct = new UserProduct({
//       user: userId,
//       product: productId,
//       isActive: true,
//     });

//     await userProduct.save();

//     res.status(201).json({ message: 'Product assigned successfully', userProduct });

//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });



// router.post('/assign', fetchuser, async (req, res) => {
//   const userId = req.user.id;
//   const { productId } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ error: 'Product not found' });
//     }

//     if (user.rechargeBalance < product.price) {
//       return res.status(400).json({ error: 'Insufficient balance to buy this product' });
//     }

//     // Deduct product price
//     user.rechargeBalance -= product.price;
//     await user.save();

//     // ✅ Create UserProduct (your usual logic)
//     const userProduct = new UserProduct({
//       user: userId,
//       product: productId,
//       isActive: true,
//     });
//     await userProduct.save();

//     // ✅ Handle referral bonus only if this is the FIRST PURCHASE
//     // (Optional but best practice: check if user has any products already)
//     const previousProducts = await UserProduct.findOne({ user: userId });
//     if (!previousProducts && user.isRefered && user.byRefered) {
//       const referrer = await User.findById(user.byRefered);
//       if (referrer) {
//         const bonus = Math.floor(product.price * 0.10); // 10%
//         referrer.refcoins += bonus;
//         await referrer.save();
//       }
//     }

//     return res.status(201).json({ message: 'Product assigned successfully', userProduct });

//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

router.post('/assign', fetchuser, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (user.rechargeBalance < product.price) {
      return res.status(400).json({ error: 'Insufficient balance to buy this product' });
    }

    // ✅ Check for existing products BEFORE creating new one
    const previousProducts = await UserProduct.findOne({ user: userId });

    // Deduct product price
    user.rechargeBalance -= product.price;
    await user.save();

    // ✅ Create UserProduct
    const userProduct = new UserProduct({
      user: userId,
      product: productId,
      isActive: true,
    });
    await userProduct.save();

    // ✅ Handle referral bonus ONLY if FIRST PURCHASE
    if (!previousProducts && user.isRefered && user.byRefered) {
      const referrer = await User.findById(user.byRefered);
      if (referrer) {
        const bonus = Math.floor(product.price * 0.10); // 10%
        referrer.refcoins += bonus;
        await referrer.save();
      }
    }

    return res.status(201).json({ message: 'Product assigned successfully', userProduct });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



router.post('/redeem/:rewardId', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const rewardId = req.params.rewardId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    // ✅ Safely parse and calculate:
    const coins = reward.coins;
    const discount = Number(reward.discount) || 0;

    const discountCoins = Math.round(coins - (coins * discount / 100));

    console.log(`Original coins: ${coins}`);
    console.log(`Discount: ${discount}%`);
    console.log(`Discounted coins to deduct: ${discountCoins}`);

    if (user.refcoins < discountCoins) {
      return res.status(400).json({ error: 'Not enough coins.' });
    }

    user.refcoins -= discountCoins; // ✅ use this, NOT reward.coins!
    await user.save();

    const redemption = new Redemption({
      user: user._id,
      reward: reward._id,
      status: 'pending',
    });

    await redemption.save();

    res.status(201).json({
      message: 'Reward redeemed successfully',
      redemption,
      usedCoins: discountCoins
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



//Route:2 Get All
router.get('/', async (req, res) => {
  try {
    const all = await UserProduct.find()
      .populate('user')
      .populate('product');

    res.json(all);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



//Route:3 Get AllUser Products
router.get('/getproducts', fetchuser, async (req, res) => {
  try {
    const all = await UserProduct.find({ user: req.user.id }) // ✅ Filter by user ID
      .populate('user')
      .populate('product');

    res.json(all);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



module.exports = router;