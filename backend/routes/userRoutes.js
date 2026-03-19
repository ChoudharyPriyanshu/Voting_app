const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const { jwtAuthMiddleware, generateToken } = require('./../jwt');
const { generateOTP, sendOTPEmail } = require('./../mailer');

// ─── Signup (sends OTP, does NOT return token) ───
router.post('/signup', async (req, res) => {
    try {
        const data = req.body;

        // Check admin limit
        if (data.role === 'admin') {
            const existingAdmin = await User.findOne({ role: 'admin' });
            if (existingAdmin) {
                return res.status(403).json({ message: 'An admin already exists' });
            }
        }

        // Require email for OTP
        if (!data.email) {
            return res.status(400).json({ message: 'Email is required for verification' });
        }

        // Check if unverified user with same aadhar already exists
        const existingUnverified = await User.findOne({
            aadharCardNumber: data.aadharCardNumber,
            isVerified: false,
        });
        if (existingUnverified) {
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

        const newUser = new User({
            ...data,
            otp,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            isVerified: false,
        });

        const savedUser = await newUser.save();
        console.log('User saved (unverified):', savedUser.email);

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

        // Generate token
        const token = generateToken({ id: user.id });

        console.log('User verified:', user.email);
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

// ─── Login (blocks unverified users) ───
router.post('/login', async (req, res) => {
    try {
        const { aadharCardNumber, password } = req.body;

        const user = await User.findOne({ aadharCardNumber });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid aadharCardNumber or Password' });
        }

        // Block unverified users
        if (!user.isVerified) {
            return res.status(403).json({
                error: 'Please verify your email first',
                needsVerification: true,
                email: user.email,
            });
        }

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
        const user = await User.findById(userId);
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