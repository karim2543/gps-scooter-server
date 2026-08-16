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
    // notre serveur accepte les requêtes POST à l'endpoint /api/gps et récupère les données GPS envoyées par le scooter
    const data = req.body;

    console.log("GPS data received:");
    console.log(data);

    res.json({
        success: true,
        message: "GPS data received"
    });
});