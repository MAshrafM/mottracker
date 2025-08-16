// server/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
// Import the database connection function
const connectDB = require('./config/db');
// --- Import route files ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const motorRoutes = require('./routes/motorRoutes');

// Connect to MongoDB
connectDB();

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON in request body

// --- Mount routers ---
app.use('/api/auth', authRoutes); // Any request to /api/auth/... will be handled by authRoutes
app.use('/api/users', userRoutes); // Mount the new user routes
app.use('/api/motors', motorRoutes); // Mount the motor routes

// A simple test route to make sure everything is working
app.get('/', (req, res) => {
  res.send('Motor Maintenance Tracker API is running...');
});

const PORT = process.env.PORT || 5001; // Use port from .env or default to 5001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
