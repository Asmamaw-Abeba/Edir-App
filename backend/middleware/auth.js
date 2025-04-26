const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.log('No Authorization header provided');
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  // Check if token is in "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
  if (!token) {
    console.log('Malformed Authorization header');
    return res.status(401).json({ message: 'Invalid token format, authorization denied' });
  }

  try {
    // Verify token using secret
    const secret = process.env.JWT_SECRET || 'your-default-secret'; // Use env var in production
    const decoded = jwt.verify(token, secret);
    console.log('Token decoded:', decoded);
    
    // Attach decoded user data to request
    req.user = decoded; // Should include { id, role, ... } from token payload
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ message: 'Token is not valid, authorization denied' });
  }
};

module.exports = authMiddleware;