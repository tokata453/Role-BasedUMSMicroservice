const { spawn } = require("node:child_process");
const path = require("node:path");

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

const stopChild = (child, signal) => {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;

    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
};

const stopAll = (code = 0) => {
    if (stopping) return;

    stopping = true;
    exitCode = code;
    for (const child of children) stopChild(child, "SIGTERM");

    setTimeout(() => {
        for (const child of children) stopChild(child, "SIGKILL");
    }, 3000).unref();
};

for (const service of services) {
    console.log(`[launcher] Starting ${service}`);
    const child = spawn(npmCommand, ["run", "dev"], {
        cwd: path.join(__dirname, service),
        detached: process.platform !== "win32",
        stdio: "inherit"
    });

    children.add(child);
    child.on("error", (error) => {
        console.error(`[launcher] ${service} failed to start: ${error.message}`);
        stopAll(1);
    });
    child.on("exit", (code, signal) => {
        children.delete(child);

        if (!stopping) {
            console.error(`[launcher] ${service} stopped (${signal || `exit ${code}`})`);
            stopAll(code || 1);
        }

        if (stopping && children.size === 0) process.exit(exitCode);
    });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
