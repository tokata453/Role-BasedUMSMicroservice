const express = require("express");
const dotenv = require("dotenv");
const dbClient = require("./dbConnect");
const registerRoute = require("./routes/register");
const internalAuth = require("./middleware/internalAuth");

dotenv.config();
const app = express();
const PORT = 3001;

app.use(express.json());
dbClient();
app.use(internalAuth);
app.use("/api/registration", registerRoute);

app.listen(PORT, () => console.log(`Registration Service running on port ${PORT}`));
