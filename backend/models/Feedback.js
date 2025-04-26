const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  audio: String,
  text: String,
  rating: Number,
  // likes: { type: Number, default: 0 }, // New field for likes
  // dislikes: { type: Number, default: 0 }, // New field for dislikes
  // comments: [{ text: String, memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }, date: { type: Date, default: Date.now } }], // New field for comments
});

module.exports = mongoose.model('Feedback', feedbackSchema);