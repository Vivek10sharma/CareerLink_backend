const express = require('express');
const router = express.Router();
const {applyToJob, getMyApplications, deleteMyApplication, recommendJobsByCategory} = require('../controllers/jobApplicationController');
const authenticateCandidate = require('../middleware/authenticateCandidate');

// Apply to a job
// router.post('/apply', authenticateCandidate, applyToJob);
router.post('/apply/:jobId', authenticateCandidate, applyToJob);


// Get all job applications (admin or recruiter access assumed)
router.get('/myapplications', authenticateCandidate, getMyApplications);
router.delete('/myapplications/:applicationId', authenticateCandidate, deleteMyApplication);


module.exports = router;
