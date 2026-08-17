const express = require("express");

const app = express();

app.use(express.json());

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

    const { device_id, latitude, longitude, speed } = req.body;

    // Vérifier la présence des données obligatoires
    if (!device_id || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            success: false,
            message: "Missing GPS data"
        });
    }

    // Vérifier que latitude et longitude sont des nombres
    if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({
            success: false,
            message: "Latitude and longitude must be numbers"
        });
    }

    // Vérifier les limites géographiques
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

    // Si tout est correct
    console.log("Valid GPS data received:");
    console.log({
        device_id,
        latitude,
        longitude,
        speed
    });

    res.status(200).json({
        success: true,
        message: "GPS data accepted"
    });
});