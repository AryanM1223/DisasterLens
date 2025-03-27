const Disaster = require('../models/disasterModel');
const { fetchNews, fetchGdacs, fetchUsgs, fetchWeather } = require('../services/dataService');
const { processPost } = require('../services/processService');

exports.getDisasters = async (req, res) => {
  try {
    const disasters = await Disaster.find().sort({ timestamp: -1 }).limit(100);
    res.status(200).json(disasters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disasters' });
  }
};

exports.startDataCollection = (io) => {
  let newsFetchCounter = 0;

  console.log('Starting data collection interval...');
  setInterval(async () => {
    console.log('Starting data collection cycle...');
    try {
      let newsPosts = [];
      if (newsFetchCounter % 15 === 0) {
        console.log('Fetching NewsAPI data...');
        newsPosts = await fetchNews();
        console.log('NewsAPI posts:', newsPosts);
      }
      console.log('Fetching GDACS data...');
      const gdacsPosts = await fetchGdacs();
      console.log('Fetching USGS data...');
      const usgsPosts = await fetchUsgs();
      console.log('Fetching Open-Meteo data...');
      const weatherPosts = await fetchWeather();

      const allPosts = [...newsPosts, ...gdacsPosts, ...usgsPosts, ...weatherPosts];
      console.log('All posts:', allPosts);

      for (let i = 0; i < allPosts.length; i++) {
        const post = allPosts[i];
        const processed = await processPost(post, i); // Pass the index
        if (processed) {
          const entries = Array.isArray(processed) ? processed : [processed];
          for (const entry of entries) {
            if (entry.category === 'unknown') {
              console.log('Skipping entry with unknown category:', entry.text);
              continue;
            }
            const existingDisaster = await Disaster.findOne({
              text: entry.text,
              timestamp: entry.timestamp,
              source: entry.source,
              'location.state': entry.location.state,
            });
            if (!existingDisaster) {
              const disaster = new Disaster(entry);
              await disaster.save();
              console.log('Saved disaster:', disaster);
              io.emit('newDisaster', disaster);
            } else {
              console.log('Duplicate disaster found, skipping:', entry.text);
            }
          }
        }
      }

      newsFetchCounter++;
    } catch (error) {
      console.error('Error in data collection:', error.message);
      console.error('Error stack:', error.stack);
    }
  }, 60000); // Every minute
};