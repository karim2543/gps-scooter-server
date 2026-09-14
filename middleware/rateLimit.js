const rateLimit = require("express-rate-limit");

// =====================================================
// Limite les tentatives de connexion au dashboard
// (protège DASHBOARD_PASSWORD contre le brute force)
// =====================================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 tentatives max par IP sur la fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Trop de tentatives de connexion, réessayez plus tard."
    }
});

// =====================================================
// Limite les requêtes vers l'API device
// (protège DEVICE_TOKEN contre le brute force)
// =====================================================

const deviceLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // le scooter envoie sa position régulièrement, donc plus permissif
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Trop de requêtes, réessayez plus tard."
    }
});

module.exports = {
    loginLimiter,
    deviceLimiter
};
