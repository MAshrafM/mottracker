// server/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file BEFORE anything else
dotenv.config();

// Import the database connection function
const connectDB = require('./config/db');
// --- Import route files ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const motorRoutes = require('./routes/motorRoutes');
const plantEquipmentRoutes = require('./routes/plantEquipmentRoutes');

// Connect to MongoDB
connectDB();
const app = express();

// Middleware
// --- CORS CONFIGURATION ---
// Define the single origin that is allowed to make requests
const allowedOrigins = ['https://mottracker.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the incoming origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // !origin allows requests from tools like Postman (where origin is undefined)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // For legacy browser support
};

// --- MIDDLEWARE ---
// Use the CORS middleware *before* your routes
app.use(cors(corsOptions));

// This handles the 'preflight' request for all routes
// Preflight requests are sent for 'complex' requests (like POST with JSON)
app.options('*', cors(corsOptions));
app.use(express.json()); // Enable parsing of JSON in request body

// --- Mount routers ---
app.use('/api/auth', authRoutes); // Any request to /api/auth/... will be handled by authRoutes
app.use('/api/users', userRoutes); // Mount the new user routes
app.use('/api/motors', motorRoutes); // Mount the motor routes
app.use('/api/equipment', plantEquipmentRoutes); // Mount the plant equipment routes

// A simple test route to make sure everything is working
app.get('/', (req, res) => {
  res.send('Motor Maintenance Tracker API is running...');
});

const PORT = process.env.PORT || 5001; // Use port from .env or default to 5001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
