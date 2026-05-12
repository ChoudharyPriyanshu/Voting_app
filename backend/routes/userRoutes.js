/**
 * User Routes
 * Handles user registration, authentication, profile management, and OTP verification.
 * Base Path: /api/v1/user
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('./../models/user');
const AdminProfile = require('./../models/adminProfile');
const AuditLog = require('./../models/auditLog');
const { jwtAuthMiddleware, generateToken } = require('./../jwt');
const { generateOTP, sendOTPEmail } = require('./../mailer');
const { validateSignup, calculateAge } = require('./../middleware/validate');
const { handleSignupUploads } = require('./../uploadConfig');

const HASH_SECRET = process.env.AADHAAR_HASH_SECRET || 'default-hash-secret';

/**
 * Hash Aadhaar number using HMAC-SHA256
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

// ─── Signup (sends OTP, does NOT return token) ───
router.post('/signup', handleSignupUploads, validateSignup, async (req, res) => {
    try {
        const data = req.body;

        // Block superadmin registration (double check)
        if (data.role === 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized role assignment' });
        }

        // Require email for OTP
        if (!data.email) {
            return res.status(400).json({ message: 'Email is required for verification' });
        }

        // Hash and mask Aadhaar
        const rawAadhaar = data.aadharCardNumber.toString().replace(/\s/g, '');
        const aadharHash = hashAadhaar(rawAadhaar);
        const aadharMasked = maskAadhaar(rawAadhaar);

        // Check for existing verified user with same Aadhaar hash
        const existingVerified = await User.findOne({ aadharHash, isVerified: true });
        if (existingVerified) {
            return res.status(400).json({ message: 'An account with this Aadhaar number already exists' });
        }

        // Check unique email
        const existingEmail = await User.findOne({ email: data.email, isVerified: true });
        if (existingEmail) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Check unique voter ID number
        const existingVoterId = await User.findOne({ voterIdNumber: data.voterIdNumber, isVerified: true });
        if (existingVoterId) {
            return res.status(400).json({ message: 'An account with this Voter ID already exists' });
        }

        // Check if unverified user with same aadhar hash already exists
        const existingUnverified = await User.findOne({
            aadharHash,
            isVerified: false,
        });
        if (existingUnverified) {
            // Assign IDs if missing
            if (data.role === 'admin' && !existingUnverified.adminId) {
                existingUnverified.adminId = `ADMIN-${Math.floor(100000 + Math.random() * 900000)}`;
            } else if (data.role !== 'admin' && !existingUnverified.voterId) {
                existingUnverified.voterId = `VOTER-${Math.floor(100000 + Math.random() * 900000)}`;
            }

            // Resend OTP to existing unverified account
            const otp = generateOTP();
            existingUnverified.otp = otp;
            existingUnverified.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await existingUnverified.save();

            try {
                await sendOTPEmail(existingUnverified.email, otp);
            } catch (emailErr) {
                console.log('Email send failed:', emailErr.message);
            }

            return res.status(200).json({
                needsVerification: true,
                email: existingUnverified.email,
                message: 'OTP resent to your email',
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Generate Unique ID based on role
        if (data.role === 'admin') {
            data.adminId = `ADMIN-${Math.floor(100000 + Math.random() * 900000)}`;
            console.log('Generated Admin ID:', data.adminId);
        } else {
            data.voterId = `VOTER-${Math.floor(100000 + Math.random() * 900000)}`;
            console.log('Generated Voter ID:', data.voterId);
        }

        // Build user object
        const userData = {
            name: data.name,
            dob: new Date(data.dob),
            gender: data.gender,
            mobile: data.mobile,
            email: data.email,
            state: data.state,
            district: data.district,
            pincode: data.pincode,
            address: data.address,
            aadharHash,
            aadharMasked,
            voterIdNumber: data.voterIdNumber,
            profilePhoto: req.uploadedProfilePhoto || null,
            password: data.password,
            role: data.role,
            voterId: data.voterId || undefined,
            adminId: data.adminId || undefined,
            otp,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            isVerified: false,
        };

        // Role-specific settings
        if (data.role === 'voter') {
            userData.constituency = data.constituency;
            userData.citizenship = data.citizenship || 'Indian';
            userData.termsAccepted = data.termsAccepted === 'true' || data.termsAccepted === true;
            userData.isApproved = true;
            userData.status = 'active';
        } else if (data.role === 'admin') {
            userData.isApproved = false;
            userData.status = 'pending';
        }

        const newUser = new User(userData);
        const savedUser = await newUser.save();
        console.log('User saved (unverified):', savedUser.email);

        // If admin, create AdminProfile
        if (data.role === 'admin') {
            const adminProfile = new AdminProfile({
                userId: savedUser._id,
                organizationName: data.organizationName,
                officialEmail: data.officialEmail,
                employeeId: data.employeeId,
                designation: data.designation,
                reasonForAccess: data.reasonForAccess,
                verificationDocument: req.uploadedVerificationDoc || null,
                linkedInUrl: data.linkedInUrl || null,
                approvalStatus: 'pending',
            });
            await adminProfile.save();
            console.log('Admin profile created for:', savedUser.email);
        }

        // Send OTP email
        try {
            await sendOTPEmail(data.email, otp);
        } catch (emailErr) {
            console.log('Email send failed:', emailErr.message);
        }

        res.status(200).json({
            needsVerification: true,
            email: data.email,
            message: 'Account created! Please verify your email with the OTP sent.',
        });
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            // Duplicate key error
            const field = Object.keys(err.keyPattern)[0];
            const fieldNames = {
                aadharHash: 'Aadhaar number',
                email: 'Email',
                voterIdNumber: 'Voter ID',
                voterId: 'System Voter ID',
                adminId: 'System Admin ID',
            };
            return res.status(400).json({
                message: `An account with this ${fieldNames[field] || field} already exists`
            });
        }
        res.status(500).json({ error: 'internal server error' });
    }
});

// ─── Verify OTP ───
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account already verified' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpiry && new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Mark as verified
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        // For admin accounts, don't generate token — they need approval first
        if (user.role === 'admin') {
            console.log('Admin verified (pending approval):', user.email);
            return res.status(200).json({
                pendingApproval: true,
                message: 'Email verified! Your admin account is pending approval by a superadmin.',
            });
        }

        // Generate token for voters
        const token = generateToken({ id: user.id });

        console.log('User verified:', user.email, 'ID:', user.role === 'admin' ? user.adminId : user.voterId);
        res.status(200).json({ token, user, message: 'Email verified successfully!' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// ─── Resend OTP ───
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account already verified' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        try {
            await sendOTPEmail(user.email, otp);
        } catch (emailErr) {
            console.log('Email send failed:', emailErr.message);
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

        console.log('OTP resent to:', user.email);
        res.status(200).json({ message: 'New OTP sent to your email' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// ─── Login (blocks unverified users & unapproved admins) ───
router.post('/login', async (req, res) => {
    try {
        const { aadharCardNumber, password } = req.body;

        if (!aadharCardNumber || !password) {
            return res.status(400).json({ error: 'Aadhaar number and password are required' });
        }

        // Hash the incoming Aadhaar for lookup
        const rawAadhaar = aadharCardNumber.toString().replace(/\s/g, '');
        const aadharHash = hashAadhaar(rawAadhaar);

        const user = await User.findOne({ aadharHash });

        if (!user) {
            return res.status(401).json({ error: 'Invalid Aadhaar number or Password' });
        }

        // Check account lockout
        if (user.isLocked()) {
            const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                error: `Account locked. Try again in ${lockMinutes} minute(s).`
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            // Track failed attempt
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            user.loginHistory.push({
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                timestamp: new Date(),
                success: false,
            });

            // Lock after 5 failed attempts for 30 minutes
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                await user.save();
                return res.status(423).json({
                    error: 'Too many failed attempts. Account locked for 30 minutes.'
                });
            }

            await user.save();
            return res.status(401).json({ error: 'Invalid Aadhaar number or Password' });
        }

        // Block unverified users
        if (!user.isVerified) {
            return res.status(403).json({
                error: 'Please verify your email first',
                needsVerification: true,
                email: user.email,
            });
        }

        // Block unapproved admins
        if (user.role === 'admin' && !user.isApproved) {
            return res.status(403).json({
                error: 'Admin account pending approval.',
                pendingApproval: true,
            });
        }

        // Block rejected/suspended accounts
        if (user.status === 'rejected') {
            return res.status(403).json({ error: 'Your account has been rejected.' });
        }
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Your account has been suspended.' });
        }

        // Successful login — reset failed attempts
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.loginHistory.push({
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            success: true,
        });

        // Keep only last 20 login records
        if (user.loginHistory.length > 20) {
            user.loginHistory = user.loginHistory.slice(-20);
        }

        await user.save();

        const token = generateToken({ id: user.id });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server error' });
    }
});

// ─── Profile ───
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password -otp -otpExpiry -aadharHash -loginHistory');
        res.status(200).json({ user });
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: 'internal server error' });
    }
});

// ─── Change Password ───
router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(userId);

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        console.log('Password Updated');
        res.status(200).json({ message: 'password updated' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;