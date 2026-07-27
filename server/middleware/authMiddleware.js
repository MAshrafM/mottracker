// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config(); // Ensure the .env file is loaded

// In-memory user cache to speed up authentication checks (5-minute TTL)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  // Check if there is a qrToken query parameter or x-qr-token header
  const qrToken = req.headers['x-qr-token'] || req.query.qrToken || req.query.qrtoken;
  if (qrToken && req.method === 'GET') {
    let motorId = req.params.id || req.params.motorId;
    
    if (!motorId) {
      const parts = req.originalUrl.split('?')[0].split('/');
      const motorsIndex = parts.indexOf('motors');
      const equipmentIndex = parts.indexOf('equipment');
      if (motorsIndex !== -1 && parts[motorsIndex + 1]) {
        motorId = parts[motorsIndex + 1];
      } else if (equipmentIndex !== -1 && parts[equipmentIndex + 1]) {
        motorId = parts[equipmentIndex + 1];
      }
    }

    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (motorId && objectIdRegex.test(motorId)) {
      try {
        const Motor = require('../models/motorModel');
        const motor = await Motor.findById(motorId);
        if (motor && motor.qrToken === qrToken) {
          req.user = {
            _id: 'guest',
            username: 'Guest (QR Scan)',
            role: 'guest'
          };
          return next();
        }
      } catch (err) {
        console.error('Error validating QR token bypass:', err);
      }
    }
  }

  let token;
  // Check if the token is in the authorization header (e.g., 'Bearer <token>')
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check cache first
      const cacheKey = decoded.id;
      const cached = userCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        req.user = cached.user;
      } else {
        // Get user from the token's ID and attach it to the request object
        req.user = await User.findById(decoded.id).select('-password').lean();
        if (req.user) {
          userCache.set(cacheKey, { user: req.user, timestamp: Date.now() });
        }
      }

      if (req.user) {
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        if (!req.user.last_seen_at || (now - new Date(req.user.last_seen_at)) > oneDay) {
          req.user.last_seen_at = now;
          User.updateOne({ _id: decoded.id }, { last_seen_at: now }).catch(saveError => {
            console.error('Failed to update last_seen_at:', saveError);
          });
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
