const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../config');

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

exports.fetchNews = async () => {
    try {
      console.log('Inside fetchNews function...');
      console.log('Checking NewsAPI key...');
      console.log('Config object:', config);
      if (!config.newsApiKey) {
        throw new Error('NewsAPI key is missing in configuration');
      }
      console.log('NewsAPI key loaded successfully:', config.newsApiKey.substring(0, 5) + '...');
      console.log('Making NewsAPI request...');
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'india AND (flood OR earthquake OR cyclone OR disaster OR storm OR landslide OR tsunami OR heatwave OR forest fire)',
          apiKey: config.newsApiKey,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 100,
        },
      });
      console.log('NewsAPI response status:', response.status);
      const articles = response.data.articles || [];
      console.log('NewsAPI raw data:', articles);
  
      // Filter articles to ensure they contain at least one disaster keyword
      const disasterKeywords = ['flood', 'earthquake', 'cyclone', 'disaster', 'storm', 'landslide', 'tsunami', 'heatwave', 'heat wave', 'forest fire'];
      const exclusionKeywords = ['violence', 'arson', 'protest', 'riot', 'clash', 'attack', 'political', 'election', 'scandal', 'space', 'trade', 'cricket', 'ipl', 'market', 'coffee'];
  
      const filteredArticles = articles.filter(article => {
        const text = (article.title + ' ' + (article.description || '')).toLowerCase();
        const hasDisasterKeyword = disasterKeywords.some(keyword => text.includes(keyword));
        const hasExclusionKeyword = exclusionKeywords.some(keyword => text.includes(keyword));
        return hasDisasterKeyword && !hasExclusionKeyword;
      });
  
      console.log('Filtered NewsAPI articles:', filteredArticles);
  
      return filteredArticles.map(article => ({
        text: article.title + ' ' + (article.description || '') + (article.url ? ' ' + article.url : ''),
        created_at: article.publishedAt,
        source: 'NewsAPI',
      }));
    } catch (error) {
      console.error('Error fetching news articles:', error.message);
      console.error('Error stack:', error.stack);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      return [];
    }
  };

exports.fetchGdacs = async () => {
  try {
    console.log('Fetching GDACS data...');
    const response = await axios.get('https://www.gdacs.org/xml/rss.xml');
    console.log('GDACS response status:', response.status);
    const result = await xml2js.parseStringPromise(response.data);
    const items = result.rss.channel[0].item || [];
    console.log('GDACS raw data:', items);
    return items
      .filter(item => {
        const text = (item.title[0] + ' ' + (item.description[0] || '')).toLowerCase();
        return text.includes('india');
      })
      .map(item => ({
        text: item.title[0] + ' ' + (item.description[0] || ''),
        created_at: item.pubDate[0],
        source: 'GDACS',
        link: item.link[0],
      }));
  } catch (error) {
    console.error('Error fetching GDACS alerts:', error.message);
    return [];
  }
};

exports.fetchUsgs = async () => {
  try {
    console.log('Fetching USGS data...');
    const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson');
    const features = response.data.features || [];
    console.log('USGS raw data:', features);

    const minLat = 6.5;
    const maxLat = 35.5;
    const minLon = 68.0;
    const maxLon = 97.5;

    return features
      .filter(feature => {
        const coords = feature.geometry.coordinates;
        const [longitude, latitude] = coords;
        const title = feature.properties.title.toLowerCase();

        // Check if the event is within India's bounding box
        const isWithinBounds =
          latitude >= minLat &&
          latitude <= maxLat &&
          longitude >= minLon &&
          longitude <= maxLon;

        // Check if the title mentions other countries
        const mentionsOtherCountry = !title.includes('india') && (
          title.includes('afghanistan') ||
          title.includes('pakistan') ||
          title.includes('china') ||
          title.includes('nepal') ||
          title.includes('bhutan') ||
          title.includes('bangladesh') ||
          title.includes('myanmar') ||
          title.includes('alaska') ||
          title.includes('california') ||
          title.includes('nevada') ||
          title.includes('peru') ||
          title.includes('mexico') ||
          title.includes('fiji')
        );

        return isWithinBounds && !mentionsOtherCountry;
      })
      .map(feature => ({
        text: `Earthquake: ${feature.properties.title}`,
        created_at: new Date(feature.properties.time).toISOString(),
        source: 'USGS',
        coordinates: feature.geometry.coordinates,
      }));
  } catch (error) {
    console.error('Error fetching USGS data:', error.message);
    return [];
  }
};

