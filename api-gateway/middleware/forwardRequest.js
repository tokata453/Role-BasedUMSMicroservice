const axios = require("axios");

// Creates an Express handler that proxies any method under a gateway prefix to one service.
// req.path contains only the suffix after the mounted prefix, preserving endpoint extensibility.
const forwardRequest = (baseUrl) => async (req, res) => {
    try {
        const response = await axios({
            // Preserve caller method, path suffix, query string, and JSON body.
            method: req.method,
            url: `${baseUrl}${req.path}`,
            params: req.query,
            data: req.body,
            headers: {
                // Shared key lets internal services reject direct client traffic.
                "x-internal-api-key": process.env.GATEWAY_API_KEY || "",

                // Trusted identity headers are set only after auth middleware populates req.user.
                "x-auth-user-id": req.user?.id || "",
                "x-auth-user-email": req.user?.email || "",
                "x-auth-user-role": req.user?.role || ""
            },

            // Pass through downstream 4xx/5xx responses instead of throwing and masking them.
            validateStatus: () => true
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        // Network or service availability failures are gateway failures.
        res.status(502).json({ message: "Gateway error while forwarding request" });
    }
};

module.exports = forwardRequest;