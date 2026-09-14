const supabase = require("../config/supabase");

// =====================================================
// Dernière position d'un device
// =====================================================

async function getLatestPosition(deviceId) {
    return supabase
        .from("gps_positions")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
}

// =====================================================
// Insertion d'une nouvelle position
// =====================================================

async function insertPosition({ device_id, latitude, longitude, speed }) {
    return supabase
        .from("gps_positions")
        .insert([{ device_id, latitude, longitude, speed }])
        .select();
}

// =====================================================
// Historique des positions (ordre chronologique croissant)
// =====================================================

async function getHistory(deviceId, limit = 500) {
    const { data, error } = await supabase
        .from("gps_positions")
        .select("latitude, longitude, speed, created_at")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (!error && data) {
        data.reverse();
    }

    return { data, error };
}

module.exports = {
    getLatestPosition,
    insertPosition,
    getHistory
};
