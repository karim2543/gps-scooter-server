const express = require("express");
const path = require("path");

const { loginLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// =====================================================
// Page de connexion
// =====================================================

router.get("/login", (req, res) => {
    if (req.session.authenticated === true) {
        return res.redirect("/");
    }

    res.sendFile(
        path.join(__dirname, "..", "public", "login.html")
    );
});

// =====================================================
// Traitement login
// =====================================================

router.post("/login", loginLimiter, (req, res) => {
    const {
        username,
        password
    } = req.body;

    console.log("Login attempt:", {
        usernameReceived: username,
        userConfigured: !!process.env.DASHBOARD_USER,
        passwordConfigured: !!process.env.DASHBOARD_PASSWORD,
        sessionSecretConfigured: !!process.env.SESSION_SECRET,
        databaseConfigured: !!process.env.DATABASE_URL
    });

    if (
        username !== process.env.DASHBOARD_USER ||
        password !== process.env.DASHBOARD_PASSWORD
    ) {
        console.log("Dashboard login failed");

        return res.redirect("/login?error=1");
    }

    req.session.authenticated = true;

    req.session.save((err) => {
        if (err) {
            console.error("Session save error:", err);

            return res.status(500).send("Session error");
        }

        console.log("Dashboard login successful");
        console.log("Session ID:", req.sessionID);

        return res.redirect("/");
    });
});

// =====================================================
// Logout
// =====================================================

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destroy error:", err);

            return res.status(500).send("Logout error");
        }

        res.clearCookie("connect.sid");

        return res.redirect("/login");
    });
});

module.exports = router;
