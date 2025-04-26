const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  requiresContribution: { type: Boolean, required: true },
  attendees: { type: [String], default: [] }, // Array of member IDs
});

module.exports = mongoose.model('Event', eventSchema);