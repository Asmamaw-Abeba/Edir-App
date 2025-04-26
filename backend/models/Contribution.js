const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  memberId: { type: String, required: true },
  eventId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  type: { type: String, required: true },
});

module.exports = mongoose.model('Contribution', contributionSchema);