const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();
const db = require('./db');

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const jwtAuthMiddleware = require('./jwt');
//import the router files
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const electionRoutes = require('./routes/electionRoutes');
const exportRoutes = require('./routes/exportRoutes');

//use the router 
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);
app.use('/election', electionRoutes);
app.use('/election', exportRoutes);


app.listen(PORT, () => {
  console.log('server is listening at 3000 port');

});