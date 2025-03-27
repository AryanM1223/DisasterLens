const mongoose = require('mongoose');
const axios = require('axios');
const Disaster = require('./models/disasterModel');
const config = require('./config');

// Helper function to extract location name from the text field
const extractLocationNameFromText = (text, source) => {
  if (!text) return null;

  if (source === "USGS") {
    const parts = text.split(" - ");
    if (parts.length > 1) {
      const locationParts = parts[1].split(",");
      return locationParts[0].trim();
    }
  } else if (source === "GDACS") {
    const countryMatch = text.match(/The cyclone affects these countries: \[([^\]]*)\]/);
    if (countryMatch && countryMatch[1] !== "unknown") {
      return countryMatch[1].trim();
    }
    const regionMatch = text.match(/was active in (\w+)/);
    if (regionMatch) {
      return regionMatch[1].trim();
    }
  }

  return null;
};

// Helper function to geocode a location name using LocationIQ
const geocodeLocation = async (locationName) => {
  if (!locationName) return null;

  try {
    const response = await axios.get('https://api.locationiq.com/v1/autocomplete.php', {
      params: {
        key: config.locationIqApiKey,
        q: locationName,
        format: 'json',
        limit: 1,
        countrycodes: 'IN',
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const address = result.address || {};
      return address.state || null;
    }
  } catch (error) {
    console.error(`Error geocoding location "${locationName}":`, error.message);
  }
  return null;
};

// Helper function to reverse geocode coordinates using LocationIQ
const reverseGeocodeCoordinates = async (coordinates) => {
  if (!coordinates || coordinates.length !== 2) return null;

  const [lon, lat] = coordinates;
  try {
    const response = await axios.get('https://api.locationiq.com/v1/reverse.php', {
      params: {
        key: config.locationIqApiKey,
        lat: lat,
        lon: lon,
        format: 'json',
      },
    });

    if (response.data && response.data.address) {
      const address = response.data.address;
      return address.state || null;
    }
  } catch (error) {
    console.error(`Error reverse geocoding coordinates [${lon}, ${lat}]:`, error.message);
  }
  return null;
};

// Connect to MongoDB and update disasters
mongoose.connect(config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');

    // Fetch all disasters
    const disasters = await Disaster.find();

    // Update each disaster's location.state
    for (const disaster of disasters) {
      const locationName = extractLocationNameFromText(disaster.text, disaster.source);
      const coordinates = disaster.location?.coordinates;

      // Try forward geocoding using the location name
      let state = locationName ? await geocodeLocation(locationName) : null;

      // Fallback to reverse geocoding using coordinates if forward geocoding fails
      if (!state && coordinates) {
        state = await reverseGeocodeCoordinates(coordinates);
      }

      const newState = state || "Unknown";
      await Disaster.updateOne(
        { _id: disaster._id },
        { $set: { "location.state": newState } }
      );
      console.log(`Updated location.state for ${disaster.text} to ${newState}`);
    }

    console.log('All disasters updated');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    mongoose.connection.close();
  });