const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.GATEWAY_API_KEY = "test-internal-key";
process.env.JWT_SECRET = "test-secret";

const User = require("../models/User");
const internalAuth = require("../middleware/internalAuth");
const authRoute = require("../routes/auth");

const readBody = (stream) => new Promise((resolve) => {
    let body = "";
    stream.on("data", (chunk) => { body += chunk; });
    stream.on("end", () => resolve(body));
});

const listen = (app) => new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => resolve(server));
});

const close = (server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
});

const request = (server, body, apiKey = "test-internal-key") => new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request({
        hostname: "127.0.0.1",
        port: server.address().port,
        path: "/api/login/login",
        method: "POST",
        headers: {
            ...(apiKey ? { "x-internal-api-key": apiKey } : {}),
            ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {})
        }
    }, async (res) => {
        const responseBody = await readBody(res);
        resolve({ status: res.statusCode, body: responseBody ? JSON.parse(responseBody) : null });
    });

    req.on("error", reject);
    req.end(data);
});

const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use(internalAuth);
    app.use("/api/login", authRoute);
    return app;
};

test("login service validates gateway key, credentials, role, and JWT claims", async () => {
    const originalFindOne = User.findOne;
    const users = new Map([
        ["user@example.com", { _id: "user-id", email: "user@example.com", role: "user", comparePassword: async (password) => password === "secret" }]
    ]);

    User.findOne = async ({ email }) => users.get(email) || null;

    const server = await listen(createApp());

    try {
        assert.equal((await request(server, { email: "user@example.com", password: "secret", role: "user" }, null)).status, 403);
        assert.equal((await request(server, { email: "user@example.com" })).status, 400);
        assert.equal((await request(server, { email: "user@example.com", password: "secret", role: "guest" })).status, 400);
        assert.equal((await request(server, { email: "missing@example.com", password: "secret", role: "user" })).status, 401);
        assert.equal((await request(server, { email: "user@example.com", password: "bad", role: "user" })).status, 401);
        assert.equal((await request(server, { email: "user@example.com", password: "secret", role: "admin" })).status, 403);

        const response = await request(server, { email: "user@example.com", password: "secret", role: "user" });
        const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);

        assert.equal(response.status, 200);
        assert.equal(response.body.message, "Login successful");
        assert.equal(decoded.id, "user-id");
        assert.equal(decoded.email, "user@example.com");
        assert.equal(decoded.role, "user");
    } finally {
        User.findOne = originalFindOne;
        await close(server);
    }
});