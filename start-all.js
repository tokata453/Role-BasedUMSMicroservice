const { spawn } = require("node:child_process");
const path = require("node:path");

// Start internal services first, then the public gateway, so forwarding targets come up early.
const services = [
    "registration-service",
    "login-service",
    "admin-service",
    "user-service",
    "api-gateway"
];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();
let stopping = false;
let exitCode = 0;

// Kill one child process or its process group.
// Non-Windows uses detached process groups so nodemon and its Node child stop together.
const stopChild = (child, signal) => {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;

    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
};

// Stop every service once. SIGTERM gives nodemon time to shut down cleanly.
// SIGKILL fallback prevents orphaned ports when a child ignores termination.
const stopAll = (code = 0) => {
    if (stopping) return;

    stopping = true;
    exitCode = code;
    for (const child of children) stopChild(child, "SIGTERM");

    setTimeout(() => {
        for (const child of children) stopChild(child, "SIGKILL");
    }, 3000).unref();
};

// Run each service's dev script from its own folder so local package.json and .env are used.
for (const service of services) {
    console.log(`[launcher] Starting ${service}`);
    const child = spawn(npmCommand, ["run", "dev"], {
        cwd: path.join(__dirname, service),
        detached: process.platform !== "win32",
        stdio: "inherit"
    });

    children.add(child);
    child.on("error", (error) => {
        // Startup failure in one service makes the full stack invalid.
        console.error(`[launcher] ${service} failed to start: ${error.message}`);
        stopAll(1);
    });
    child.on("exit", (code, signal) => {
        children.delete(child);

        // Unexpected child exit stops the rest so tests do not hit a half-running stack.
        if (!stopping) {
            console.error(`[launcher] ${service} stopped (${signal || `exit ${code}`})`);
            stopAll(code || 1);
        }

        // Exit only after every child has reported shutdown.
        if (stopping && children.size === 0) process.exit(exitCode);
    });
}

// Ctrl+C and external termination both fan out to all spawned services.
process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
