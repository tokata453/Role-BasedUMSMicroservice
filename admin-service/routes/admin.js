const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Admin search supports partial name or email lookup for assignment scenarios.
// Passwords are always excluded because admin views should not expose hashes.
router.get("/searchuser", async (req, res) => {
    try {
        const { name, email } = req.query;
        if (!name && !email) return res.status(400).json({ message: "Please provide name or email to search" });

        // Build only requested filters so name and email can be used independently or together.
        let filter = {};
        if (name) filter.name = { $regex: name, $options: "i" };
        if (email) filter.email = { $regex: email, $options: "i" };

        const users = await User.find(filter).select("-password");
        if (users.length === 0) return res.status(404).json({ message: "No users found" });

        res.json({ count: users.length, users });
    } catch (err) {
        console.error("Search error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin list endpoint returns every user document minus password hashes.
// Gateway role middleware is responsible for ensuring only admin JWTs reach here.
router.get("/viewalluser", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json({ count: users.length, users });
    } catch (err) {
        console.error("View all error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin delete endpoint keeps the assignment's email query contract.
// deleteOne avoids returning deleted document data after the operation.
router.delete("/deluser", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: "Email parameter required" });

        const deleted = await User.deleteOne({ email });
        if (deleted.deletedCount === 0) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
