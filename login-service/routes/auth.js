const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Login validates credentials and issues a short-lived JWT for the gateway to verify.
// Downstream services do not parse JWTs; they trust headers forwarded by the gateway.
router.post("/login", async (req, res) => {
    try {
        // Refuse login when token signing cannot be trusted.
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        // Role stays part of the login contract so users choose the intended portal explicitly.
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ message: "Email, password, and role are required" });
        }

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be admin or user" });
        }

        // Keep auth error generic so callers cannot distinguish unknown email from bad password.
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        // comparePassword hides bcrypt details inside the shared model helper.
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        // Token role must match stored role, not only the submitted role.
        if (user.role !== role) return res.status(403).json({ message: "Role mismatch. Please provide correct role." });

        // Gateway later verifies this token and uses its claims for prefix role checks.
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Login successful", token });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;
