const express = require('express');

const router = express.Router();

router.post("/location", async(req,res) =>{
    const {latitude , longitude} = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and Longitude are required!" });
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        const locationData = await response.json();
        console.log(locationData);
        return res.json({
            state: locationData.address.state,
            district: locationData.address.state_district
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching location details" });
    }
})

module.exports = router;
