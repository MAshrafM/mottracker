// server/config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const environment = process.env.NODE_ENV || 'development';
    let mongoURI = process.env.MONGO_URI;

    /*
    if (environment !== 'production') {
      mongoURI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/motortracker';
      console.log('Using local MongoDB database for development...');
    }
      */

    // Mongoose.connect returns a promise, so we await it
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit the process with a failure code
  }
};

module.exports = connectDB;
