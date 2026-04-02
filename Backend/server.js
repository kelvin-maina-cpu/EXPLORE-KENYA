const fs = require('fs');
const path = require('path');

const localEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(localEnvPath)) {
  require('dotenv').config({ path: localEnvPath, quiet: true });
}

const os = require('os');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startPoller } = require('./jobs/paymentStatusPoller');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const attractionRoutes = require('./routes/attractionRoutes');
const wildlifeRoutes = require('./routes/wildlifeRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const liveStreamRoutes = require('./routes/liveStreamRoutes');
const flightRoutes = require('./routes/flightRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const adminDashboardPath = path.resolve(__dirname, '../Frontend/web-admin');
const frontendAssetsPath = path.resolve(__dirname, '../Frontend/assets');
const faviconPath = path.resolve(frontendAssetsPath, 'favicon.png');
app.use(cors());
app.use(express.json());

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Set it in the environment or a local Backend/.env file.');
  process.exit(1);
}

const getLanAddress = () => {
  const interfaces = os.networkInterfaces();

  for (const network of Object.values(interfaces)) {
    for (const address of network || []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
};

connectDB()
  .then(() => {
    // Start payment status poller
    startPoller();

    app.get('/', (req, res) => res.json({ message: 'Explore Kenya API' }));
    if (fs.existsSync(faviconPath)) {
      app.get('/favicon.ico', (req, res) => {
        res.sendFile(faviconPath);
      });
    }
    if (fs.existsSync(adminDashboardPath)) {
      app.use('/admin-dashboard', express.static(adminDashboardPath));
    }

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/attractions', attractionRoutes);
    app.use('/api/wildlife', wildlifeRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/live-streams', liveStreamRoutes);
    app.use('/api/flights', flightRoutes);
    app.use('/api/weather', weatherRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/bookings', require('./routes/bookingRoutes'));
    app.use('/api/mpesa', require('./routes/mpesaRoutes'));

    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0';

    app.listen(PORT, HOST, () => {
      const lanAddress = getLanAddress();
      console.log(`Server ready: http://localhost:${PORT}`);
      if (lanAddress) {
        console.log(`LAN access: http://${lanAddress}:${PORT}`);
      }
    });
  })
  .catch((err) => {
    console.error('Server startup failed:', err);
    process.exit(1);
  });
