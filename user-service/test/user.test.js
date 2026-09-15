const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

process.env.GATEWAY_API_KEY = "test-internal-key";

const User = require("../models/User");
const internalAuth = require("../middleware/internalAuth");
const userRoute = require("../routes/user");

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

const request = (server, method, path, { body, email, apiKey = "test-internal-key" } = {}) => new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request({
        hostname: "127.0.0.1",
        port: server.address().port,
        path,
        method,
        headers: {
            ...(apiKey ? { "x-internal-api-key": apiKey } : {}),
            ...(email ? { "x-auth-user-email": email } : {}),
            ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {})
        }
    }, async (res) => {
        const responseBody = await readBody(res);
        resolve({ status: res.statusCode, body: responseBody ? JSON.parse(responseBody) : null });
    });

    req.on("error", reject);
    req.end(data);
});

const createSelectable = (result, calls) => ({
    select: async (fields) => {
        calls.push(fields);
        return result;
    }
});

const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use(internalAuth);
    app.use("/api/user", userRoute);
    return app;
};

test("user service binds profile reads and updates to trusted gateway identity", async () => {
    const originalFindOne = User.findOne;
    const originalFindOneAndUpdate = User.findOneAndUpdate;
    const selectCalls = [];
    const findEmails = [];
    const updateCalls = [];

    User.findOne = ({ email }) => {
        findEmails.push(email);
        const user = email === "user@example.com" ? { name: "User", email, role: "user" } : null;
        return createSelectable(user, selectCalls);
    };
    User.findOneAndUpdate = (filter, update, options) => {
        updateCalls.push({ filter, update, options });
        const user = filter.email === "user@example.com" ? { name: update.name || "User", phone: update.phone, email: filter.email, role: "user" } : null;
        return createSelectable(user, selectCalls);
    };

    const server = await listen(createApp());

    try {
        assert.equal((await request(server, "GET", "/api/user/viewprofile", { email: "user@example.com", apiKey: null })).status, 403);
        assert.equal((await request(server, "GET", "/api/user/viewprofile")).status, 400);
        assert.equal((await request(server, "GET", "/api/user/viewprofile", { email: "missing@example.com" })).status, 404);

        const profile = await request(server, "GET", "/api/user/viewprofile", { email: "user@example.com" });
        assert.equal(profile.status, 200);
        assert.deepEqual(profile.body.user, { name: "User", email: "user@example.com", role: "user" });
        assert.equal(Object.hasOwn(profile.body.user, "password"), false);

        assert.equal((await request(server, "PUT", "/api/user/updateprofile", { email: "user@example.com", body: {} })).status, 400);
        assert.equal((await request(server, "PUT", "/api/user/updateprofile", { email: "missing@example.com", body: { name: "Missing" } })).status, 404);

        const updated = await request(server, "PUT", "/api/user/updateprofile", {
            email: "user@example.com",
            body: { name: "Updated", phone: "123", email: "attacker@example.com", role: "admin" }
        });

        assert.equal(updated.status, 200);
        assert.equal(updated.body.user.email, "user@example.com");
        assert.equal(updated.body.user.name, "Updated");
        assert.equal(updated.body.user.phone, "123");
        assert.deepEqual(findEmails, ["missing@example.com", "user@example.com"]);
        assert.deepEqual(selectCalls, ["-password", "-password", "-password", "-password"]);
        assert.equal(updateCalls[1].filter.email, "user@example.com");
        assert.equal(updateCalls[1].update.name, "Updated");
        assert.equal(updateCalls[1].update.phone, "123");
        assert.equal(Object.hasOwn(updateCalls[1].update, "email"), false);
        assert.equal(Object.hasOwn(updateCalls[1].update, "role"), false);
        assert.equal(Object.hasOwn(updateCalls[1].update, "updatedAt"), false);
        assert.deepEqual(updateCalls[1].options, { new: true, runValidators: true });
    } finally {
        User.findOne = originalFindOne;
        User.findOneAndUpdate = originalFindOneAndUpdate;
        await close(server);
    }
});