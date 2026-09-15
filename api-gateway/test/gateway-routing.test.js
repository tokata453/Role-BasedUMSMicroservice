const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const jwt = require("jsonwebtoken");

// Captures every forwarded request so assertions can verify routing and trusted headers.
const requests = [];

// Test-specific environment must be set before requiring the gateway because routes read URLs on load.
process.env.JWT_SECRET = "test-secret";
process.env.GATEWAY_API_KEY = "test-internal-key";
process.env.REGISTRATION_SERVICE_URL = "http://127.0.0.1:3101/api/registration";
process.env.LOGIN_SERVICE_URL = "http://127.0.0.1:3102/api/login";
process.env.ADMIN_SERVICE_URL = "http://127.0.0.1:3103/api/admin";
process.env.USER_SERVICE_URL = "http://127.0.0.1:3104/api/user";

const app = require("../server");

// Minimal body reader keeps the test dependency-free and works for gateway and mock services.
const readBody = (req) => new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => resolve(body));
});

// Mock downstream service records what the gateway sends and returns a JSON success response.
const createMockService = (port, name) => new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
        const body = await readBody(req);
        requests.push({
            service: name,
            method: req.method,
            url: req.url,
            apiKey: req.headers["x-internal-api-key"],
            authEmail: req.headers["x-auth-user-email"],
            authRole: req.headers["x-auth-user-role"],
            body: body ? JSON.parse(body) : null
        });

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ service: name, ok: true }));
    });

    server.listen(port, "127.0.0.1", () => resolve(server));
});

// Helpers wrap native http server lifecycle in promises for async test cleanup.
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
const close = (server) => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

// Sends a real HTTP request to the gateway without supertest or extra dependencies.
const request = (port, method, path, { token, body } = {}) => new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request({
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {})
        }
    }, async (res) => {
        const responseBody = await readBody(res);
        resolve({ status: res.statusCode, body: responseBody ? JSON.parse(responseBody) : null });
    });

    req.on("error", reject);
    req.end(data);
});

// Integration-style gateway test: prefix routing, auth failures, role failures, and header forwarding.
test("gateway forwards by prefix and enforces roles", async () => {
    const mocks = await Promise.all([
        createMockService(3101, "registration"),
        createMockService(3102, "login"),
        createMockService(3103, "admin"),
        createMockService(3104, "user")
    ]);
    const gateway = await listen(http.createServer(app));
    const port = gateway.address().port;
    const adminToken = jwt.sign({ id: "1", email: "admin@example.com", role: "admin" }, process.env.JWT_SECRET);
    const userToken = jwt.sign({ id: "2", email: "user@example.com", role: "user" }, process.env.JWT_SECRET);
    const expiredToken = jwt.sign({ id: "3", email: "old@example.com", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "-1s" });

    try {
        assert.equal((await request(port, "GET", "/health")).status, 200);

        // Public prefixes forward without JWT; protected prefixes reject missing or wrong-role tokens.
        assert.equal((await request(port, "POST", "/register/newendpoint?x=1", { body: { name: "A" } })).status, 200);
        assert.equal((await request(port, "POST", "/auth/anything", { body: { email: "a@b.com" } })).status, 200);
        assert.equal((await request(port, "GET", "/admin/newthing")).status, 401);
        assert.equal((await request(port, "GET", "/admin/newthing", { token: "wrong.token.value" })).status, 401);
        assert.equal((await request(port, "GET", "/admin/newthing", { token: expiredToken })).status, 401);
        assert.equal((await request(port, "GET", "/admin/newthing", { token: userToken })).status, 403);
        assert.equal((await request(port, "GET", "/user/profile-extra", { token: adminToken })).status, 403);
        assert.equal((await request(port, "DELETE", "/admin/newthing?id=9", { token: adminToken })).status, 200);
        assert.equal((await request(port, "PUT", "/user/profile-extra", { token: userToken, body: { phone: "123" } })).status, 200);

        // Remaining path and query string must be appended to each service base URL.
        assert.deepEqual(requests.map((item) => [item.service, item.method, item.url]), [
            ["registration", "POST", "/api/registration/newendpoint?x=1"],
            ["login", "POST", "/api/login/anything"],
            ["admin", "DELETE", "/api/admin/newthing?id=9"],
            ["user", "PUT", "/api/user/profile-extra"]
        ]);

        // Gateway must include internal key and trusted JWT claims for downstream services.
        assert.equal(requests[2].apiKey, "test-internal-key");
        assert.equal(requests[2].authEmail, "admin@example.com");
        assert.equal(requests[2].authRole, "admin");
        assert.equal(requests[3].authEmail, "user@example.com");
        assert.deepEqual(requests[3].body, { phone: "123" });
    } finally {
        // Always close sockets so node:test can exit cleanly after failures too.
        await close(gateway);
        await Promise.all(mocks.map(close));
    }
});
