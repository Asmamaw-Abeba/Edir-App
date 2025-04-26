// models/Members.js
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    match: /^[a-zA-Z\s'-]+$/,
  },
  contact: {
    type: String,
    required: true,
    unique: true,
    match: /^(09|\+2519)\d{8}$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verified: { type: Boolean, default: false }, // New field for verification
});

module.exports = mongoose.model('Member', memberSchema);