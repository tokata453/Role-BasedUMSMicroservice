const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const gatewayRoutes = require("./routes/gateway");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(gatewayRoutes);

if (require.main === module) {
    app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
}

module.exports = app;