exports.fetchWeather = async () => {
    try {
      // Define multiple locations across India (latitude, longitude, and name)
      const locations = [
        { name: 'Kerala (Thrissur)', latitude: 10.8505, longitude: 76.2711 }, 
        { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 }, 
        { name: 'Delhi', latitude: 28.7041, longitude: 77.1025 }, 
        { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 }, 
        { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639 }, 
        { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 }, 
        { name: 'Guwahati (Assam)', latitude: 26.1445, longitude: 91.7362 }, 
        { name: 'Bhubaneswar (Odisha)', latitude: 20.2961, longitude: 85.8245 }, 
      ];
  
      const allAlerts = [];
  
      // Fetch weather data for each location
      for (const location of locations) {
        console.log(`Fetching Open-Meteo data for ${location.name}...`);
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            hourly: 'precipitation,windspeed_10m',
            forecast_days: 1,
          },
        });
  
        const hourly = response.data.hourly;
        const alerts = [];
  
        // Check for heavy rainfall and high winds
        for (let i = 0; i < hourly.time.length; i++) {
          if (hourly.precipitation[i] > 30) { // Lowered threshold for heavy rainfall (30 mm/hour)
            alerts.push({
              text: `Heavy rainfall detected in ${location.name}: ${hourly.precipitation[i]} mm`,
              created_at: hourly.time[i],
              source: 'Open-Meteo',
              category: 'flood',
              coordinates: [location.longitude, location.latitude],
            });
          }
          if (hourly.windspeed_10m[i] > 50) { // Lowered threshold for high winds (50 km/h)
            alerts.push({
              text: `High winds detected in ${location.name}: ${hourly.windspeed_10m[i]} km/h`,
              created_at: hourly.time[i],
              source: 'Open-Meteo',
              category: 'cyclone',
              coordinates: [location.longitude, location.latitude],
            });
          }
        }
  
        console.log(`Open-Meteo alerts for ${location.name}:`, alerts);
        allAlerts.push(...alerts);
      }
  
      console.log('All Open-Meteo alerts:', allAlerts);
      return allAlerts;
    } catch (error) {
      console.error('Error fetching Open-Meteo weather data:', error.message);
      return [];
    }
  };

// Helper function to process posts
const processPost = async (post) => {
    try {
      let category = 'unknown';
      const textLower = post.text.toLowerCase();
  
      // Check for disaster keywords in a more robust way
      if (textLower.includes('earthquake')) category = 'earthquake';
      if (textLower.includes('flood')) category = 'flood';
      if (textLower.includes('cyclone') || textLower.includes('storm')) category = 'cyclone';
      if (textLower.includes('landslide')) category = 'landslide';
      if (textLower.includes('tsunami')) category = 'tsunami';
      if (textLower.includes('forest fire')) category = 'forest fire';
      if (textLower.includes('heatwave') || textLower.includes('heat wave')) category = 'heatwave';
  
      // Use category from fetchWeather if provided
      if (post.category) {
        category = post.category;
      }
  
      // Skip if no disaster category is identified
      if (category === 'unknown') {
        console.log('Skipping post with no disaster category:', post.text);
        return null;
      }
  
      // Define states and cities with their coordinates
      const states = {
        'andhra pradesh': [80.0, 16.5],
        'arunachal pradesh': [93.0, 28.0],
        'assam': [92.0, 26.0],
        'bihar': [85.0, 25.0],
        'chhattisgarh': [82.0, 21.0],
        'goa': [74.0, 15.0],
        'gujarat': [72.0, 23.0],
        'haryana': [76.0, 29.0],
        'himachal pradesh': [77.0, 31.0],
        'jharkhand': [85.0, 23.0],
        'karnataka': [76.0, 15.0],
        'kerala': [76.0, 10.0],
        'madhya pradesh': [78.0, 23.0],
        'maharashtra': [73.0, 19.0],
        'manipur': [94.0, 24.0],
        'meghalaya': [91.0, 25.0],
        'mizoram': [92.0, 23.0],
        'nagaland': [94.0, 26.0],
        'odisha': [85.0, 20.0],
        'punjab': [75.0, 31.0],
        'rajasthan': [74.0, 27.0],
        'sikkim': [88.0, 27.0],
        'tamil nadu': [78.0, 11.0],
        'telangana': [79.0, 17.0],
        'tripura': [91.0, 23.0],
        'uttar pradesh': [80.0, 27.0],
        'uttarakhand': [79.0, 30.0],
        'west bengal': [88.0, 22.0],
        'nicobar islands': [92.5, 7.0],
        // Add cities for more precision
        'bengaluru': [77.5946, 12.9716],
        'delhi': [77.1025, 28.7041],
        'mumbai': [72.8777, 19.0760],
        'faridabad': [77.3178, 28.4089],
        'gwalior': [78.1828, 26.2183],
        'kota': [75.8391, 25.2138],
        'ludhiana': [75.8573, 30.9010],
        'meerut': [77.7064, 28.9845],
        'surat': [72.8311, 21.1702],
      };
  
      // Find all mentioned locations
      const mentionedLocations = [];
      for (const [locationName, coords] of Object.entries(states)) {
        if (textLower.includes(locationName)) {
          const formattedName = locationName.charAt(0).toUpperCase() + locationName.slice(1);
          mentionedLocations.push({ state: formattedName, coordinates: coords });
        }
      }
  
      // If no locations are found, use default
      if (mentionedLocations.length === 0) {
        mentionedLocations.push({ state: 'Unknown', coordinates: [85.0, 20.0] });
      }
  
      // Create a disaster entry for each location
      const disasterEntries = mentionedLocations.map(location => ({
        text: post.text,
        category,
        location: { state: location.state, coordinates: location.coordinates },
        timestamp: new Date(post.created_at).toISOString(),
        source: post.source,
      }));
  
      // For USGS and Open-Meteo posts, override coordinates if provided
      if ((post.source === 'USGS' || post.source === 'Open-Meteo') && post.coordinates) {
        disasterEntries.forEach(entry => {
          entry.location.coordinates = post.coordinates.slice(0, 2); // [longitude, latitude]
        });
      }
  
      return disasterEntries.length === 1 ? disasterEntries[0] : disasterEntries;
    } catch (error) {
      console.error('Error processing post:', error.message);
      return null;
    }
  };

// Export processPost for use in disasterController.js
exports.processPost = processPost;