const mongoose = require('mongoose');
 require('dotenv').config();

// define the mongoDB URL
// const mongoUrl = process.env.MONGODB_URL_LOCAL;
 const mongoUrl = process.env.MONGODB_URL;
// Set up mongoose connection
mongoose.connect(mongoUrl,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
   
})

// get the default connection
//mongoose maintains a default connection object reprresenting mongoDB csonnection
const db = mongoose.connection;

// define event listener for database connection

db.on('connected',()=>{
    console.log('connected to mongoDB server');
})

db.on('disconnected',()=>{
    console.log('disconnected from mongoDB server');
})

db.on('error',(err)=>{
    console.log(' mongoDB connection error',err);
})

//export the database connection
module.exports = db;
