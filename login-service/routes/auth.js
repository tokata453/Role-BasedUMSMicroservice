const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

router.post("/login", async (req, res) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ message: "Email, password, and role are required" });
        }

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be admin or user" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        // Check password match
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        // Check role match
        if (user.role !== role) return res.status(403).json({ message: "Role mismatch. Please provide correct role." });

        // Generate JWT
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
