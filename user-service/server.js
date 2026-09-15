const express = require("express");
const dotenv = require("dotenv");
const dbClient = require("./dbConnect");
const userRoute = require("./routes/user");
const internalAuth = require("./middleware/internalAuth");

dotenv.config();
const app = express();
const PORT = 3004;

app.use(express.json());
dbClient();
app.use(internalAuth);
app.use("/api/user", userRoute);

app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
