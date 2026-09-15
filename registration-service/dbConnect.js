const mongoose = require("mongoose");
const dbClient = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected - ${process.env.MONGO_URL.split('/')[3] || 'ums'}`);
    } catch (error) {
        console.log(`MongoDB Connection Error - ${process.env.MONGO_URL}:`, error.message);
        process.exit(1);
    }
}
module.exports = dbClient;
