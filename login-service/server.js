const express = require("express");
const dotenv = require("dotenv");
const dbClient = require("./dbConnect");
const authRoute = require("./routes/auth");
const internalAuth = require("./middleware/internalAuth");

dotenv.config();
const app = express();
const PORT = 3002;

app.use(express.json());
dbClient();
app.use(internalAuth);
app.use("/api/login", authRoute);

app.listen(PORT, () => console.log(`Login Service running on port ${PORT}`));
