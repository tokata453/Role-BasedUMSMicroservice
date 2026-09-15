const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Registration creates either user or admin accounts for the shared collection.
// Gateway leaves this route public; this handler owns input validation and duplicate checks.
router.post("/userregister", async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // Required fields match assignment API contract.
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Name, email, password, and role are required" });
        }

        // Restrict stored roles to values used by gateway authorization.
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be admin or user" });
        }
        
        // Return friendly duplicate response before MongoDB unique index raises an error.
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Duplicate email. User already registered." });

        // User model pre-save hook hashes the password before it reaches MongoDB.
        const user = new User({ name, email, password, role, phone });
        await user.save();

        res.status(201).json({ message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).json({ message: "Server error during registration" });
    }
});

module.exports = router;
