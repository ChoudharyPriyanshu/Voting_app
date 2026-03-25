const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./db');
const jwtAuthMiddleware = require('./jwt');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware Configuration
 */
app.use(bodyParser.json());
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
 * Route Imports
 */
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const electionRoutes = require('./routes/electionRoutes');
const exportRoutes = require('./routes/exportRoutes');
const auditRoutes = require('./routes/auditRoutes');

/**
 * API Routes (v1)
 */
// Apply rate limiter specifically to login
app.use('/api/v1/user/login', loginLimiter);

// Mount routes with versioning prefix
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/election', exportRoutes); // exportRoutes before electionRoutes for overlapping paths
app.use('/api/v1/election', electionRoutes);
app.use('/api/v1/audit', auditRoutes);

/**
 * Server Activation
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api/v1`);
});