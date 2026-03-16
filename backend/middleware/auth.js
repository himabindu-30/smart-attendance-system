// middleware/auth.js
const jwt = require('jsonwebtoken');

// Verify JWT token
function verifyToken(req, res, next) {
  // Get token from header
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Remove 'Bearer ' prefix if present
  const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;

  try {
    // Verify token
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    
    // Continue to next middleware/route
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = verifyToken;