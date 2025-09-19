const JobApplication = require('../models/JobApplication');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

const applyToJob = async (req, res) => {
  try {
    const { resumeUrl } = req.body;
    const { jobId } = req.params;
    const candidateId = req.user.userId;

    if (!resumeUrl || !jobId) {
      return res.status(400).json({ msg: 'Resume URL and job ID are required' });
    }

    const candidate = await Candidate.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      return res.status(404).json({ msg: 'Candidate or Job not found' });
    }

    const existingApplication = await JobApplication.findOne({ candidate: candidateId, job: jobId });
    if (existingApplication) {
      return res.status(400).json({ msg: 'You have already applied to this job.' });
    }

    const newApplication = new JobApplication({
      candidate: candidateId,
      job: jobId,
      resumeUrl,
    });

    await newApplication.save();

    return res.status(201).json({ msg: 'Application submitted successfully' });

  } catch (err) {
    console.error('Apply Job Error:', err);
    return res.status(500).json({ msg: 'Server error while submitting application' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const candidateId = req.user.userId;

    const applications = await JobApplication.find({ candidate: candidateId }).populate('job');

    res.status(200).json({ applications });
  } catch (err) {
    console.error('Error fetching candidate applications:', err);
    res.status(500).json({ msg: 'Server error while fetching applications' });
  }
};

const deleteMyApplication = async (req, res) => {
  try {
    const candidateId = req.user.userId;
    const { applicationId } = req.params;

    const deletedApp = await JobApplication.findOneAndDelete({
      _id: applicationId,
      candidate: candidateId,
    });

    if (!deletedApp) {
      return res.status(404).json({ msg: 'Application not found or unauthorized' });
    }

    res.status(200).json({ msg: 'Application cancelled successfully' });
  } catch (err) {
    console.error('Delete Application Error:', err);
    res.status(500).json({ msg: 'Server error while deleting application' });
  }
};



module.exports = { applyToJob, getMyApplications , deleteMyApplication};
