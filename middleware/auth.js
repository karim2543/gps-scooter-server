// =====================================================
// Pour les pages HTML (dashboard) : redirige vers /login
// =====================================================

function requireDashboardAuth(req, res, next) {
    console.log("Dashboard auth check:", {
        authenticated: req.session.authenticated,
        sessionID: req.sessionID
    });

    if (req.session.authenticated !== true) {
        return res.redirect("/login");
    }

    next();
}

// =====================================================
// Pour les routes API (JSON) : renvoie 401 au lieu de rediriger
// Un client API/mobile ne peut pas "suivre" une redirection HTML,
// donc ce comportement est plus correct qu'un 302 vers /login.
// =====================================================

function requireDashboardAuthApi(req, res, next) {
    console.log("Dashboard API auth check:", {
        authenticated: req.session.authenticated,
        sessionID: req.sessionID
    });

    if (req.session.authenticated !== true) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    next();
}

module.exports = {
    requireDashboardAuth,
    requireDashboardAuthApi
};
