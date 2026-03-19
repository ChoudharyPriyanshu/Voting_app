const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { uniqWith } = require('lodash');

// define user  schema 
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },

  mobile: {
    type: String,

  },

  email: {
    type: String,
  },

  address: {
    type: String,
    required: true
  },

  aadharCardNumber: {
    type: Number,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    enum: ['voter', 'admin'],
    type: String,
    default: 'voter'

  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  votedElections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'election'
  }]
})

userSchema.pre('save', async function (next) {
  const user = this;

  //hash the password only if it is modified
  if (!user.isModified('password')) {
    return next();
  }
  try {
    //hash password generation
    const salt = await bcrypt.genSalt(10);
    //hash password
    const hashedPassword = await bcrypt.hash(user.password, salt);
    //override the plain password with hash password
    user.password = hashedPassword;
    next();
  }
  catch (err) {
    return next(err);
  }
})


userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    //used bcrypt to compare the provided Password with hashed password
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  }
  catch (err) {
    throw err;
  }
}
// create user model
const user = mongoose.model('user', userSchema);
module.exports = user;