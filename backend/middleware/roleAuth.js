const User = require('../models/user');

/**
 * Role-based authorization middleware
 * Usage: authorizeRoles('admin', 'superadmin')
 * Must be used AFTER jwtAuthMiddleware
 */
const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      // Attach full user object for convenience
      req.currentUser = user;
      next();
    } catch (err) {
      console.log('Role auth error:', err);
      return res.status(500).json({ error: 'internal server error' });
    }
  };
};

module.exports = { authorizeRoles };
