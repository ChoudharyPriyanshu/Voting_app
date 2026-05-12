const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { uniqWith } = require('lodash');

// define user  schema 
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  // Aadhaar stored securely — never store plain
  aadharHash: {
    type: String,
    required: true,
    unique: true
  },
  aadharMasked: {
    type: String,
    required: true
  },
  voterIdNumber: {
    type: String,
    required: true,
    unique: true
  },
  profilePhoto: {
    type: String // Cloudinary URL
  },
  // System-generated IDs (kept for backward compatibility)
  voterId: {
    type: String,
    unique: true,
    sparse: true
  },
  adminId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    enum: ['voter', 'admin', 'superadmin'],
    type: String,
    default: 'voter'
  },
  // Voter-specific fields
  constituency: {
    type: String
  },
  citizenship: {
    type: String,
    default: 'Indian'
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  // Verification & approval
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true // true for voters, false for admin signups
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected', 'suspended'],
    default: 'active'
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  // Security tracking
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    success: Boolean
  }],
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  votedElections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'election'
  }]
}, { timestamps: true });

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

/**
 * Check if account is currently locked
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// create user model
const user = mongoose.model('user', userSchema);
module.exports = user;