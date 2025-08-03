const connectToMongo = require('./db');
const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userproductRoutes = require('./routes/userproduct')

connectToMongo();

const app = express();
const port = 5000;

app.use(cors());

// app.use(cors({
//   origin: 'http://localhost:3000'
// }));

app.use(express.json());

app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // relative to where you run `node index.js`
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('API is running...');
});

//Available routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/userproduct', userproductRoutes);


app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:5000`);
});