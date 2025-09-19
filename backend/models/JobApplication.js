// models/JobApplication.js
const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  resumeUrl: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
