const jwt = require('jsonwebtoken');

const authenticateCandidate = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/apply') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'candidate') {
      return res.status(403).json({ message: 'Forbidden - Not a candidate' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = authenticateCandidate;
