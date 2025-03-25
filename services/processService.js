const axios = require('axios');
const Disaster = require('../models/disasterModel');

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
  'Bengaluru': { coordinates: [77.5946, 12.9716], state: 'Karnataka' },
  'Delhi': { coordinates: [77.1025, 28.7041], state: 'Delhi' },
  'Mumbai': { coordinates: [72.8777, 19.0760], state: 'Maharashtra' },
  'Faridabad': { coordinates: [77.3178, 28.4089], state: 'Haryana' },
  'Gwalior': { coordinates: [78.1828, 26.2183], state: 'Madhya Pradesh' },
  'Kota': { coordinates: [75.8391, 25.1825], state: 'Rajasthan' },
  'Ludhiana': { coordinates: [75.8573, 30.9010], state: 'Punjab' },
  'Meerut': { coordinates: [77.7064, 28.9845], state: 'Uttar Pradesh' },
  'Surat': { coordinates: [72.8311, 21.1702], state: 'Gujarat' },
  'Shillong': { coordinates: [91.8933, 25.5788], state: 'Meghalaya' },
  'Jowai': { coordinates: [92.2971, 25.4414], state: 'Meghalaya' },
  'Khliehriat': { coordinates: [92.3748, 25.3590], state: 'Meghalaya' },
};


const reverseGeocode = async (lon, lat) => {
  try {
    const apiKey = 'pk.5be457253f673a8cb2ce17d11ca17749'; 
    const response = await axios.get('https://us1.locationiq.com/v1/reverse', {
      params: {
        key: apiKey,
        lat: lat,
        lon: lon,
        format: 'json',
      },
    });

    const data = response.data;
    const state = data.address?.state || 'Unknown';
    return state;
  } catch (error) {
    console.error('Error in reverse geocoding with LocationIQ:', error.message);
    return 'Unknown';
  }
};

exports.processPost = async (post) => {
  try {
    let category = 'unknown';
    let coordinates = null;
    let state = 'Unknown';

    const text = post.text.toLowerCase();

    if (text.includes('earthquake')) {
      category = 'earthquake';
    } else if (text.includes('flood')) {
      category = 'flood';
    } else if (text.includes('cyclone') || text.includes('storm')) {
      category = 'cyclone';
    } else if (text.includes('heatwave') || text.includes('heat wave')) {
      category = 'heatwave';
    }

    
    if (post.coordinates) {
      coordinates = post.coordinates;
      const [lon, lat] = coordinates;

     
      if (isWithinIndia(lon, lat)) {
        
        state = await reverseGeocode(lon, lat);
      }
    }

  
    if (post.source === 'NewsAPI') {
      const entries = [];
      const citiesMentioned = Object.keys(cityCoordinates).filter(city =>
        text.includes(city.toLowerCase())
      );

      if (citiesMentioned.length > 0) {
       
        for (const city of citiesMentioned) {
          entries.push({
            text: post.text,
            timestamp: post.created_at,
            source: post.source,
            category: category,
            location: {
              state: cityCoordinates[city].state,
              coordinates: cityCoordinates[city].coordinates,
            },
          });
        }
        return entries;
      } else if (text.includes('shillong') || text.includes('jowai') || text.includes('khliehriat')) {
  
        state = 'Meghalaya';
        coordinates = [91.3662, 25.467]; 
      }
    }

  
    return [{
      text: post.text,
      timestamp: post.created_at,
      source: post.source,
      category: category,
      location: {
        state: state,
        coordinates: coordinates,
      },
    }];
  } catch (error) {
    console.error('Error processing post:', error.message);
    return null;
  }
};