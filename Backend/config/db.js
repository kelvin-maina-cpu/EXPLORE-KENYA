const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const redactMongoUri = (uri = '') =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i, '$1$2:***@');

const isAuthError = (error) => {
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`.toLowerCase();
  return message.includes('auth') || message.includes('authentication failed');
};

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (isAuthError(error)) {
      console.error('MongoDB authentication failed for URI:', redactMongoUri(process.env.MONGO_URI));
      console.error('Check the Atlas database user, password, and whether that user has access to the `explorekenya` database.');
      throw error;
    }

    if (retries > 0) {
      console.log(`Retrying database connection... (${retries} left)`);
      await wait(5000);
      return connectDB(retries - 1);
    }

    throw new Error('Max retries exceeded while connecting to MongoDB');
  }
};

module.exports = connectDB;
