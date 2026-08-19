require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);
console.log("Supabase client initialized");

async function testSupabase() {
    const { data, error } = await supabase
        .from("gps_positions")
        .select("id")
        .limit(1);

    if (error) {
        console.error("Supabase connection error:", error);
    } else {
        console.log("Supabase connection successful:", data);
    }
}

testSupabase();

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

app.post("/api/gps", (req, res) => {

    const {
        device_id,
        token,
        latitude,
        longitude,
        speed
    } = req.body;

    // Vérifier les champs obligatoires
    if (
        !device_id ||
        !token ||
        latitude === undefined ||
        longitude === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Missing required data"
        });
    }

    // Vérifier l'identité du scooter
    if (device_id !== "SCOOTER001") {
        return res.status(401).json({
            success: false,
            message: "Unknown device"
        });
    }

    // Vérifier le token secret
    if (token !== process.env.DEVICE_TOKEN) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

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

    console.log("Authenticated GPS data received:", {
        device_id,
        latitude,
        longitude,
        speed
    });

    return res.status(200).json({
        success: true,
        message: "GPS data accepted"
    });
});