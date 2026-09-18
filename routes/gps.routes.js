const express = require("express");

const { requireDashboardAuthApi } = require("../middleware/auth");
const authenticateDevice = require("../middleware/deviceAuth");
const { deviceLimiter } = require("../middleware/rateLimit");
const gpsService = require("../services/gps.service");

const router = express.Router();

// =====================================================
// API : dernière position
// =====================================================

router.get(
    "/latest/:device_id",
    requireDashboardAuthApi,
    async (req, res) => {

        const {
            device_id
        } = req.params;

        if (device_id !== "SCOOTER001") {
            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        try {
            const {
                data,
                error
            } = await gpsService.getLatestPosition(device_id);

            if (error) {
                console.error(
                    "Supabase select error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve GPS data"
                });
            }

            return res.status(200).json({
                success: true,
                data: data
            });

        } catch (error) {
            console.error(
                "Latest GPS exception:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
);

// =====================================================
// API : envoyer position GPS
// =====================================================

router.post(
    "/",
    deviceLimiter,
    authenticateDevice,
    async (req, res) => {

        const {
            device_id,
            latitude,
            longitude,
            speed
        } = req.body;

        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number"
        ) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude must be numbers"
            });
        }

        if (
            latitude < -90 ||
            latitude > 90
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid latitude"
            });
        }

        if (
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid longitude"
            });
        }

        try {
            const {
                data,
                error
            } = await gpsService.insertPosition({
                device_id,
                latitude,
                longitude,
                speed
            });

            // =====================================================
            // Aucun trajet actif
            // =====================================================

            if (
                error &&
                error.code === "NO_ACTIVE_TRIP"
            ) {

                return res.status(409).json({
                    success: false,
                    message: "No active trip for this device"
                });
            }

            // =====================================================
            // Erreur Supabase
            // =====================================================

            if (error) {

                console.error(
                    "Supabase insert error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to save GPS data"
                });
            }

            return res.status(200).json({
                success: true,
                message: "GPS data accepted and saved"
            });

        } catch (error) {
            console.error(
                "GPS insert exception:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
);

// =====================================================
// API : historique GPS
// =====================================================

router.get(
    "/history/:device_id",
    requireDashboardAuthApi,
    async (req, res) => {

        const {
            device_id
        } = req.params;

        if (device_id !== "SCOOTER001") {
            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        try {
            const {
                data,
                error
            } = await gpsService.getHistory(device_id);

            if (error) {
                console.error(
                    "Supabase history error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve GPS history"
                });
            }

            return res.status(200).json({
                success: true,
                data: data
            });

        } catch (error) {
            console.error(
                "GPS history exception:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
);

module.exports = router;
