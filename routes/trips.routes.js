const express = require("express");

const { requireDashboardAuthApi } = require("../middleware/auth");
const tripService = require("../services/trip.service");

const router = express.Router();

const DEVICE_ID = "SCOOTER001";


// =====================================================
// API : créer un trajet
// =====================================================

router.post(
    "/",
    requireDashboardAuthApi,
    async (req, res) => {

        const {
            device_id
        } = req.body;

        if (device_id !== DEVICE_ID) {
            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        try {

            const {
                data,
                error
            } = await tripService.createTrip(device_id);

            if (error) {

                console.error(
                    "Supabase create trip error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to create trip"
                });
            }

            return res.status(201).json({
                success: true,
                data
            });

        } catch (error) {

            console.error(
                "Create trip exception:",
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
// API : liste des trajets
// GET /api/trips?device_id=SCOOTER001
// =====================================================

router.get(
    "/",
    requireDashboardAuthApi,
    async (req, res) => {

        const {
            device_id
        } = req.query;

        if (device_id !== DEVICE_ID) {
            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        try {

            const {
                data,
                error
            } = await tripService.getTrips(device_id);

            if (error) {

                console.error(
                    "Supabase trips error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve trips"
                });
            }

            return res.status(200).json({
                success: true,
                data
            });

        } catch (error) {

            console.error(
                "Get trips exception:",
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
// API : détail d'un trajet
// =====================================================

router.get(
    "/:trip_id",
    requireDashboardAuthApi,
    async (req, res) => {

        const {
            trip_id
        } = req.params;

        const {
            device_id
        } = req.query;

        if (device_id !== DEVICE_ID) {
            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        try {

            const {
                data,
                error
            } = await tripService.getTripById(
                trip_id,
                device_id
            );

            if (error) {

                console.error(
                    "Supabase trip detail error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve trip"
                });
            }

            return res.status(200).json({
                success: true,
                data
            });

        } catch (error) {

            console.error(
                "Get trip exception:",
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
// API : trajet actuellement actif
// =====================================================

router.get(
    "/current/:device_id",
    requireDashboardAuthApi,
    async (req, res) => {

        const {
            device_id
        } = req.params;

        if (device_id !== DEVICE_ID) {
            return res.status(401).json({
                success: false,
                message: "Unknown device"
            });
        }

        try {

            const {
                data,
                error
            } = await tripService.getActiveTrip(device_id);

            if (error) {

                console.error(
                    "Supabase active trip error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve current trip"
                });
            }

            return res.status(200).json({
                success: true,
                data
            });

        } catch (error) {

            console.error(
                "Get active trip exception:",
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