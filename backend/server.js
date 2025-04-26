// Load environment variables from .env file
require('dotenv').config();
const mongoose = require('mongoose');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const { connect, getDb } = require('./models/Members');
const i18n = require('i18n');
const path = require('path');
const cookieParser = require('cookie-parser');
const languageMiddleware = require('./middleware/language');
const authMiddleware = require('./middleware/auth'); // Adjust path if needed
const app = express();
const PORT = process.env.PORT || 5000;


// Configure CORS to allow requests from your frontend
const corsOptions = {
  origin: 'http://10.235.50.49:3000', // Specify the exact frontend origin
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// app.use(cors());
app.use(express.json());
app.use(cookieParser());



// Configure i18n
i18n.configure({
  locales: ['en', 'am'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  objectNotation: true,
  api: { __: 't' },
  updateFiles: false,
});

// Initialize i18n first
app.use(i18n.init);

// Then set the locale based on x-language header
app.use((req, res, next) => {
  const lang = req.headers['x-language'] || 'en';
  // console.log('Setting locale to:', lang);
  req.setLocale(lang); // Now this should work
  next();
});



// Connect to MongoDB (updated connection code)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err))


// Routes
const membersRouter = require('./routes/members');
const contributionsRouter = require('./routes/contributions');
const eventsRouter = require('./routes/events');
const authRoutes = require('./routes/auth'); // Import your auth routes
const resetRoutes = require('./routes/contactReset'); 
const contactRoutes = require('./routes/contact'); 
const paymentRoutes = require('./routes/payment'); 
app.use('/api/feedback', /*authMiddleware, */ require('./routes/feedback'));


app.use('/api/members', membersRouter);
app.use('/api/contributions', contributionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api', authRoutes); 
app.use('/api', authRoutes); 
app.use('/api', resetRoutes); 
app.use('/api', contactRoutes); 
app.use('/api', paymentRoutes); 


// middle ware
const checkRole = (role) => (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Example: Admin-only route
app.get('/api/admin', checkRole('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});