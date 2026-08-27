import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

// Parse CLIENT_URL which can be a single URL or comma-separated list
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
]
  .filter(Boolean)
  .flatMap((url) => url.split(',').map((u) => u.trim()));

// CORS configuration supporting credentials and deployment domains
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, Postman, cron)
    if (!origin) return callback(null, true);

    // Allow configured origins, local development, Vercel deployments, Render
    if (
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    service: 'My Maligai Backend API',
    message: 'API is running successfully 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    server: 'running',
    database: isDbConnected ? 'connected' : 'disconnected',
    databaseReadyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reminders', reminderRoutes);

app.post('/api/setup/create-admin', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;

    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Ramesh Kumar (Owner)',
        username: 'admin',
        email: 'owner@mymaligai.com',
        phone: '9876543210',
        password: 'admin123',
        role: 'admin',
        active: true,
      });
    }

    let cashier = await User.findOne({ username: 'cashier' });
    if (!cashier) {
      cashier = await User.create({
        name: 'Suresh Raina (Cashier)',
        username: 'cashier',
        email: 'cashier@mymaligai.com',
        phone: '9876543211',
        password: 'cashier123',
        role: 'cashier',
        active: true,
      });
    }

    res.json({
      success: true,
      message: 'Demo accounts ready: admin (admin123) and cashier (cashier123)',
      users: {
        admin: admin.username,
        cashier: cashier.username,
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
