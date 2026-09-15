const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/userregister", async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Name, email, password, and role are required" });
        }

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be admin or user" });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Duplicate email. User already registered." });

        // Create new user (password will be hashed by pre-save middleware)
        const user = new User({ name, email, password, role, phone });
        await user.save();

        res.status(201).json({ message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).json({ message: "Server error during registration" });
    }
});

module.exports = router;
