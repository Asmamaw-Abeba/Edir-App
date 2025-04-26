const express = require('express');
const router = express.Router();
const Members = require('../models/Members');
const jwt = require('jsonwebtoken');

// Define JWT_SECRET - should be loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-424c47368962b5f6f72c2d3dbaf724531c4ebb9bf006222549a8ae71d1d6b5a14f7a6a7cf9937ac74d872459202fb30760e13681749f54e4a0c54f5d9575403c-key-here';

// Forgot contact route
router.post('/forgot-contact', async (req, res) => {
  const { contact } = req.body;

  try {
    // Validate input
    if (!contact) {
      return res.status(400).json({ message: req.t('forgot_contact.contact_required') });
    }

    const member = await Members.findOne({ contact });
    if (!member) {
      return res.status(404).json({ message: req.t('forgot_contact.member_not_found') });
    }

    const resetToken = jwt.sign({ id: member._id }, JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `http://localhost:3000/reset-contact?token=${resetToken}`;

    console.log('Generated token:', resetToken); // Debug log
    console.log('Member ID:', member._id); // Debug log

    res.json({ 
      message: req.t('forgot_contact.member_found'),
      token: resetToken,
      resetLink: resetLink,
    });

  } catch (error) {
    console.error('Forgot contact error:', error);
    res.status(500).json({ 
      message: req.t('forgot_contact.server_error'),
      error: error.message,
    });
  }
});

// Reset contact route
router.post('/reset-contact', async (req, res) => {
  const { token, newContact } = req.body;

  try {
    // Validate input
    if (!token) {
      return res.status(400).json({ message: req.t('reset_contact.token_required') });
    }
    if (!newContact) {
      return res.status(400).json({ message: req.t('reset_contact.new_contact_required') });
    }

    console.log('Received token:', token); // Debug log
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug log
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({ message: req.t('reset_contact.token_expired') });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: req.t('reset_contact.invalid_token') });
      }
      throw jwtError; // Re-throw unexpected JWT errors
    }

    const member = await Members.findById(decoded.id);
    if (!member) {
      return res.status(400).json({ 
        message: req.t('reset_contact.invalid_token_member_not_found'),
        decodedId: decoded.id,
      });
    }

    member.contact = newContact;
    await member.save();

    res.json({ message: req.t('reset_contact.success') });

  } catch (error) {
    console.error('Reset contact error:', error);
    res.status(400).json({ 
      message: req.t('reset_contact.error'),
      error: error.message,
    });
  }
});

module.exports = router;