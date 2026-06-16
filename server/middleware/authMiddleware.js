// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config(); // Ensure the .env file is loaded

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;
  // Check if the token is in the authorization header (e.g., 'Bearer <token>')
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token's ID and attach it to the request object
      // We exclude the password field from being attached
      req.user = await User.findById(decoded.id).select('-password');

      if (req.user) {
        try {
          const now = new Date();
          const oneDay = 24 * 60 * 60 * 1000;
          if (!req.user.last_seen_at || (now - new Date(req.user.last_seen_at)) > oneDay) {
            req.user.last_seen_at = now;
            await req.user.save({ validateBeforeSave: false });
          }
        } catch (saveError) {
          console.error('Failed to update last_seen_at:', saveError);
        }
      }

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Middleware to grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ // 403 Forbidden
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};
