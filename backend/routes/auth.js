const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

function generateToken(userId) {

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

}

/* ==========================================
   SIGNUP
========================================== */

router.post("/signup", async (req, res) => {

    try {

        const { email, password, name } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                error: "Email and password are required."
            });

        }

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                error: "Password must be at least 6 characters."
            });

        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                error: "An account with this email already exists."
            });

        }

        const user = await User.create({ email, password, name });

        const token = generateToken(user._id);

        res.status(201).json({

            success: true,

            token,

            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }

        });

    } catch (error) {

        console.error("Signup error:", error);

        res.status(500).json({
            success: false,
            error: "Unable to create account."
        });

    }

});

/* ==========================================
   LOGIN
========================================== */

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                error: "Email and password are required."
            });

        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {

            return res.status(401).json({
                success: false,
                error: "Invalid email or password."
            });

        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {

            return res.status(401).json({
                success: false,
                error: "Invalid email or password."
            });

        }

        const token = generateToken(user._id);

        res.json({

            success: true,

            token,

            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }

        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            error: "Unable to log in."
        });

    }

});

module.exports = router;