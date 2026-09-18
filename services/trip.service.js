const supabase = require("../config/supabase");

// =====================================================
// Créer un nouveau trajet
// =====================================================

async function createTrip(deviceId) {

    // -------------------------------------------------
    // Rechercher le trajet actuellement actif
    // -------------------------------------------------

    const {
        data: activeTrip,
        error: activeError
    } = await supabase
        .from("trips")
        .select("id, device_id, started_at, ended_at")
        .eq("device_id", deviceId)
        .is("ended_at", null)
        .maybeSingle();

    if (activeError) {
        return {
            data: null,
            error: activeError
        };
    }


    // -------------------------------------------------
    // Terminer le trajet actif
    // -------------------------------------------------

    if (activeTrip) {

        const {
            error: endError
        } = await supabase
            .from("trips")
            .update({
                ended_at: new Date().toISOString()
            })
            .eq("id", activeTrip.id);

        if (endError) {
            return {
                data: null,
                error: endError
            };
        }
    }


    // -------------------------------------------------
    // Créer le nouveau trajet
    // -------------------------------------------------

    return supabase
        .from("trips")
        .insert([
            {
                device_id: deviceId
            }
        ])
        .select()
        .single();
}


// =====================================================
// Récupérer tous les trajets d'un device
// =====================================================

async function getTrips(deviceId) {

    return supabase
        .from("trips")
        .select(
            "id, device_id, started_at, ended_at"
        )
        .eq("device_id", deviceId)
        .order("started_at", {
            ascending: false
        });
}


// =====================================================
// Récupérer un trajet avec ses positions GPS
// =====================================================

async function getTripById(tripId, deviceId) {

    const {
        data: trip,
        error: tripError
    } = await supabase
        .from("trips")
        .select(
            "id, device_id, started_at, ended_at"
        )
        .eq("id", tripId)
        .eq("device_id", deviceId)
        .single();

    if (tripError) {
        return {
            data: null,
            error: tripError
        };
    }

    const {
        data: positions,
        error: positionsError
    } = await supabase
        .from("gps_positions")
        .select(
            "latitude, longitude, speed, created_at"
        )
        .eq("trip_id", tripId)
        .order("created_at", {
            ascending: true
        });

    if (positionsError) {
        return {
            data: null,
            error: positionsError
        };
    }

    return {
        data: {
            trip,
            positions
        },
        error: null
    };
}


// =====================================================
// Récupérer le trajet actuellement actif
// =====================================================

async function getActiveTrip(deviceId) {

    return supabase
        .from("trips")
        .select(
            "id, device_id, started_at, ended_at"
        )
        .eq("device_id", deviceId)
        .is("ended_at", null)
        .maybeSingle();
}


module.exports = {
    createTrip,
    getTrips,
    getTripById,
    getActiveTrip
};