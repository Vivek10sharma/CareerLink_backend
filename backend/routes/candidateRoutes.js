// candidateRoutes.js
const express = require('express');
const router = express.Router();
const authenticateCandidate = require('../middleware/authenticateCandidate');
const { searchJobs, jobs, getJobById } = require('../controllers/jobController');

const Candidate = require('../models/Candidate');

router.get('/search', searchJobs);
router.get('/jobs', authenticateCandidate, jobs)



router.get('/profile', authenticateCandidate, async (req, res) => {
  try {
    // Use req.user.userId since your token payload has userId
    const candidate = await Candidate.findById(req.user.userId);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ name: candidate.name });
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', getJobById);

module.exports = router;
