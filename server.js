require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.json());

// =====================================================
// Supabase
// =====================================================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

// =====================================================
// Session
// =====================================================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);

// =====================================================
// Health check
// =====================================================

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

// =====================================================
// Authentification Dashboard
// =====================================================

app.get("/login", (req, res) => {

    if (req.session.authenticated) {
        return res.redirect("/");
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>Connexion - GPS Scooter</title>

            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    background: #f4f6f8;
                }

                .login-box {
                    width: 100%;
                    max-width: 400px;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    margin-top: 0;
                    margin-bottom: 25px;
                    text-align: center;
                }

                label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: bold;
                }

                input {
                    width: 100%;
                    padding: 12px;
                    margin-bottom: 18px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 16px;
                }

                button {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    background: #1f2937;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                }

                button:hover {
                    background: #111827;
                }

                .error {
                    color: #dc2626;
                    text-align: center;
                    margin-bottom: 15px;
                }
            </style>
        </head>

        <body>

            <div class="login-box">

                <h1>GPS Scooter</h1>

                ${
                    req.query.error
                        ? `<div class="error">Identifiants incorrects</div>`
                        : ""
                }

                <form method="POST" action="/login">

                    <label for="username">
                        Nom d'utilisateur
                    </label>

                    <input
                        type="text"
                        id="username"
                        name="username"
                        required
                    >

                    <label for="password">
                        Mot de passe
                    </label>

                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                    >

                    <button type="submit">
                        Se connecter
                    </button>

                </form>

            </div>

        </body>
        </html>
    `);
});

// =====================================================
// Traitement connexion
// =====================================================

app.use(express.urlencoded({ extended: false }));

app.post("/login", (req, res) => {

    console.log("Login attempt:", {
        usernameReceived: req.body.username,
        userConfigured: !!process.env.DASHBOARD_USER,
        passwordConfigured: !!process.env.DASHBOARD_PASSWORD,
        sessionSecretConfigured: !!process.env.SESSION_SECRET
    });

    const { username, password } = req.body;

    if (
        username === process.env.DASHBOARD_USER &&
        password === process.env.DASHBOARD_PASSWORD
    ) {

        req.session.authenticated = true;

        return req.session.save((err) => {

            if (err) {
                console.error("Session save error:", err);

                return res.status(500).send(
                    "Session error"
                );
            }

            console.log("Dashboard login successful");

            res.redirect("/");
        });
    }

    console.log("Dashboard login failed");

    return res.redirect("/login?error=1");
});

// =====================================================
// Déconnexion
// =====================================================

app.get("/logout", (req, res) => {

    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// =====================================================
// Middleware Dashboard
// =====================================================

function requireDashboardAuth(req, res, next) {

    if (!req.session.authenticated) {

        return res.redirect("/login");
    }

    next();
}

// =====================================================
// Dashboard
// =====================================================

app.get("/", requireDashboardAuth, (req, res) => {

    console.log("Dashboard access:", {
        authenticated: req.session.authenticated
    });

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// =====================================================
// API : authentification du scooter
// =====================================================

function authenticateDevice(req, res, next) {

    const { device_id, token } = req.body;

    if (!device_id || !token) {

        return res.status(400).json({
            success: false,
            message: "Missing device_id or token"
        });
    }

    if (device_id !== "SCOOTER001") {

        return res.status(401).json({
            success: false,
            message: "Unknown device"
        });
    }

    if (token !== process.env.DEVICE_TOKEN) {

        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

    next();
}

// =====================================================
// API : dernière position
// =====================================================

app.get(
    "/api/gps/latest/:device_id",
    requireDashboardAuth,
    async (req, res) => {

        const { device_id } = req.params;

        if (device_id !== "SCOOTER001") {

            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        const { data, error } = await supabase
            .from("gps_positions")
            .select("*")
            .eq("device_id", device_id)
            .order("created_at", {
                ascending: false
            })
            .limit(1)
            .single();

        if (error) {

            console.error(
                "Supabase select error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve GPS data"
            });
        }

        return res.status(200).json({
            success: true,
            data: data
        });
    }
);

// =====================================================
// API : envoyer une position GPS
// =====================================================

app.post(
    "/api/gps",
    authenticateDevice,
    async (req, res) => {

        const {
            device_id,
            latitude,
            longitude,
            speed
        } = req.body;

        // Vérification latitude
        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude must be numbers"
            });
        }

        if (latitude < -90 || latitude > 90) {

            return res.status(400).json({
                success: false,
                message: "Invalid latitude"
            });
        }

        if (longitude < -180 || longitude > 180) {

            return res.status(400).json({
                success: false,
                message: "Invalid longitude"
            });
        }

        const { data, error } = await supabase
            .from("gps_positions")
            .insert([
                {
                    device_id,
                    latitude,
                    longitude,
                    speed
                }
            ])
            .select();

        if (error) {

            console.error(
                "Supabase insert error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to save GPS data"
            });
        }

        console.log(
            "GPS data saved:",
            data
        );

        return res.status(200).json({
            success: true,
            message:
                "GPS data accepted and saved"
        });
    }
);

// =====================================================
// API : historique GPS
// =====================================================

app.get(
    "/api/gps/history/:device_id",
    requireDashboardAuth,
    async (req, res) => {

        const { device_id } = req.params;

        if (device_id !== "SCOOTER001") {

            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        const { data, error } = await supabase
            .from("gps_positions")
            .select(
                "latitude, longitude, speed, created_at"
            )
            .eq("device_id", device_id)
            .order("created_at", {
                ascending: false
            })
            .limit(500);

        if (error) {

            console.error(
                "Supabase history error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to retrieve GPS history"
            });
        }

        data.reverse();

        return res.status(200).json({
            success: true,
            data: data
        });
    }
);

// =====================================================
// Fichiers statiques
// =====================================================

app.use(
    "/public",
    requireDashboardAuth,
    express.static(
        path.join(__dirname, "public")
    )
);

// =====================================================
// Serveur
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Server running on port ${PORT}`
        );
    }
);