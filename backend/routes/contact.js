const express = require('express');
const Contact = require('../models/Contact'); // MongoDB model
const router = express.Router();

// Fetch contacts
router.get('/contact', async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: req.t('contact.fetch_error') });
  }
});

// Add a new contact
router.post('/contact', async (req, res) => {
  try {
    console.log('Received:', req.body);
    const newContact = new Contact(req.body);
    await newContact.save();
    res.status(201).json({
      message: req.t('contact.add_success'),
      contact: newContact,
    });
  } catch (error) {
    console.error('Error adding contact:', error);

    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message; // Field-specific validation messages
      }
      res.status(400).json({
        message: req.t('contact.validation_error'),
        errors,
      });
    } else {
      // Other server errors
      res.status(500).json({
        message: req.t('contact.add_error'),
        error: error.message,
      });
    }
  }
});

module.exports = router;