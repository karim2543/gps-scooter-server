require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

app.get("/", (req, res) => {
    res.send("GPS Scooter Server is running");
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

function authenticateDevice(req, res, next) {
    const { device_id, token } = req.body;

    // Vérifier que device_id et token sont présents
    if (!device_id || !token) {
        return res.status(400).json({
            success: false,
            message: "Missing device_id or token"
        });
    }

    // Vérifier l'identité du scooter
    if (device_id !== "SCOOTER001") {
        return res.status(401).json({
            success: false,
            message: "Unknown device"
        });
    }

    // Vérifier le token
    if (token !== process.env.DEVICE_TOKEN) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

    // Authentification réussie
    next();
}

app.post("/api/gps", authenticateDevice, async (req, res) => {

    const {
        device_id,
        token,
        latitude,
        longitude,
        speed
    } = req.body;

    // Vérifier les coordonnées
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({
            success: false,
            message: "Latitude and longitude must be numbers"
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
    console.error("Supabase insert error:", error);

    return res.status(500).json({
        success: false,
        message: "Failed to save GPS data"
    });
}

console.log("GPS data saved:", data);

return res.status(200).json({
    success: true,
    message: "GPS data accepted and saved"
});
});