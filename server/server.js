import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import passport from 'passport';
import configurePassport from './config/passport.js';

// Import configurations
import connectDatabase from './config/database.js';
import configureCloudinary from './config/cloudinary.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import testMail from './routes/testMail.js';
import sendNotificationTest from './routes/sendNotificationTest.js';
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Import middlewares
import {
  errorHandler,
  notFound,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,
  setupSigtermHandler,
} from './middlewares/errorHandler.js';

// Import services
import { initializeScheduler } from './services/schedulerService.js';

// Import models for initial setup
import User from './models/User.js';

// LOAD ENVIRONMENT VARIABLES (handled by top-level import)

// ====================================
// SETUP UNCAUGHT EXCEPTION HANDLER
// ====================================
setupUncaughtExceptionHandler();

// ====================================
// CREATE EXPRESS APP
// ====================================
const app = express();

// ====================================
// SECURITY MIDDLEWARES
// ====================================

// Set security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

// Enable CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : [process.env.FRONTEND_URL || 'http://localhost:5173'];

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));

// Allow popups to communicate via postMessage (required for Google Identity popup)
app.use((req, res, next) => {
  // Allow opener popups to postMessage back
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // In development skip rate limiting to avoid blocking local testing and frequent reloads
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') return true;
    // Skip rate limiting for health check
    return req.path === '/api/health';
  },
});

app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ====================================
// BODY PARSING MIDDLEWARES
// ====================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// Initialize Passport
configurePassport();
app.use(passport.initialize());

// ====================================
// REQUEST LOGGING (Development)
// ====================================

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
  });
}

// ====================================
// HEALTH CHECK ENDPOINT
// ====================================

app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    res.status(200).json({
      success: true,
      message: 'Server is running',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: {
          status: dbStates[dbState] || 'unknown',
          connected: dbState === 1,
        },
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
    });
  }
});

// ====================================
// API ROUTES
// ====================================

// Base API route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Apartment Maintenance System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      complaints: '/api/complaints',
      users: '/api/users',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api', testMail);
app.use('/api', sendNotificationTest);
app.use('/api/chatbot', chatRoutes);
app.use('/api/payments', paymentRoutes);

// ====================================
// STATIC FILES (If needed)
// ====================================

// Serve static files from uploads directory (if using local storage)
// app.use('/uploads', express.static('uploads'));

// ====================================
// ERROR HANDLING
// ====================================

// Handle 404 - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ====================================
// DATABASE CONNECTION & SERVER START
// ====================================

const PORT = process.env.PORT || 5000;

// Create initial admin user if not exists
const createInitialAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@apartmentmaintenance.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminData = {
        name: process.env.ADMIN_NAME || 'System Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        phone: process.env.ADMIN_PHONE || '9999999999',
        role: 'admin',
        isActive: true,
      };

      await User.create(adminData);
      console.log('✅ Initial admin user created successfully');
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log('🔑 Please change the password after first login!');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating initial admin:', error.message);
  }
};

// Start server function
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Configure Cloudinary
    configureCloudinary();

    // Create initial admin user
    await createInitialAdmin();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
      console.log(`📡 Server URL: http://localhost:${PORT}`);
      console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(50));
    });

    // Initialize Socket.io
    import('./utils/socket.js').then(({ initSocket }) => {
      initSocket(server);
      console.log('🔌 Socket.io initialized');
    }).catch(err => console.error('Failed to init socket', err));

    // Setup graceful shutdown handlers
    setupUnhandledRejectionHandler(server);
    setupSigtermHandler(server);

    // Initialize scheduler for background jobs
    if (process.env.ENABLE_SCHEDULER !== 'false') {
      initializeScheduler(true);
    } else {
      console.log('⏰ Scheduler is disabled');
    }

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        throw error;
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// ====================================
// EXPORT APP FOR TESTING
// ====================================

export default app;