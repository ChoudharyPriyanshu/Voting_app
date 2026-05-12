const mongoose = require('mongoose');

// Admin Profile schema — stores admin-specific registration details
const adminProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  organizationName: {
    type: String,
    required: true
  },
  officialEmail: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  reasonForAccess: {
    type: String,
    required: true
  },
  verificationDocument: {
    type: String // Cloudinary URL
  },
  linkedInUrl: {
    type: String
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, { timestamps: true });

// create admin profile model
const AdminProfile = mongoose.model('adminProfile', adminProfileSchema);
module.exports = AdminProfile;
