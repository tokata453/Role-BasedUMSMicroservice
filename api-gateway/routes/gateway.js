const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const forwardRequest = require("../middleware/forwardRequest");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

const services = {
    registration: process.env.REGISTRATION_SERVICE_URL || "http://localhost:3001/api/registration",
    login: process.env.LOGIN_SERVICE_URL || "http://localhost:3002/api/login",
    admin: process.env.ADMIN_SERVICE_URL || "http://localhost:3003/api/admin",
    user: process.env.USER_SERVICE_URL || "http://localhost:3004/api/user"
};

router.get("/health", (req, res) => {
    res.json({ message: "API Gateway running" });
});

router.use("/register", forwardRequest(services.registration));
router.use("/auth", forwardRequest(services.login));
router.use("/admin", authMiddleware, requireRole("admin"), forwardRequest(services.admin));
router.use("/user", authMiddleware, requireRole("user"), forwardRequest(services.user));

module.exports = router;