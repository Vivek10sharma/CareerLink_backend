const jwt = require('jsonwebtoken');
const Recruiter = require('../models/Recruiter');

const authenticateRecruiter = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use userId if present, else fallback to id (depending on how you signed it)
    const recruiterId = decoded.userId || decoded.id;

    const recruiter = await Recruiter.findById(recruiterId).select('-password');

    if (!recruiter) {
      return res.status(401).json({ error: 'Recruiter not found' });
    }

    req.recruiter = recruiter;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateRecruiter };
