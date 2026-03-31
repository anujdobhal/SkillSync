const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
