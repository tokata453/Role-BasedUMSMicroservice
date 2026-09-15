const internalAuth = (req, res, next) => {
    const expectedKey = process.env.GATEWAY_API_KEY;

    if (!expectedKey) {
        return res.status(500).json({ message: "Internal gateway key is not configured" });
    }

    if (req.headers["x-internal-api-key"] !== expectedKey) {
        return res.status(403).json({ message: "Direct access to this service is not allowed" });
    }

    next();
};

module.exports = internalAuth;
