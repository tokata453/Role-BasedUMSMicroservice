// Blocks direct client traffic to User Service.
// Only the API Gateway should know and forward GATEWAY_API_KEY.
const internalAuth = (req, res, next) => {
    const expectedKey = process.env.GATEWAY_API_KEY;

    // Fail closed when the service is misconfigured instead of accepting direct calls.
    if (!expectedKey) {
        return res.status(500).json({ message: "Internal gateway key is not configured" });
    }

    // Internal services trust identity headers only after this shared secret check passes.
    if (req.headers["x-internal-api-key"] !== expectedKey) {
        return res.status(403).json({ message: "Direct access to this service is not allowed" });
    }

    next();
};

module.exports = internalAuth;
