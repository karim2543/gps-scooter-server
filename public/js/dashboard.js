const DEVICE_ID = "SCOOTER001";

let map;
let scooterMarker;
let firstPosition = true;
let routeLine;

// Dernier point ajouté au tracé
let lastRoutePoint = null;

// =====================================================
// Initialisation de la carte
// =====================================================

function initMap() {

    map = L.map("map");

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

    // Position temporaire
    map.setView([36.8065, 10.1815], 12);
}

// =====================================================
// Récupérer la dernière position
// =====================================================

async function getLatestPosition() {

    try {

        const response = await fetch(
            `/api/gps/latest/${DEVICE_ID}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message || "Erreur serveur"
            );
        }

        const gps = result.data;
        const lastUpdate = new Date(gps.created_at);
        const now = new Date();

        const age = (now - lastUpdate) / 1000;

        if (age <= 15) {

            document.getElementById("status").textContent =
                "En ligne";

            document.getElementById("status").className =
                "value status";

        } else {

            document.getElementById("status").textContent =
                "Hors ligne";

            document.getElementById("status").className =
                "value error";
        }

        document.getElementById("lastUpdate").textContent =
            lastUpdate.toLocaleTimeString();

        // =============================================
        // Affichage des données
        // =============================================

        document.getElementById("latitude").textContent =
            Number(gps.latitude).toFixed(6);

        document.getElementById("longitude").textContent =
            Number(gps.longitude).toFixed(6);

        document.getElementById("speed").textContent =
            `${Number(gps.speed || 0).toFixed(2)} km/h`;

        // =============================================
        // Position GPS actuelle
        // =============================================

        const latitude = Number(gps.latitude);
        const longitude = Number(gps.longitude);

        const position = [latitude, longitude];

        // =============================================
        // Mise à jour du marqueur
        // =============================================

        if (!scooterMarker) {

            scooterMarker = L.marker(position)
                .addTo(map)
                .bindPopup("Scooter");

        } else {

            scooterMarker.setLatLng(position);
        }

        // =============================================
        // Mise à jour du tracé
        // =============================================

        updateRouteLine(position);

        // =============================================
        // Centrer la carte uniquement au premier chargement
        // =============================================

        if (firstPosition) {

            map.setView(position, 16);

            firstPosition = false;
        }

    } catch (error) {

        console.error(error);

        document.getElementById("status").textContent =
            "Erreur";

        document.getElementById("status").className =
            "value error";
    }
}

// =====================================================
// Mettre à jour le tracé avec la nouvelle position
// =====================================================

function updateRouteLine(position) {

    // Éviter d'ajouter deux fois exactement le même point
    if (
        lastRoutePoint &&
        lastRoutePoint[0] === position[0] &&
        lastRoutePoint[1] === position[1]
    ) {
        return;
    }

    // Premier point
    if (!routeLine) {

        routeLine = L.polyline([position]).addTo(map);

    } else {

        routeLine.addLatLng(position);
    }

    lastRoutePoint = position;
}

// =====================================================
// Charger l'historique du trajet
// =====================================================

async function loadHistory() {

    try {

        const response = await fetch(
            `/api/gps/history/${DEVICE_ID}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message || "Erreur lors du chargement de l'historique"
            );
        }

        const points = result.data.map(point => [
            Number(point.latitude),
            Number(point.longitude)
        ]);

        if (points.length === 0) {
            return;
        }

        // Si une ancienne ligne existe, on la supprime
        if (routeLine) {
            map.removeLayer(routeLine);
        }

        // Créer le tracé avec l'historique
        routeLine = L.polyline(points).addTo(map);

        // Mémoriser le dernier point connu
        lastRoutePoint = points[points.length - 1];

    } catch (error) {

        console.error("Erreur historique GPS :", error);
    }
}

// =====================================================
// Démarrage
// =====================================================

initMap();

getLatestPosition();
loadHistory();

setInterval(() => {

    getLatestPosition();

}, 5000);