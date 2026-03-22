const express = require('express');
const router = express.Router();
const AuditLog = require('../models/auditLog');
const User = require('../models/user');
const { jwtAuthMiddleware } = require('../jwt');

// Helper: check admin role
const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID);
        return user.role === 'admin';
    } catch {
        return false;
    }
};

// GET — List audit logs (admin only)
router.get('/', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'admin only' });
    }

    try {
        const { limit = 50, page = 1, action, targetType } = req.query;

        const filter = { adminId: req.user.id };
        if (action) filter.action = action;
        if (targetType) filter.targetType = targetType;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await AuditLog.countDocuments(filter);
        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            logs,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
