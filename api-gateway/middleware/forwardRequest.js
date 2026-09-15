const axios = require("axios");

const forwardRequest = (baseUrl) => async (req, res) => {
    try {
        const response = await axios({
            method: req.method,
            url: `${baseUrl}${req.path}`,
            params: req.query,
            data: req.body,
            headers: {
                "x-internal-api-key": process.env.GATEWAY_API_KEY || "",
                "x-auth-user-id": req.user?.id || "",
                "x-auth-user-email": req.user?.email || "",
                "x-auth-user-role": req.user?.role || ""
            },
            validateStatus: () => true
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(502).json({ message: "Gateway error while forwarding request" });
    }
};

module.exports = forwardRequest;