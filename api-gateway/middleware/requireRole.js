// Enforces route-level role authorization after authMiddleware verifies the JWT.
// Role checks live in the gateway so internal services can trust forwarded identity headers.
const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: `Access denied. ${role} role required.` });
    }

    next();
};

module.exports = requireRole;