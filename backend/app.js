const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const donRoutes = require('./routes/donRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const alertRoutes = require('./routes/alertRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();

const defaultCorsOrigins = [
	'http://localhost:3000',
	'http://localhost:4173',
	'http://localhost:5173',
	'http://127.0.0.1:3000',
	'http://127.0.0.1:4173',
	'http://127.0.0.1:5173'
];

const configuredCorsOrigins = (process.env.CORS_ORIGIN || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

const allowedCorsOrigins = [...new Set([...configuredCorsOrigins, ...defaultCorsOrigins])];

app.use(
	cors({
		origin: allowedCorsOrigins,
		credentials: false
	})
);
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dons', donRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/history', historyRoutes);

module.exports = app;
