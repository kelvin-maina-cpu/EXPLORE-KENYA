const mongoose = require('mongoose');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
};

const redactMongoUri = (uri = '') =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i, '$1$2:***@');

const isAuthError = (error) => {
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`.toLowerCase();
  return message.includes('auth') || message.includes('authentication failed');
};

const isNetworkTimeout = (error) => {
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`.toLowerCase();
  return (
    error?.code === 'ETIMEDOUT' ||
    message.includes('etimedout') ||
    message.includes('server selection timed out') ||
    message.includes('timed out')
  );
};

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, MONGOOSE_OPTIONS);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (isAuthError(error)) {
      console.error('MongoDB authentication failed for URI:', redactMongoUri(process.env.MONGO_URI));
      console.error('Check the Atlas database user, password, and whether that user has access to the `explorekenya` database.');
      throw error;
    }

    if (isNetworkTimeout(error)) {
      console.error('MongoDB Atlas timed out for URI:', redactMongoUri(process.env.MONGO_URI));
      console.error('Check that the Atlas cluster is running, the current IP is allowed in Atlas Network Access, and outbound port 27017 is not blocked.');
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
