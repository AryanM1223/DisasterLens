const express = require('express');
const router = express.Router();
const{errorLogger,activityLogger} = require("../utils/logger");


router.post("/location", async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and Longitude are required!" });
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const locationData = await response.json();
        console.log(locationData);
        return res.json({
            state: locationData.address.state,
            district: locationData.address.state_district
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching location details" });
    }
});


router.post("/thinkhazard", async (req, res) => {
    const { latitude, longitude, hazardTypes } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and Longitude are required!" });
    }

    try {
        const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const locationData = await nominatimResponse.json();

        if (!locationData.address || !locationData.address.state_district) {
            return res.status(404).json({ error: "Could not determine district from coordinates" });
        }

        const district = locationData.address.state_district;
        const state = locationData.address.state;
        const country = locationData.address.country;

        console.log(`Fetching hazards for District: ${district}, State: ${state}`);

        
        const hazardsToQuery = hazardTypes || ["FL", "EQ", "CY", "DR", "WF", "TS", "LS", "AV"];

        const thinkHazardReports = {};

        for (const hazardType of hazardsToQuery) {
            const thinkHazardUrl = `http://thinkhazard.org/api/hazardreport/ADM2/${encodeURIComponent(district)}/${hazardType}/`;

            try {
                const response = await fetch(thinkHazardUrl);
                if (!response.ok) {
                    console.warn(`No ThinkHazard report found for ${hazardType} in ${district}`);
                    thinkHazardReports[hazardType] = { riskLevel: "Safe", message: "No significant hazard detected" };
                    continue;
                }

                const report = await response.json();
                
                thinkHazardReports[hazardType] = report.hazardLevel
                    ? { riskLevel: report.hazardLevel, details: report }
                    : { riskLevel: "Safe", message: "No significant hazard detected" };

            } catch (error) {
                errorLogger.error("An error occured",error);
                console.error(`Error fetching ThinkHazard report for ${hazardType}:`, error.message);
                thinkHazardReports[hazardType] = { riskLevel: "Unknown", message: "Error fetching report" };
            }
        }

        return res.json({
            location: {
                latitude,
                longitude,
                country,
                state,
                district
            },
            thinkHazardReports
        });
    } catch (error) {
        console.error("Error in /thinkhazard endpoint:", error.message);
        return res.status(500).json({ error: "Error fetching ThinkHazard report" });
    }
});


module.exports = router;