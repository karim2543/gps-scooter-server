const DEVICE_ID = "SCOOTER001";

let map;
let scooterMarker;
let firstPosition = true;

let routeLine;
let lastRoutePoint = null;

let currentTrip = null;


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

    map.setView([36.8065, 10.1815], 12);
}


// =====================================================
// Affichage du trajet actuel
// =====================================================

function displayCurrentTrip(trip) {

    const tripElement =
        document.getElementById("currentTrip");

    const startedElement =
        document.getElementById("currentTripStarted");

    if (!trip) {

        tripElement.textContent =
            "Aucun trajet actif";

        startedElement.textContent =
            "--";

        return;
    }

    tripElement.textContent =
        `En cours — ${trip.id.substring(0, 8)}`;

    const startedAt =
        new Date(trip.started_at);

    startedElement.textContent =
        `Début : ${startedAt.toLocaleString()}`;
}


// =====================================================
// Récupérer le trajet actuel
// =====================================================

async function loadCurrentTrip() {

    try {

        const response = await fetch(
            `/api/trips/current/${DEVICE_ID}`
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Erreur lors de la récupération du trajet actuel"
            );
        }

        currentTrip = result.data;

        displayCurrentTrip(currentTrip);

        // -------------------------------------------------
        // Charger le tracé du trajet actuel
        // -------------------------------------------------

        if (currentTrip) {

            await loadCurrentTripHistory(
                currentTrip.id
            );
        }

    } catch (error) {

        console.error(
            "Erreur trajet actuel :",
            error
        );

        document.getElementById("currentTrip")
            .textContent = "Erreur";
    }
}


// =====================================================
// Charger les positions du trajet actuel
// =====================================================

async function loadCurrentTripHistory(tripId) {

    try {

        const response = await fetch(
            `/api/trips/${tripId}?device_id=${DEVICE_ID}`
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Erreur lors du chargement du trajet"
            );
        }

        const positions =
            result.data.positions;

        const points = positions.map(point => [
            Number(point.latitude),
            Number(point.longitude)
        ]);

        // -------------------------------------------------
        // Aucun point
        // -------------------------------------------------

        if (points.length === 0) {

            clearRouteLine();

            return;
        }

        // -------------------------------------------------
        // Supprimer l'ancienne ligne
        // -------------------------------------------------

        clearRouteLine();

        // -------------------------------------------------
        // Créer le nouveau tracé
        // -------------------------------------------------

        routeLine =
            L.polyline(points).addTo(map);

        lastRoutePoint =
            points[points.length - 1];

    } catch (error) {

        console.error(
            "Erreur historique trajet :",
            error
        );
    }
}


// =====================================================
// Récupérer la dernière position
// =====================================================

async function getLatestPosition() {

    try {

        const response = await fetch(
            `/api/gps/latest/${DEVICE_ID}`
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Erreur serveur"
            );
        }

        const gps = result.data;

        const lastUpdate =
            new Date(gps.created_at);

        const now =
            new Date();

        const age =
            (now - lastUpdate) / 1000;


        // =================================================
        // Statut
        // =================================================

        if (age <= 15) {

            document.getElementById("status")
                .textContent = "En ligne";

            document.getElementById("status")
                .className = "value status";

        } else {

            document.getElementById("status")
                .textContent = "Hors ligne";

            document.getElementById("status")
                .className = "value error";
        }


        // =================================================
        // Dernière mise à jour
        // =================================================

        document.getElementById("lastUpdate")
            .textContent =
            lastUpdate.toLocaleTimeString();


        // =================================================
        // Données GPS
        // =================================================

        document.getElementById("latitude")
            .textContent =
            Number(gps.latitude).toFixed(6);

        document.getElementById("longitude")
            .textContent =
            Number(gps.longitude).toFixed(6);

        document.getElementById("speed")
            .textContent =
            `${Number(gps.speed || 0).toFixed(2)} km/h`;


        // =================================================
        // Position GPS
        // =================================================

        const latitude =
            Number(gps.latitude);

        const longitude =
            Number(gps.longitude);

        const position = [
            latitude,
            longitude
        ];


        // =================================================
        // Marqueur
        // =================================================

        if (!scooterMarker) {

            scooterMarker =
                L.marker(position)
                    .addTo(map)
                    .bindPopup("Scooter");

        } else {

            scooterMarker
                .setLatLng(position);
        }


        // =================================================
        // Ajouter au tracé uniquement si le point
        // appartient au trajet actuel
        // =================================================

        if (
            currentTrip &&
            gps.trip_id === currentTrip.id
        ) {

            updateRouteLine(position);
        }


        // =================================================
        // Centrer uniquement au premier chargement
        // =================================================

        if (firstPosition) {

            map.setView(
                position,
                16
            );

            firstPosition = false;
        }

    } catch (error) {

        console.error(error);

        document.getElementById("status")
            .textContent = "Erreur";

        document.getElementById("status")
            .className = "value error";
    }
}


// =====================================================
// Ajouter une position au tracé
// =====================================================

function updateRouteLine(position) {

    // -------------------------------------------------
    // Éviter les doublons
    // -------------------------------------------------

    if (
        lastRoutePoint &&
        lastRoutePoint[0] === position[0] &&
        lastRoutePoint[1] === position[1]
    ) {
        return;
    }


    // -------------------------------------------------
    // Premier point
    // -------------------------------------------------

    if (!routeLine) {

        routeLine =
            L.polyline([position])
                .addTo(map);

    } else {

        routeLine
            .addLatLng(position);
    }


    lastRoutePoint =
        position;
}


// =====================================================
// Effacer uniquement la polyline
// =====================================================

function clearRouteLine() {

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine = null;
    }

    lastRoutePoint = null;
}


// =====================================================
// Nouveau trajet
// =====================================================

async function startNewTrip() {

    const button =
        document.getElementById("newTripButton");

    try {

        button.disabled = true;

        button.textContent =
            "Création...";


        const response = await fetch(
            "/api/trips",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    device_id:
                        DEVICE_ID
                })
            }
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Impossible de créer le trajet"
            );
        }


        // -------------------------------------------------
        // Nouveau trajet actif
        // -------------------------------------------------

        currentTrip =
            result.data;


        // -------------------------------------------------
        // Réinitialiser UNIQUEMENT le tracé
        // -------------------------------------------------

        clearRouteLine();


        // -------------------------------------------------
        // Mettre à jour l'affichage
        // -------------------------------------------------

        displayCurrentTrip(
            currentTrip
        );

        console.log(
            "Nouveau trajet créé :",
            currentTrip
        );


    } catch (error) {

        console.error(
            "Erreur nouveau trajet :",
            error
        );

        alert(
            error.message ||
            "Erreur lors de la création du trajet"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "+ Nouveau trajet";
    }
}


// =====================================================
// Événement bouton
// =====================================================

document
    .getElementById("newTripButton")
    .addEventListener(
        "click",
        startNewTrip
    );


// =====================================================
// Démarrage
// =====================================================

initMap();

loadCurrentTrip();

getLatestPosition();

setInterval(() => {

    getLatestPosition();

}, 5000);