/**
 * Admin Approval Routes
 * Handles superadmin workflows for approving/rejecting admin registrations.
 * Base Path: /api/v1/admin
 */
const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const AdminProfile = require('./../models/adminProfile');
const AuditLog = require('./../models/auditLog');
const { jwtAuthMiddleware } = require('./../jwt');
const { authorizeRoles } = require('./../middleware/roleAuth');

// All routes require superadmin authentication
router.use(jwtAuthMiddleware);
router.use(authorizeRoles('superadmin'));

// ─── GET /pending — List all pending admin requests ───
router.get('/pending', async (req, res) => {
    try {
        const pendingAdmins = await User.find({
            role: 'admin',
            status: 'pending',
            isVerified: true,
        }).select('-password -otp -otpExpiry -aadharHash -loginHistory');

        // Attach admin profile data
        const results = await Promise.all(
            pendingAdmins.map(async (admin) => {
                const profile = await AdminProfile.findOne({ userId: admin._id });
                return {
                    user: admin,
                    adminProfile: profile,
                };
            })
        );

        res.status(200).json({ admins: results, total: results.length });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// ─── GET /all — List all admins (any status) ───
router.get('/all', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = { role: 'admin', isVerified: true };
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(filter);

        const admins = await User.find(filter)
            .select('-password -otp -otpExpiry -aadharHash -loginHistory')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const results = await Promise.all(
            admins.map(async (admin) => {
                const profile = await AdminProfile.findOne({ userId: admin._id });
                return {
                    user: admin,
                    adminProfile: profile,
                };
            })
        );

        res.status(200).json({
            admins: results,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// ─── GET /:id — View single admin request details ───
router.get('/:id', async (req, res) => {
    try {
        const admin = await User.findOne({
            _id: req.params.id,
            role: 'admin',
        }).select('-password -otp -otpExpiry -aadharHash -loginHistory');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const profile = await AdminProfile.findOne({ userId: admin._id });

        res.status(200).json({ user: admin, adminProfile: profile });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// ─── PUT /:id/approve — Approve admin registration ───
router.put('/:id/approve', async (req, res) => {
    try {
        const admin = await User.findOne({
            _id: req.params.id,
            role: 'admin',
            status: 'pending',
        });

        if (!admin) {
            return res.status(404).json({ message: 'Pending admin not found' });
        }

        // Update user
        admin.isApproved = true;
        admin.status = 'active';
        await admin.save();

        // Update admin profile
        const profile = await AdminProfile.findOne({ userId: admin._id });
        if (profile) {
            profile.approvalStatus = 'approved';
            profile.approvedBy = req.currentUser._id;
            profile.approvalDate = new Date();
            await profile.save();
        }

        // Log the action
        await AuditLog.create({
            action: 'admin_approved',
            adminId: req.currentUser._id,
            adminName: req.currentUser.name,
            targetType: 'candidate', // reusing existing enum — represents a user target
            targetId: admin._id,
            targetName: admin.name,
            details: `Approved admin registration for ${admin.name} (${admin.email})`,
        });

        console.log(`Admin approved: ${admin.name} by ${req.currentUser.name}`);
        res.status(200).json({ message: 'Admin approved successfully', admin });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// ─── PUT /:id/reject — Reject admin registration ───
router.put('/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;

        const admin = await User.findOne({
            _id: req.params.id,
            role: 'admin',
            status: 'pending',
        });

        if (!admin) {
            return res.status(404).json({ message: 'Pending admin not found' });
        }

        // Update user
        admin.isApproved = false;
        admin.status = 'rejected';
        await admin.save();

        // Update admin profile
        const profile = await AdminProfile.findOne({ userId: admin._id });
        if (profile) {
            profile.approvalStatus = 'rejected';
            profile.approvedBy = req.currentUser._id;
            profile.approvalDate = new Date();
            profile.rejectionReason = reason || 'No reason provided';
            await profile.save();
        }

        // Log the action
        await AuditLog.create({
            action: 'admin_rejected',
            adminId: req.currentUser._id,
            adminName: req.currentUser.name,
            targetType: 'candidate',
            targetId: admin._id,
            targetName: admin.name,
            details: `Rejected admin registration for ${admin.name}: ${reason || 'No reason'}`,
        });

        console.log(`Admin rejected: ${admin.name} by ${req.currentUser.name}`);
        res.status(200).json({ message: 'Admin rejected', admin });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
