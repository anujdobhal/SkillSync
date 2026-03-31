const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    note: String
  }],
  requiredRoles: [{ type: String }],
  requests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: String,
    note: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  status: {
    type: String,
    enum: ['Recruiting', 'Full', 'Completed'],
    default: 'Recruiting',
  }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
