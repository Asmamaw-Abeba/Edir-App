const express = require('express');
const Member = require('../models/Members'); // MongoDB model
const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: req.t('members.fetch_error') });
  }
});

// Add a new member
router.post('/', async (req, res) => {
  try {
    const newMember = new Member(req.body);
    await newMember.save();
    res.status(201).json({
      message: req.t('members.add_success'),
      member: newMember,
    });
  } catch (error) {
    console.error('Error adding member:', error);
    if (error.name === 'ValidationError') {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = req.t(error.errors[field].message); // Localize Mongoose validation errors
      }
      res.status(400).json({ message: req.t('members.validation_error'), errors });
    } else {
      res.status(500).json({ message: req.t('members.add_error'), error: error.message });
    }
  }
});

// Update a member
router.put('/:id', async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedMember) {
      return res.status(404).json({ message: req.t('members.not_found') });
    }
    res.json({
      message: req.t('members.update_success'),
      member: updatedMember,
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: req.t('members.update_error'), error: error.message });
  }
});

// Delete a member
router.delete('/:id', async (req, res) => {
  try {
    const deletedMember = await Member.findByIdAndDelete(req.params.id);
    if (!deletedMember) {
      return res.status(404).json({ message: req.t('members.not_found') });
    }
    res.json({ message: req.t('members.delete_success') });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: req.t('members.delete_error'), error: error.message });
  }
});

module.exports = router;