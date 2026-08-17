const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    name: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

// Hash password before saving
userSchema.pre("save", async function () {

    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {

    return bcrypt.compare(candidatePassword, this.password);

};

module.exports = mongoose.model("User", userSchema);
