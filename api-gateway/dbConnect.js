const mongoose = require("mongoose");

// API Gateway owns its own MongoDB connection lifecycle.
// All services point at the same MONGO_URL so they share one users collection.
const dbClient = async () => {
    try {
        // Connect before accepting requests so route handlers do not run against a missing database.
        await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected - ${process.env.MONGO_URL.split('/')[3] || 'ums'}`);
    } catch (error) {
        // Startup cannot continue without MongoDB because every route reads or writes users.
        console.log(`MongoDB Connection Error - ${process.env.MONGO_URL}:`, error.message);
        process.exit(1);
    }
}

module.exports = dbClient;
