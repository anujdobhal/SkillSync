const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  skills: [{ type: String }],
  interests: [{ type: String }],
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  preferredRoles: [{ type: String }],
  projects: [{
    title: String,
    description: String,
    link: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
