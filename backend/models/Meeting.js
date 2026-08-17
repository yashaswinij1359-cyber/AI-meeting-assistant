const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    summary: {
        type: String,
        default: ""
    },

    actionItems: {
        type: Array,
        default: []
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Meeting", meetingSchema);
