const supabase = require("../config/supabase");

// =====================================================
// Dernière position d'un device
// =====================================================

async function getLatestPosition(deviceId) {

    return supabase
        .from("gps_positions")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", {
            ascending: false
        })
        .limit(1)
        .single();
}


// =====================================================
// Insertion d'une nouvelle position
// =====================================================

async function insertPosition({
    device_id,
    latitude,
    longitude,
    speed
}) {

    // -------------------------------------------------
    // Rechercher le trajet actuellement actif
    // -------------------------------------------------

    const {
        data: activeTrip,
        error: tripError
    } = await supabase
        .from("trips")
        .select("id")
        .eq("device_id", device_id)
        .is("ended_at", null)
        .maybeSingle();

    // -------------------------------------------------
    // Erreur lors de la recherche du trajet
    // -------------------------------------------------

    if (tripError) {

        return {
            data: null,
            error: tripError
        };
    }

    // -------------------------------------------------
    // Aucun trajet actif
    // -------------------------------------------------

    if (!activeTrip) {

        return {
            data: null,
            error: {
                code: "NO_ACTIVE_TRIP",
                message: "No active trip for this device"
            }
        };
    }

    // -------------------------------------------------
    // Enregistrer la position avec le trip_id
    // -------------------------------------------------

    return supabase
        .from("gps_positions")
        .insert([
            {
                device_id,
                trip_id: activeTrip.id,
                latitude,
                longitude,
                speed
            }
        ])
        .select();
}


// =====================================================
// Historique GPS
// =====================================================

async function getHistory(deviceId, limit = 500) {

    const {
        data,
        error
    } = await supabase
        .from("gps_positions")
        .select(
            "latitude, longitude, speed, created_at"
        )
        .eq("device_id", deviceId)
        .order("created_at", {
            ascending: false
        })
        .limit(limit);

    if (!error && data) {
        data.reverse();
    }

    return {
        data,
        error
    };
}


module.exports = {
    getLatestPosition,
    insertPosition,
    getHistory
};