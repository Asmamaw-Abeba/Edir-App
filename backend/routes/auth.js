

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Member = require('../models/Members');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || '424c47368962b5f6f72c2d3dbaf724531c4ebb9bf006222549a8ae71d1d6b5a14f7a6a7cf9937ac74d872459202fb30760e13681749f54e4a0c54f5d9575403c';
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

const JWT_EXPIRY = '1h';
const SALT_ROUNDS = 10;

// Middleware to validate JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: req.t('auth.unauthorized_no_token') });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: req.t('auth.unauthorized_invalid_token') });
  }
};

// Validation middleware for registration
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(req => req.t('auth.register.validation.name')),
  body('contact')
    .trim()
    .matches(/^(09|\+2519)\d{8}$/)
    .withMessage(req => req.t('auth.register.validation.contact')),
  body('password')
    .isLength({ min: 8 })
    .withMessage(req => req.t('auth.register.validation.password')),
  body('role')
    .isIn(['member', 'admin'])
    .withMessage(req => req.t('auth.register.validation.role')),
];

// Register a new member
router.post('/register', registerValidation, async (req, res) => {
  console.log('Register route hit'); // Log when route is reached
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, contact, password, role } = req.body;
  console.log('Request body:', { name, contact, password, role });

  try {
    const existingMember = await Member.findOne({ contact });
    console.log('Existing member check:', existingMember);
    if (existingMember) {
      return res.status(400).json({ message: req.t('auth.register.exists') });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('Password hashed');

    const member = new Member({
      name,
      contact,
      password: hashedPassword,
      role,
    });
    await member.save();
    console.log('Member saved:', member);

    const token = jwt.sign(
      { id: member._id, name: member.name, contact: member.contact, role: member.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    console.log('Token generated');

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });
    console.log('Cookie set');

    res.status(201).json({
      message: req.t('auth.register.success'),
      member: { id: member._id, name, contact, role },
      token,
    });
    console.log('Response sent');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: req.t('auth.register.server_error') });
  }
});

// Validation middleware for login
const loginValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage(req => req.t('auth.login.validation.name_required')),
  body('contact')
    .trim()
    .notEmpty()
    .withMessage(req => req.t('auth.login.validation.contact_required')),
  body('password')
    .notEmpty()
    .withMessage(req => req.t('auth.login.validation.password_required')),
  body('role')
    .isIn(['member', 'admin'])
    .withMessage(req => req.t('auth.login.validation.role')),
];

// Login member
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, contact, password, role } = req.body;

  try {
    // Find member
    const member = await Member.findOne({ name, contact, role });
    if (!member) {
      console.log('Response message:', req.t('auth.login.invalid_credentials'));
      return res.status(400).json({ message: req.t('auth.login.invalid_credentials') });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      console.log('Response message:', req.t('auth.login.invalid_credentials'));
      return res.status(400).json({ message: req.t('auth.login.invalid_credentials') });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: member._id, name: member.name, contact: member.contact, role: member.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    res.json({
      message: req.t('auth.login.success'),
      member: { id: member._id, name, contact, role },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: req.t('auth.login.server_error') });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: req.t('auth.logout.success') });
});

// Protected route example
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: req.t('auth.protected.success'), user: req.user });
});

module.exports = router;