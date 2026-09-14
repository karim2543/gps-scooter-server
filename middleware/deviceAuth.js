const crypto = require("crypto");

// =====================================================
// Comparaison en temps constant (anti timing-attack)
// =====================================================

function safeCompare(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));

    if (bufA.length !== bufB.length) {
        // On compare quand même deux buffers de même taille pour que le
        // temps de réponse ne varie pas selon la longueur de la valeur reçue
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
}

function authenticateDevice(req, res, next) {
    const {
        device_id,
        token
    } = req.body;

    if (!device_id || !token) {
        return res.status(400).json({
            success: false,
            message: "Missing device_id or token"
        });
    }

    if (!safeCompare(device_id, "SCOOTER001")) {
        return res.status(401).json({
            success: false,
            message: "Unknown device"
        });
    }

    if (!safeCompare(token, process.env.DEVICE_TOKEN || "")) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

    next();
}

module.exports = authenticateDevice;
