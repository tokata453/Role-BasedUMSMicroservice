const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

process.env.GATEWAY_API_KEY = "test-internal-key";

const User = require("../models/User");
const internalAuth = require("../middleware/internalAuth");
const adminRoute = require("../routes/admin");

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

const request = (server, method, path, apiKey = "test-internal-key") => new Promise((resolve, reject) => {
    const req = http.request({
        hostname: "127.0.0.1",
        port: server.address().port,
        path,
        method,
        headers: apiKey ? { "x-internal-api-key": apiKey } : {}
    }, async (res) => {
        const responseBody = await readBody(res);
        resolve({ status: res.statusCode, body: responseBody ? JSON.parse(responseBody) : null });
    });

    req.on("error", reject);
    req.end();
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
    app.use("/api/admin", adminRoute);
    return app;
};

test("admin service validates gateway key, searches, lists, and deletes users", async () => {
    const originalFind = User.find;
    const originalDeleteOne = User.deleteOne;
    const selectCalls = [];
    const findFilters = [];

    User.find = (filter = {}) => {
        findFilters.push(filter);
        const hasMissingEmail = filter.email && filter.email.$regex === "missing@example.com";
        const users = hasMissingEmail ? [] : [{ name: "Admin View", email: "user@example.com", role: "user" }];
        return createSelectable(users, selectCalls);
    };
    User.deleteOne = async ({ email }) => ({ deletedCount: email === "delete@example.com" ? 1 : 0 });

    const server = await listen(createApp());

    try {
        assert.equal((await request(server, "GET", "/api/admin/viewalluser", null)).status, 403);
        assert.equal((await request(server, "GET", "/api/admin/searchuser")).status, 400);

        const found = await request(server, "GET", "/api/admin/searchuser?name=admin");
        assert.equal(found.status, 200);
        assert.equal(found.body.count, 1);
        assert.equal(found.body.users[0].email, "user@example.com");

        const notFound = await request(server, "GET", "/api/admin/searchuser?email=missing@example.com");
        assert.equal(notFound.status, 404);

        const allUsers = await request(server, "GET", "/api/admin/viewalluser");
        assert.equal(allUsers.status, 200);
        assert.equal(allUsers.body.count, 1);

        assert.equal((await request(server, "DELETE", "/api/admin/deluser")).status, 400);
        assert.equal((await request(server, "DELETE", "/api/admin/deluser?email=missing@example.com")).status, 404);
        assert.equal((await request(server, "DELETE", "/api/admin/deluser?email=delete@example.com")).status, 200);

        assert.deepEqual(selectCalls, ["-password", "-password", "-password"]);
        assert.deepEqual(findFilters[0], { name: { $regex: "admin", $options: "i" } });
        assert.deepEqual(findFilters[1], { email: { $regex: "missing@example.com", $options: "i" } });
        assert.deepEqual(findFilters[2], {});
    } finally {
        User.find = originalFind;
        User.deleteOne = originalDeleteOne;
        await close(server);
    }
});