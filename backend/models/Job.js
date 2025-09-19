const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  category: String,
  company: String,
  recruiterId : { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' }, 
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
