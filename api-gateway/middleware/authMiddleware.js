const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        // 1. Check for token in Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Format: "Bearer <token>"
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ message: "Access denied. Invalid token format." });
        }

        const token = parts[1];

        // 2. Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // Token expired or invalid
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Access denied. Token expired." });
            }
            return res.status(401).json({ message: "Access denied. Invalid token." });
        }

        // 3. Attach user info to request
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();

    } catch (error) {
        res.status(500).json({ message: "Server error in authentication" });
    }
};

module.exports = authMiddleware;
