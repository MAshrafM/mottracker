// server/config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose.connect returns a promise, so we await it
    const conn = await mongoose.connect(process.env.MONGO_URI, {
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
