const axios = require("axios");
const Disaster = require("../models/disasterModel");

// Bounding box for India
const INDIA_BOUNDS = {
  minLat: 6.5,
  maxLat: 37.0,
  minLon: 68.0,
  maxLon: 97.5,
};

const isWithinIndia = (lon, lat) => {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lon >= INDIA_BOUNDS.minLon &&
    lon <= INDIA_BOUNDS.maxLon
  );
};

const cityCoordinates = {
  Bengaluru: { coordinates: [77.5946, 12.9716], state: "Karnataka" },
  Delhi: { coordinates: [77.1025, 28.7041], state: "Delhi" },
  Mumbai: { coordinates: [72.8777, 19.0760], state: "Maharashtra" },
  Faridabad: { coordinates: [77.3178, 28.4089], state: "Haryana" },
  Gwalior: { coordinates: [78.1828, 26.2183], state: "Madhya Pradesh" },
  Kota: { coordinates: [75.8391, 25.1825], state: "Rajasthan" },
  Ludhiana: { coordinates: [75.8573, 30.9010], state: "Punjab" },
  Meerut: { coordinates: [77.7064, 28.9845], state: "Uttar Pradesh" },
  Surat: { coordinates: [72.8311, 21.1702], state: "Gujarat" },
  Shillong: { coordinates: [91.8933, 25.5788], state: "Meghalaya" },
  Jowai: { coordinates: [92.2971, 25.4414], state: "Meghalaya" },
  Khliehriat: { coordinates: [92.3748, 25.3590], state: "Meghalaya" },
  "Nicobar Islands": {
    coordinates: [92.5324, 6.7709],
    state: "Andaman and Nicobar Islands",
  },
  "Port Blair": {
    coordinates: [92.7265, 11.6234],
    state: "Andaman and Nicobar Islands",
  },
};

// Helper function to extract location from text
const extractLocationFromText = (text, source) => {
  const lowerText = text.toLowerCase();
  // Check if the text mentions any known cities/regions
  const citiesMentioned = Object.keys(cityCoordinates).filter((city) =>
    lowerText.includes(city.toLowerCase())
  );

  if (citiesMentioned.length > 0) {
    return {
      state: cityCoordinates[citiesMentioned[0]].state,
      coordinates: cityCoordinates[citiesMentioned[0]].coordinates,
    };
  }

  // For USGS posts, extract location after " - "
  if (source === "USGS" && text.includes(" - ")) {
    const parts = text.split(" - ");
    if (parts.length > 1) {
      const locationText = parts[1].split(",")[0].trim(); // e.g., "Nicobar Islands"
      // Check if the extracted location matches a known region
      const matchedCity = Object.keys(cityCoordinates).find((city) =>
        locationText.toLowerCase().includes(city.toLowerCase())
      );
      if (matchedCity) {
        return {
          state: cityCoordinates[matchedCity].state,
          coordinates: cityCoordinates[matchedCity].coordinates,
        };
      }
      // Fallback: Map common location texts to states
      if (locationText.toLowerCase().includes("nicobar")) {
        return {
          state: "Andaman and Nicobar Islands",
          coordinates: cityCoordinates["Nicobar Islands"].coordinates,
        };
      }
      // If no match, return "Unknown"
      return {
        state: "Unknown",
        coordinates: null,
      };
    }
  }

  // For GDACS posts, extract countries between "affects these countries: [" and "]"
  if (source === "GDACS" && text.includes("affects these countries: [")) {
    const start = text.indexOf("affects these countries: [") + 26;
    const end = text.indexOf("]", start);
    const countries = text
      .substring(start, end)
      .split(",")
      .map((c) => c.trim());
    if (countries.length > 0 && countries[0] !== "[unknown]") {
      return {
        state: countries[0], // Use the first country as the state
        coordinates: null,
      };
    }
  }

  return {
    state: "Unknown",
    coordinates: null,
  };
};

// Rate-limiting delay for LocationIQ requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const reverseGeocode = async (lon, lat, requestIndex = 0) => {
  try {
    // Add a delay to avoid hitting the rate limit (2 requests per second)
    await delay(requestIndex * 500); // 500ms delay per request

    const apiKey = "pk.5be457253f673a8cb2ce17d11ca17749";
    const response = await axios.get("https://us1.locationiq.com/v1/reverse", {
      params: {
        key: apiKey,
        lat: lat,
        lon: lon,
        format: "json",
      },
    });

    const data = response.data;
    const state = data.address?.state || "Unknown";
    return state;
  } catch (error) {
    console.error("Error in reverse geocoding with LocationIQ:", error.message);
    return "Unknown";
  }
};

exports.processPost = async (post, requestIndex) => {
  try {
    let category = "unknown";
    let coordinates = null;
    let state = "Unknown";

    const text = post.text.toLowerCase();

    if (text.includes("earthquake")) {
      category = "earthquake";
    } else if (text.includes("flood")) {
      category = "flood";
    } else if (text.includes("cyclone") || text.includes("storm")) {
      category = "cyclone";
    } else if (text.includes("heatwave") || text.includes("heat wave")) {
      category = "heatwave";
    }

    // Extract location from text first
    let location = extractLocationFromText(post.text, post.source);
    state = location.state;
    coordinates = location.coordinates;

    // If coordinates are provided and state is still "Unknown", try reverse geocoding
    if (post.coordinates && state === "Unknown") {
      const [lon, lat] = post.coordinates;

      if (isWithinIndia(lon, lat)) {
        state = await reverseGeocode(lon, lat, requestIndex);
        coordinates = post.coordinates; // Use the provided coordinates
      }
    }

    // Special handling for NewsAPI posts
    if (post.source === "NewsAPI") {
      const entries = [];
      const citiesMentioned = Object.keys(cityCoordinates).filter((city) =>
        text.includes(city.toLowerCase())
      );

      if (citiesMentioned.length > 0) {
        for (let i = 0; i < citiesMentioned.length; i++) {
          const city = citiesMentioned[i];
          let cityState = cityCoordinates[city].state;
          let cityCoordinates = cityCoordinates[city].coordinates;

          // If state is "Unknown", try reverse geocoding
          if (cityState === "Unknown" && cityCoordinates) {
            const [lon, lat] = cityCoordinates;
            if (isWithinIndia(lon, lat)) {
              cityState = await reverseGeocode(lon, lat, requestIndex + i);
            }
          }

          entries.push({
            text: post.text,
            timestamp: post.created_at,
            source: post.source,
            category: category,
            location: {
              state: cityState,
              coordinates: cityCoordinates,
            },
          });
        }
        return entries;
      } else if (
        text.includes("shillong") ||
        text.includes("jowai") ||
        text.includes("khliehriat")
      ) {
        state = "Meghalaya";
        coordinates = [91.3662, 25.467];
      }
    }

    return [
      {
        text: post.text,
        timestamp: post.created_at,
        source: post.source,
        category: category,
        location: {
          state: state,
          coordinates: coordinates,
        },
      },
    ];
  } catch (error) {
    console.error("Error processing post:", error.message);
    return null;
  }
};