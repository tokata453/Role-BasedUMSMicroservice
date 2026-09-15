const express = require("express");
const dotenv = require("dotenv");
const dbClient = require("./dbConnect");
const authRoute = require("./routes/auth");
const internalAuth = require("./middleware/internalAuth");

// Load .env before connecting to MongoDB or checking the gateway shared secret.
dotenv.config();

// Service process owns only its internal API. Public routing and roles stay in the gateway.
const app = express();
const PORT = 3002;

// Parse JSON bodies before routes need registration, login, or profile update data.
app.use(express.json());
dbClient();

// Every downstream endpoint requires the gateway key before route handlers run.
app.use(internalAuth);
app.use("/api/login", authRoute);

app.listen(PORT, () => console.log(`Login Service running on port ${PORT}`));
