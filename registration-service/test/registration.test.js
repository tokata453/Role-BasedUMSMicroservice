const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

process.env.GATEWAY_API_KEY = "test-internal-key";

const User = require("../models/User");
const internalAuth = require("../middleware/internalAuth");
const registerRoute = require("../routes/register");

// Native HTTP helpers keep service tests dependency-free.
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

const request = (server, method, path, { body, apiKey = "test-internal-key" } = {}) => new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request({
        hostname: "127.0.0.1",
        port: server.address().port,
        path,
        method,
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
    app.use("/api/registration", registerRoute);
    return app;
};

test("registration service validates gateway key, input, duplicates, and successful create", async () => {
    const originalFindOne = User.findOne;
    const originalSave = User.prototype.save;
    const savedUsers = [];

    User.findOne = async ({ email }) => email === "taken@example.com" ? { email } : null;
    User.prototype.save = async function save() {
        this._id = "new-user-id";
        savedUsers.push({ name: this.name, email: this.email, role: this.role, phone: this.phone, password: this.password });
    };

    const server = await listen(createApp());

    try {
        assert.equal((await request(server, "POST", "/api/registration/userregister", { apiKey: null })).status, 403);
        assert.equal((await request(server, "POST", "/api/registration/userregister", { body: { email: "a@example.com" } })).status, 400);
        assert.equal((await request(server, "POST", "/api/registration/userregister", { body: { name: "A", email: "a@example.com", password: "pw", role: "guest" } })).status, 400);
        assert.equal((await request(server, "POST", "/api/registration/userregister", { body: { name: "Taken", email: "taken@example.com", password: "pw", role: "user" } })).status, 400);

        const response = await request(server, "POST", "/api/registration/userregister", {
            body: { name: "New User", email: "new@example.com", password: "secret", role: "user", phone: "123" }
        });

        assert.equal(response.status, 201);
        assert.equal(response.body.message, "User registered successfully");
        assert.equal(typeof response.body.user.id, "string");
        assert.equal(response.body.user.name, "New User");
        assert.equal(response.body.user.email, "new@example.com");
        assert.equal(response.body.user.role, "user");
        assert.equal(Object.hasOwn(response.body.user, "password"), false);
        assert.deepEqual(savedUsers, [{ name: "New User", email: "new@example.com", role: "user", phone: "123", password: "secret" }]);
    } finally {
        User.findOne = originalFindOne;
        User.prototype.save = originalSave;
        await close(server);
    }
});