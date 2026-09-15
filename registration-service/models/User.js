const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Shared user schema copy for Registration Service.
// Keep every service copy compatible because all services read and write the same MongoDB collection.
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], required: true },
    phone: { type: String }
}, { timestamps: true });

// Hash password only when it changes so profile updates do not hash an existing hash again.
UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    // bcrypt salt factor 10 matches existing saved hashes and keeps registration cost reasonable.
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Login service uses this helper to compare submitted plain text with stored bcrypt hash.
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
