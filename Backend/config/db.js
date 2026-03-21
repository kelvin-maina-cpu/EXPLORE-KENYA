const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (retries > 0) {
      console.log(`Retrying database connection... (${retries} left)`);
      await wait(5000);
      return connectDB(retries - 1);
    }

    throw new Error('Max retries exceeded while connecting to MongoDB');
  }
};

module.exports = connectDB;
