const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");
const requireAuth = require("../middleware/auth");

// All routes below require a valid login token
router.use(requireAuth);

/* ==========================================
   GET ALL MEETINGS FOR LOGGED-IN USER
========================================== */

router.get("/", async (req, res) => {

    try {

        const meetings = await Meeting
            .find({ user: req.userId })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({ success: true, meetings });

    } catch (error) {

        console.error("Fetch meetings error:", error);

        res.status(500).json({
            success: false,
            error: "Unable to fetch meetings."
        });

    }

});

/* ==========================================
   SAVE A NEW MEETING
========================================== */

router.post("/", async (req, res) => {

    try {

        const { title, summary, actionItems } = req.body;

        const meeting = await Meeting.create({
            user: req.userId,
            title,
            summary,
            actionItems
        });

        res.status(201).json({ success: true, meeting });

    } catch (error) {

        console.error("Save meeting error:", error);

        res.status(500).json({
            success: false,
            error: "Unable to save meeting."
        });

    }

});

/* ==========================================
   DELETE A MEETING (only if it belongs to this user)
========================================== */

router.delete("/:id", async (req, res) => {

    try {

        const meeting = await Meeting.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!meeting) {

            return res.status(404).json({
                success: false,
                error: "Meeting not found."
            });

        }

        res.json({ success: true, id: req.params.id });

    } catch (error) {

        console.error("Delete meeting error:", error);

        res.status(500).json({
            success: false,
            error: "Unable to delete meeting."
        });

    }

});

module.exports = router;