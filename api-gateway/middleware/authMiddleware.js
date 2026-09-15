const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verifies Bearer tokens for protected gateway prefixes.
// Successful verification attaches claims for role checks and downstream identity headers.
const authMiddleware = async (req, res, next) => {
    try {
        // Without the secret, every token decision is unsafe, so fail closed.
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        // Protected routes require Authorization: Bearer <token>.
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Strict format prevents accidental parsing of unsupported auth schemes.
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ message: "Access denied. Invalid token format." });
        }

        const token = parts[1];

        // jwt.verify checks signature and expiration using the shared login secret.
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // Expired tokens get a precise message; all other verification failures stay generic.
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Access denied. Token expired." });
            }
            return res.status(401).json({ message: "Access denied. Invalid token." });
        }

        // Downstream forwarding and requireRole read only these trusted decoded claims.
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();

    } catch (error) {
        res.status(500).json({ message: "Server error in authentication" });
    }
};

module.exports = authMiddleware;
