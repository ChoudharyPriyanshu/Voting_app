const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./db');
const jwtAuthMiddleware = require('./jwt');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Security Middleware
 */
// Helmet — set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// MongoDB query sanitization — prevent NoSQL injection
app.use(mongoSanitize());

// XSS protection — sanitize user input
app.use(xss());

/**
 * Middleware Configuration
 */
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Security: Rate Limiting
 * Limits login attempts to prevent brute-force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

/**
 * Rate limiter for signup to prevent abuse
 */
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many signup attempts. Please try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

/**
 * Route Imports
 */
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const electionRoutes = require('./routes/electionRoutes');
const exportRoutes = require('./routes/exportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const adminRoutes = require('./routes/adminRoutes');

/**
 * API Routes (v1)
 */
// Apply rate limiters
app.use('/api/v1/user/login', loginLimiter);
app.use('/api/v1/user/signup', signupLimiter);

// Mount routes with versioning prefix
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/election', exportRoutes); // exportRoutes before electionRoutes for overlapping paths
app.use('/api/v1/election', electionRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/admin', adminRoutes);

/**
 * Server Activation
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api/v1`);
});