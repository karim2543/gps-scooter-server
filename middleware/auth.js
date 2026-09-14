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

module.exports = requireDashboardAuth;
