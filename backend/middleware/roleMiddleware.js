// Restricts access to users with one of the allowed roles.
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    return next();
  };
}

module.exports = roleMiddleware;
