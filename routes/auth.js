const express = require('express');
require('dotenv').config();
const axios = require('axios');
const {body, validationResult} = require('express-validator');
const fetchuser = require('../middleware/fetchuser');
const bcrypt = require('bcrypt');
const twilio = require('twilio');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const JWT_SECRET = '%v5sx2C&&@$!%#*&UBXYQV%8b269xe';
const router = express.Router();
const User = require('../models/user');
const UserProduct = require('../models/userproduct');
const Reward = require('../models/rewards');
const Recharge = require('../models/recharge');
const WithdrawRequest = require('../models/WithdrawRequest');
const Redemption = require('../models/redemption');
const Otp = require('../models/otp');


const UPI_ID = process.env.UPI_ID;


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // relative to where you run `node index.js`
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });



router.get('/get-upi', (req, res) => {
  res.json({ upiId: UPI_ID });
});



router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    // Generate random 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to DB (overwrite if exists)
    await Otp.findOneAndUpdate(
      { phone },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true }
    );

    // SEND OTP using your SMS API
    const AUTH_KEY = '323161636f727039323816';
    const SENDER = 'IBTCRM';
    const ROUTE = 2;
    const COUNTRY = 91;
    const DLT_TE_ID = '1707168499016611106';

    const apiUrl = `http://control.yourbulksms.com/api/sendhttp.php` +
      `?authkey=${AUTH_KEY}` +
      `&mobiles=${phone}` +
      `&message=Your Application verification code is ${otpCode} IBITTS` +
      `&sender=${SENDER}` +
      `&route=${ROUTE}` +
      `&country=${COUNTRY}` +
      `&DLT_TE_ID=${DLT_TE_ID}`;

    const response = await axios.get(apiUrl);

    return res.status(200).json({ message: 'OTP sent!', apiResponse: response.data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});



router.post('/resend-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ error: 'Phone is required' });

  try {
    // Delete any old OTPs
    await Otp.deleteMany({ phone });

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);

    // Save new OTP
    const otpEntry = new Otp({ phone, otp: newOtp });
    await otpEntry.save();

    // Send OTP via your SMS API
    const AUTH_KEY = '323161636f727039323816';
    const SENDER = 'IBTCRM';
    const ROUTE = 2;
    const COUNTRY = 91;
    const DLT_TE_ID = '1707168499016611106';

    const apiUrl = `http://control.yourbulksms.com/api/sendhttp.php` +
      `?authkey=${AUTH_KEY}` +
      `&mobiles=${phone}` +
      `&message=Your%20Application%20verification%20code%20is%20${newOtp}%20IBITTS` +
      `&sender=${SENDER}` +
      `&route=${ROUTE}` +
      `&country=${COUNTRY}` +
      `&DLT_TE_ID=${DLT_TE_ID}`;

    await axios.get(apiUrl);

    return res.json({ message: 'OTP resent successfully' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
});



router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const record = await Otp.findOne({ phone });

    if (!record) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Delete OTP after success
    await Otp.deleteOne({ phone });

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});



router.post('/verify-reset-otp', async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  // 1️⃣ Find user by phone
  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 2️⃣ Find OTP by phone
  const otpEntry = await Otp.findOne({ phone });

  if (!otpEntry) return res.status(400).json({ error: 'OTP not found' });

  // 3️⃣ Compare OTP (as strings)
  if (String(otpEntry.otp) !== String(otp)) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // 4️⃣ Reset password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  // 5️⃣ Delete OTP record
  await Otp.deleteOne({ phone });

  res.json({ message: 'Password reset successfully' });
})



// Route:1 register new User

// router.post('/register', [
//   body('name', 'Name is required').notEmpty(),
//   body('surname', 'Surname is required').notEmpty(),
//   body('email', 'Invalid email').isEmail(),
//   body('phone', 'Invalid phone number').isMobilePhone(),
//   body('profImg', 'Invalid profile image (must be number)').optional().isNumeric(),
//   body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
// ], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const {
//     name, surname, email, phone, accNo, address,
//     profImg, password, referralCode // <-- Optional
//   } = req.body;

//   try {
//   const existingUser = await User.findOne({
//     $or: [{ phone }, { email }]
//   });

//   if (existingUser) {
//     return res.status(400).json({ error: 'Sorry, user already exists' });
//   }

