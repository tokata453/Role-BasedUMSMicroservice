const express = require("express");
const dotenv = require("dotenv");

// Load .env before requiring routes because route module reads service URLs at module load.
dotenv.config();

const gatewayRoutes = require("./routes/gateway");

// Gateway is the only public HTTP surface for the microservice stack.
// It handles JSON parsing, JWT validation, role checks, and proxy routing.
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(gatewayRoutes);

// Tests import the Express app directly; production start happens only for direct execution.
if (require.main === module) {
    app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
}

module.exports = app;
