const express = require("express");
const path = require("path");

const { loginLimiter } = require("../middleware/rateLimit");
const { safeCompare } = require("../middleware/deviceAuth");
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

    // Comparaison en temps constant (anti timing-attack)
    const validUsername = safeCompare(
        username || "",
        process.env.DASHBOARD_USER || ""
    );
 
    const validPassword = safeCompare(
        password || "",
        process.env.DASHBOARD_PASSWORD || ""
    );
 
    if (!validUsername || !validPassword) {
        console.log("Dashboard login failed");
 
        return res.redirect("/login?error=1");
    }

    // =====================================================
    // Régénère l'ID de session avant de l'authentifier
    // (anti session-fixation : évite qu'un ID de session connu
    // à l'avance par un attaquant devienne authentifié)
    // =====================================================
 
    req.session.regenerate((err) => {
        if (err) {
            console.error("Session regenerate error:", err);
 
            return res.status(500).send("Session error");
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
