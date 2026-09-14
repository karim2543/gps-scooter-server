require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const path = require("path");

const pgPool = require("./config/database");
const requireDashboardAuth = require("./middleware/auth");
const authRoutes = require("./routes/auth.routes");
const gpsRoutes = require("./routes/gps.routes");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// =====================================================
// Session
// =====================================================

app.use(
    session({
        store: new pgSession({
            pool: pgPool,
            tableName: "user_sessions",
            createTableIfMissing: true
        }),
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
// Assets statiques publics (CSS / JS, pas de données sensibles)
// =====================================================

app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

// =====================================================
// Health check
// =====================================================

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

// =====================================================
// Auth (login / logout)
// =====================================================

app.use("/", authRoutes);

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
// API GPS
// =====================================================

app.use("/api/gps", gpsRoutes);

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
