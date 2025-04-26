const express = require('express');
const Contribution = require('../models/Contribution'); // MongoDB model
const router = express.Router();

// Get all contributions or filter by eventId (GET /api/contributions?eventId=123)
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;

    if (eventId) {
      // If eventId is provided, filter contributions by eventId
      const contributions = await Contribution.find({ eventId });
      res.json(contributions);
    } else {
      // If eventId is not provided, fetch all contributions
      const contributions = await Contribution.find();
      res.json(contributions);
    }
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({ message: req.t('contributions.fetch_error') });
  }
});

// Add a new contribution
router.post('/', async (req, res) => {
  try {
    const newContribution = new Contribution(req.body);
    await newContribution.save();
    res.status(201).json({
      message: req.t('contributions.add_success'),
      contribution: newContribution,
    });
  } catch (error) {
    console.error('Error adding contribution:', error);

    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message; // Field-specific validation messages
      }
      res.status(400).json({
        message: req.t('contributions.validation_error'),
        errors,
      });
    } else {
      // Other server errors
      res.status(500).json({
        message: req.t('contributions.add_error'),
        error: error.message,
      });
    }
  }
});

module.exports = router;