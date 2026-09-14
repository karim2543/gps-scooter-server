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

    if (device_id !== "SCOOTER001") {
        return res.status(401).json({
            success: false,
            message: "Unknown device"
        });
    }

    if (token !== process.env.DEVICE_TOKEN) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

    next();
}

module.exports = authenticateDevice;
