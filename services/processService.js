const { extractLocation } = require('../utils/geoCode');

// Bounding box for India (approximate)
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

exports.processPost = async (post) => {
  const text = post.text.toLowerCase();
  let category = post.category || 'unknown';

  if (!category || category === 'unknown') {
    if (text.includes('flood') || text.includes('rainfall')) category = 'flood';
    else if (text.includes('earthquake')) category = 'earthquake';
    else if (text.includes('cyclone') || text.includes('winds')) category = 'cyclone';
  }

  let location;
  if (post.coordinates) {
    const [lon, lat] = post.coordinates;
    if (!isWithinIndia(lon, lat)) {
      return null; // Discard if not in India
    }
    location = { state: 'Unknown', coordinates: [lon, lat] };
  } else {
    location = await extractLocation(text);
    if (!location) return null; // Discard if no location found
    const [lon, lat] = location.coordinates;
    if (!isWithinIndia(lon, lat)) {
      return null; // Discard if not in India
    }
  }

  return {
    text: post.text,
    category,
    location,
    timestamp: new Date(post.created_at),
    source: post.source,
  };
};