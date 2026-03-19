const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();
const db = require('./db');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiter for login: max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

const jwtAuthMiddleware = require('./jwt');
//import the router files
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const electionRoutes = require('./routes/electionRoutes');
const exportRoutes = require('./routes/exportRoutes');
const auditRoutes = require('./routes/auditRoutes');

// Apply rate limiter to login route
app.use('/user/login', loginLimiter);

//use the router 
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);
app.use('/election', electionRoutes);
app.use('/election', exportRoutes);
app.use('/audit', auditRoutes);


app.listen(PORT, () => {
  console.log('server is listening at 3000 port');

});