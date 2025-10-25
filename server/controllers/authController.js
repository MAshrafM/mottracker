// server/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // 2. Check if user exists && password is correct
    // We must explicitly .select('+password') because we set select: false in the model
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches the one in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    // 3. If everything is ok, send token to client
    sendTokenResponse(user, 200, res);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to create, sign, and send a JWT
const sendTokenResponse = (user, statusCode, res) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server JWT configuration error' });
  }

  let token;
  try {
    token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  } catch (err) {
    console.error('JWT sign error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create token' });
  }
  

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
  };

  res
    .status(statusCode )
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
};
