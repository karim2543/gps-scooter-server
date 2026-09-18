require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const helmet = require("helmet");
const path = require("path");

const pgPool = require("./config/database");
const { requireDashboardAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth.routes");
const gpsRoutes = require("./routes/gps.routes");
const tripsRoutes = require("./routes/trips.routes");

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

// =====================================================
// Headers de sécurité (CSP adaptée pour Leaflet/OpenStreetMap)
// =====================================================

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://unpkg.com"],
                styleSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
                connectSrc: ["'self'"]
            }
        },

        referrerPolicy: {
            policy: "strict-origin-when-cross-origin"
        }
    })
);

// Limite la taille du corps des requêtes (anti DoS par payload énorme)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

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

app.use("/api/trips", tripsRoutes);

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
