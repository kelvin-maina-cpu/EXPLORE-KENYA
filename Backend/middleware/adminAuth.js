const { protect } = require('./authMiddleware');

const adminAuth = (req, res, next) => {
  protect(req, res, (protectError) => {
    if (protectError) {
      return next(protectError);
    }

    if (!req.user || req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Admin access required'));
    }

    return next();
  });
};

module.exports = adminAuth;
