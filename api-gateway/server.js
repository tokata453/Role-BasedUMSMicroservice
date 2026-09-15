const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const authMiddleware = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const services = {
    registration: process.env.REGISTRATION_SERVICE_URL || "http://localhost:3001/api/registration",
    login: process.env.LOGIN_SERVICE_URL || "http://localhost:3002/api/login",
    admin: process.env.ADMIN_SERVICE_URL || "http://localhost:3003/api/admin",
    user: process.env.USER_SERVICE_URL || "http://localhost:3004/api/user"
};

app.use(express.json());

const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: `Access denied. ${role} role required.` });
    }

    next();
};

const forwardRequest = (baseUrl, path = "") => async (req, res) => {
    try {
        const response = await axios({
            method: req.method,
            url: `${baseUrl}${path}`,
            params: req.query,
            data: req.body,
            headers: {
                "x-internal-api-key": process.env.GATEWAY_API_KEY || "",
                "x-auth-user-id": req.user?.id || "",
                "x-auth-user-email": req.user?.email || "",
                "x-auth-user-role": req.user?.role || ""
            },
            validateStatus: () => true
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(502).json({ message: "Gateway error while forwarding request" });
    }
};

app.get("/health", (req, res) => {
    res.json({ message: "API Gateway running" });
});

app.post("/register/userregister", forwardRequest(services.registration, "/userregister"));
app.post("/auth/login", forwardRequest(services.login, "/login"));

app.get("/admin/searchuser", authMiddleware, requireRole("admin"), forwardRequest(services.admin, "/searchuser"));
app.get("/admin/viewalluser", authMiddleware, requireRole("admin"), forwardRequest(services.admin, "/viewalluser"));
app.delete("/admin/deluser", authMiddleware, requireRole("admin"), forwardRequest(services.admin, "/deluser"));

app.get("/user/viewprofile", authMiddleware, requireRole("user"), forwardRequest(services.user, "/viewprofile"));
app.put("/user/updateprofile", authMiddleware, requireRole("user"), forwardRequest(services.user, "/updateprofile"));

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
