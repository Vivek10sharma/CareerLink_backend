// jobRoutes.js
const express = require('express');
const router = express.Router();
const { postJob, getJobs, deleteJob, UpdateJob, jobs, GetApplyApplication, updateApplicationStatus } = require('../controllers/jobController');
const { authenticateRecruiter } = require('../middleware/authenticateRecruiter');
const authenticateCandidate = require('../middleware/authenticateCandidate');

router.post('/post', authenticateRecruiter, postJob);



router.get('/', jobs);

router.get('/my-jobs', authenticateRecruiter, getJobs); 
router.delete('/my-jobs/:id', authenticateRecruiter, deleteJob);
router.put('/my-jobs/:id', authenticateRecruiter, UpdateJob);

router.get('/application', authenticateRecruiter, GetApplyApplication); 
router.put('/status/:id', authenticateRecruiter, updateApplicationStatus);



module.exports = router;
