/**
 * Superadmin Seed Script
 * Creates a secure superadmin account that cannot be registered via the public API.
 * 
 * Usage: node seed/superAdmin.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/user');
const db = require('../db');

const HASH_SECRET = process.env.AADHAAR_HASH_SECRET || 'default-hash-secret';

/**
 * Hash Aadhaar number using SHA-256 with secret
 */
function hashAadhaar(aadhaarNumber) {
  return crypto
    .createHmac('sha256', HASH_SECRET)
    .update(aadhaarNumber.toString().replace(/\s/g, ''))
    .digest('hex');
}

/**
 * Mask Aadhaar to show only last 4 digits
 */
function maskAadhaar(aadhaarNumber) {
  const clean = aadhaarNumber.toString().replace(/\s/g, '');
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

async function seedSuperAdmin() {
  try {
    // Wait for DB connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });

    console.log('Connected to database...');

    // Read superadmin details from env
    const name = process.env.SUPERADMIN_NAME || 'Super Admin';
    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@votosphere.com';
    const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@12345';
    const aadhaar = process.env.SUPERADMIN_AADHAR || '999999999999';

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('✅ Superadmin already exists:');
      console.log(`   Name: ${existingSuperAdmin.name}`);
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log('   No changes made.');
      process.exit(0);
    }

    // Hash Aadhaar
    const aadharHash = hashAadhaar(aadhaar);
    const aadharMasked = maskAadhaar(aadhaar);

    // Create superadmin account
    const superAdmin = new User({
      name,
      email,
      password,
      dob: new Date('1990-01-01'),
      gender: 'male',
      mobile: '9999999999',
      state: 'Delhi',
      district: 'New Delhi',
      pincode: '110001',
      address: 'VotoSphere HQ, New Delhi',
      aadharHash,
      aadharMasked,
      voterIdNumber: 'SA-SYSTEM-001',
      role: 'superadmin',
      isVerified: true,
      isApproved: true,
      status: 'active',
    });

    await superAdmin.save();

    console.log('🎉 Superadmin created successfully!');
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Aadhaar (masked): ${aadharMasked}`);
    console.log(`   Role: superadmin`);
    console.log('');
    console.log('⚠️  Keep the superadmin credentials secure!');
    console.log('   Use the Aadhaar number to log in.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding superadmin:', err.message);
    process.exit(1);
  }
}

seedSuperAdmin();
