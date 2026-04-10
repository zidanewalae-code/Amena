// Configures the Express application, middleware, and API routes.
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const needRoutes = require('./routes/needRoutes');
const donationRoutes = require('./routes/donationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentWebhookRoutes = require('./routes/paymentWebhookRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const socialRoutes = require('./routes/socialRoutes');
const platformRoutes = require('./routes/platformRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');

const app = express();

app.use('/api/payments/webhook', paymentWebhookRoutes);
app.use(
	cors({
		origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003').split(','),
		credentials: false
	})
);
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/needs', needRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/solidarity', socialRoutes);
app.use('/api', platformRoutes);
app.use('/api/marketplace', marketplaceRoutes);

module.exports = app;
