const express = require('express');
const Event = require('../models/Event'); // MongoDB model
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Validation middleware with localized messages
const eventValidation = [
  body('name').trim().notEmpty().withMessage(() => req.t('events.validation.name_required')),
  body('date').isISO8601().withMessage(() => req.t('events.validation.date_invalid')),
  body('description').optional().trim(),
  body('requiresContribution').isBoolean().withMessage(() => req.t('events.validation.requires_contribution_boolean')),
];

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: req.t('events.fetch_error') });
  }
});

// Add a new event
router.post('/', eventValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json({
      message: req.t('events.add_success'),
      event: newEvent,
    });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: req.t('events.add_error'), error: error.message });
  }
});

// Update event
router.put('/:id', eventValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ message: req.t('events.not_found') });
    }
    res.json({
      message: req.t('events.update_success'),
      event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: req.t('events.server_error') });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: req.t('events.not_found') });
    }
    res.json({ message: req.t('events.delete_success') });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: req.t('events.server_error') });
  }
});

// Update event attendance
router.put('/:id/attendance', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: req.t('events.not_found') });
    }

    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ message: req.t('events.attendance.member_id_required') });
    }

    if (!event.attendees.includes(memberId)) {
      event.attendees.push(memberId); // Add member to attendees
    } else {
      event.attendees = event.attendees.filter((id) => id !== memberId); // Remove member from attendees
    }

    await event.save();
    res.json({
      message: req.t('events.attendance_updated'),
      event,
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: req.t('events.attendance_error'), error: error.message });
  }
});

module.exports = router;