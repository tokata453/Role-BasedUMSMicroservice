const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Profile lookup is bound to gateway-provided identity, not a client-supplied email.
// This prevents one user from reading another profile by changing query params.
router.get("/viewprofile", async (req, res) => {
    try {
        const email = req.headers["x-auth-user-email"];
        if (!email) return res.status(400).json({ message: "Email parameter required" });

        // Never send password hashes back to profile clients.
        const user = await User.findOne({ email }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ user });
    } catch (err) {
        console.error("View profile error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Profile updates can change only allowed self-service fields.
// Email, role, and password remain outside this endpoint.
router.put("/updateprofile", async (req, res) => {
    try {
        const email = req.headers["x-auth-user-email"];
        const { name, phone } = req.body;
        if (!email) return res.status(400).json({ message: "Email parameter required" });
        if (!name && !phone) return res.status(400).json({ message: "Name or phone is required" });

        // Build a small update object so omitted fields remain unchanged.
        // Mongoose timestamps update updatedAt automatically.
        const update = {};
        if (name) update.name = name;
        if (phone) update.phone = phone;

        // runValidators keeps schema rules active for update operations.
        const updatedUser = await User.findOneAndUpdate(
            { email },
            update,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        console.error("Update profile error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
