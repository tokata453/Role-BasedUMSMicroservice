const express = require("express");
const dotenv = require("dotenv");
const dbClient = require("./dbConnect");
const adminRoute = require("./routes/admin");
const internalAuth = require("./middleware/internalAuth");

dotenv.config();
const app = express();
const PORT = 3003;

app.use(express.json());
dbClient();
app.use(internalAuth);
app.use("/api/admin", adminRoute);

app.listen(PORT, () => console.log(`Admin Service running on port ${PORT}`));
