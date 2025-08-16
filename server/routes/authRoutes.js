// server/routes/authRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller function
const { login } = require('../controllers/authController');

// Define the route
router.post('/login', login);
// We will add the login route here later

module.exports = router;