//   let isRefered = false;
//   let byRefered = '';

//   if (referralCode) {
//     const referrer = await User.findOne({ myReferralCode: referralCode });
//     if (referrer) {
//       isRefered = true;
//       byRefered = referralCode;

//       await User.updateOne(
//         { _id: referrer._id },
//         { 
//           $inc: {
//             refcoins: 500,
//             referedpeople: 1
//           }
//         }
//       );
//     } else {
//       return res.status(400).json({ error: 'Invalid referral code' });
//     }
//   }

//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   // ✅ Generate a random 10-digit referral code
//   const myReferralCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();

//   const newUser = new User({
//     name,
//     surname,
//     email,
//     phone,
//     address,
//     profImg,
//     password: hashedPassword,
//     accNo,
//     refered: isRefered,
//     byRefered,
//     myReferralCode // ✅ save it
//   });

//   await newUser.save();

//   const payload = { user: { id: newUser._id } };
//   const token = jwt.sign(payload, JWT_SECRET);

//   return res.status(201).json({ message: "User successfully created", token });
// } catch (err) {
//   console.error(err);
//   return res.status(500).send('Internal server error');
// }

// });



router.post('/register', [
  body('name', 'Name is required').notEmpty(),
  body('surname', 'Surname is required').notEmpty(),
  body('email', 'Invalid email').isEmail(),
  body('phone', 'Invalid phone number').isMobilePhone(),
  body('profImg', 'Invalid profile image (must be number)').optional().isNumeric(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name, surname, email, phone, accNo, address,
    profImg, password, referralCode // ✅ optional
  } = req.body;

  try {
    // ✅ Check for existing user
    const existingUser = await User.findOne({
      $or: [{ phone }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Sorry, user already exists' });
    }

    let isRefered = false;
    let byRefered = null;

    if (referralCode) {
      const referrer = await User.findOne({ myReferralCode: referralCode });
      if (referrer) {
        isRefered = true;
        byRefered = referrer._id; // ✅ store as userId not code

        // ✅ Do not give coins here — only count the person
        await User.updateOne(
          { _id: referrer._id },
          { $inc: { referedpeople: 1 } }
        );
      } else {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
    }

    // ✅ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Generate random 10-digit code
    const myReferralCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    console.log("Generated myReferralCode:", myReferralCode);

    // ✅ Create user
    const newUser = new User({
      name,
      surname,
      email,
      phone,
      address,
      profImg,
      password: hashedPassword,
      accNo,
      isRefered: isRefered,
      byRefered,
      myReferralCode // ✅ always present
    });

    await newUser.save();

    const payload = { user: { id: newUser._id } };
    const token = jwt.sign(payload, JWT_SECRET);

    return res.status(201).json({ message: "User successfully created", token });

  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal server error');
  }
});



// Route:2 Login existing User
router.post('/login', [
  body('identifier', 'Email or phone is required').notEmpty(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { identifier, password } = req.body;

  try {
    // Find user by email or phone
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }] 
    });
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate token
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, name: user.name } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



// Route:3 Get User details
router.post('/getuser', fetchuser, async (req, res) => {

  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    res.send(user)
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



// Route: Withdraw money
router.post('/withdraw', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id; // from fetchuser
    const { amount, method, withdraType, status } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ error: 'Amount and method are required.' });
    }

    const withdrawal = {
      amount,
      method,
      withdraType: withdraType || '',
      status: status || 'pending',
      date: new Date()
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { withdrawals: withdrawal } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Withdrawal saved successfully', withdrawals: user.withdrawals });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



router.put('/updatebank', fetchuser, async (req, res) => {
  try {
    const { accountHolder, accountNumber, ifscCode, phonePNo } = req.body;

    // Find user by ID
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update bank details
    user.accHold = accountHolder;
    user.accNo = accountNumber;
    user.ifsc = ifscCode;
    user.phonepeNo = phonePNo;

    await user.save();

    res.json({ success: true, message: 'Bank details updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



router.post('/reset-password', fetchuser, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Both old and new password are required" });
    }

    console.log("oldPassword:", oldPassword); // should be a string
    console.log("user.password:", user?.password); // should be the hashed password
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect old password" });

    const salt = await bcrypt.genSalt(10);
    const hashedNew = await bcrypt.hash(newPassword, salt);
    user.password = hashedNew;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});



// Route:4 Get all products of User
router.get('/mypurchases', fetchuser, async (req, res) => {
  try {
    const userProducts = await UserProduct.find({ user: req.user.id }).populate('product').populate('user');
    res.json(userProducts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
})



router.post('/createreward', upload.single('image'), async (req, res) => {
  try {
    const { coins, realPrice, productName, discount } = req.body;
    const imagePath = req.file ? req.file.path : '';

    const newReward = new Reward({
      coins,
      realPrice,
      productName,
      discount,
      image: imagePath
    });

    await newReward.save();
    res.status(201).json({ message: 'Reward created successfully', reward: newReward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



router.get('/getrewards', async (req, res) => {
  try {
    const rewards = await Reward.find();

    // Optionally, attach the full URL for each image
    const rewardsWithImageURL = rewards.map((reward) => ({
      ...reward.toObject(),
      imageURL: `${req.protocol}://${req.get('host')}/uploads/${reward.image}`
    }));

    res.json(rewardsWithImageURL);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



router.post('/withdrawcreate', fetchuser, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // ✅ Check if user has enough withdrawable balance
    if (user.currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient withdrawable balance' });
    }

    const request = new WithdrawRequest({
      user: user._id,
      amount,
      accountHolder: user.accHold,
      accountNumber: user.accNo,
      ifscCode: user.ifsc,
      contactNo: user.phone,
      UPI: user.phonepeNo,
    });

    await request.save();

    return res.status(201).json({ message: 'Withdraw request created successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




router.get('/getallwithdraw', async (req, res) => {
  try {
    const requests = await WithdrawRequest.find()
      .populate('user', 'name email phone') // populate user info
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



router.patch('/withdraw/:id/approve', async (req, res) => {
  try {
    const withdraw = await WithdrawRequest.findById(req.params.id).populate('user');
    if (!withdraw) return res.status(404).json({ error: 'Withdraw request not found' });

    if (withdraw.status !== 'Pending') {
      return res.status(400).json({ error: 'Withdraw request already processed' });
    }

    // Subtract from user's withdrawable balance
    if (withdraw.user.currentBalance < withdraw.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    withdraw.user.currentBalance -= withdraw.amount;
    await withdraw.user.save();

    withdraw.status = 'Approved';
    await withdraw.save();

    res.json({ message: 'Withdraw approved & balance updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



router.patch('/withdraw/:id/reject', async (req, res) => {
  try {
    const withdraw = await WithdrawRequest.findById(req.params.id);
    if (!withdraw) return res.status(404).json({ error: 'Withdraw request not found' });

    if (withdraw.status !== 'Pending') {
      return res.status(400).json({ error: 'Withdraw request already processed' });
    }

    withdraw.status = 'Rejected';
    await withdraw.save();

    res.json({ message: 'Withdraw rejected.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



// Get all withdrawals for logged-in user
router.get('/mywithdrawals', fetchuser, async (req, res) => {
  try {
    const withdrawals = await WithdrawRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



// Get all redemptions for logged-in user
router.get('/myredemptions', fetchuser, async (req, res) => {
  try {
    const redemptions = await Redemption.find({ user: req.user.id })
      .populate('reward')
      .sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



router.post('/createrecharge', fetchuser, async (req, res) => {
  const { amount, txnId } = req.body;
  const userId = req.user.id;

  try {
    if (!amount || amount < 1000) {
      return res.status(400).json({ error: 'Minimum amount : 1000' });
    }

    const recharge = new Recharge({
      user: userId,
      amount,
      txnId
    });

    await recharge.save();

    res.json({ message: 'Recharge request submitted! Wait for approval.', recharge });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
})



// GET: Admin view all recharge requests
router.get('/allrecharges', async (req, res) => {
  try {
    const recharges = await Recharge.find()
      .populate('user', 'name phone email') // get user basic info
      .sort({ createdAt: -1 });
    res.json(recharges);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



router.get('/myrecharges', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch recharges
    const recharges = await Recharge.find({ user: userId }).sort({ createdAt: -1 });

    // Fetch user details
    const user = await User.findById(userId).select('-password'); 
    // Remove password for security

    return res.status(200).json({ recharges, user });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// PATCH: Approve recharge
router.patch('/recharge/:id/approve', async (req, res) => {
  const recharge = await Recharge.findById(req.params.id);
  if (!recharge) return res.status(404).send('Recharge not found');
  if (recharge.status !== 'Pending') return res.status(400).send('Already processed');

  recharge.status = 'Approved';
  await recharge.save();

  const user = await User.findById(recharge.user);
  user.rechargeBalance += recharge.amount;
  await user.save();

  res.json({ message: 'Recharge approved and balance updated!' });
});



router.patch('/recharge/:id/reject', async (req, res) => {
  const recharge = await Recharge.findById(req.params.id);
  if (!recharge) return res.status(404).send('Recharge not found');

  recharge.status = 'Rejected';
  await recharge.save();

  res.json({ message: 'Recharge rejected.' });
});



// function calculateEarnings(product, purchasedAt) {
//   const parseIncomeString = (str) => {
//     const num = str.toLowerCase().trim();
//     if (num.includes('k')) {
//       return parseFloat(num.replace('k', '')) * 1000;
//     } else if (num.includes('L')) {
//       return parseFloat(num.replace('L', '')) * 100000;
//       } else if (num.includes('Cr')) {
//       return parseFloat(num.replace('Cr', '')) * 10000000;
//       } else {
//       return parseFloat(num);
//     }
//   };

//   const parseDurationString = (str) => {
//     return parseInt(str.replace(/[^\d]/g, ''));
//   };

//   const dailyIncome = parseIncomeString(product.dailyIncome);
//   const durationDays = parseDurationString(product.duration);

//   const purchaseDate = new Date(purchasedAt);
//   const today = new Date();

//   const daysPassed = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
//   const earnings = Math.min(daysPassed, durationDays) * dailyIncome;

//   return earnings;
// }

// 📌 Route
// router.post('/updatetotalincome', fetchuser, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const userProducts = await UserProduct.find({ user: userId, isActive: true }).populate('product');

//     let totalGenerated = 0;

//     for (const up of userProducts) {
//       const generated = calculateEarnings(up.product, up.createdAt);
//       totalGenerated += generated;
//     }

//     const user = await User.findById(userId);
//     user.currentBalance += totalGenerated;

//     await user.save();

//     res.json({
//       message: 'Total income updated',
//       added: totalGenerated,
//       totalIncome: user.totalIncome
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server error');
//   }
// });



router.post('/updatetotalincome', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;

    const userProducts = await UserProduct.find({ user: userId, isActive: true }).populate('product');

    let totalGenerated = 0;

    for (const up of userProducts) {
      // Helper stays same
      const parseIncomeString = (str) => {
        const num = str.toLowerCase().trim();
        if (num.includes('k')) {
          return parseFloat(num.replace('k', '')) * 1000;
        } else if (num.includes('l')) {
          return parseFloat(num.replace('l', '')) * 100000;
        } else {
          return parseFloat(num);
        }
      };
      const parseDurationString = (str) => parseInt(str.replace(/[^\d]/g, ''));

      const dailyIncome = parseIncomeString(up.product.dailyIncome);
      const durationDays = parseDurationString(up.product.duration);

      const purchaseDate = new Date(up.createdAt);
      const today = new Date();

      const lastUpdate = up.lastIncomeUpdate || purchaseDate;
      const daysPassed = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
      const daysSinceLast = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));

      const remainingDays = durationDays - Math.floor((lastUpdate - purchaseDate) / (1000 * 60 * 60 * 24));
      const newDays = Math.min(daysSinceLast, remainingDays);

      const newEarnings = newDays > 0 ? newDays * dailyIncome : 0;
      totalGenerated += newEarnings;

      // Update lastIncomeUpdate
      up.lastIncomeUpdate = today;
      await up.save();
    }

    const user = await User.findById(userId);
    user.currentBalance += totalGenerated;
    await user.save();

    res.json({
      message: 'Total income updated',
      added: totalGenerated,
      totalIncome: user.currentBalance,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



// router.post('/createreward', async (req, res) => {
//   const { coins, realPrice, productName, discount, image } = req.body;

//   const reward = new Reward({
//     coins,
//     realPrice,
//     productName,
//     discount,
//     image // just a string
//   });

//   await reward.save();
//   res.json({ message: 'Reward created successfully', reward });
// });


module.exports = router;