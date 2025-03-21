const express = require('express');
const { getDisasters } = require('../controllers/disasterController');
const { fetchNews } = require('../services/dataService');

const router = express.Router();

router.get('/disasters', getDisasters);

router.get('/test-news', async (req, res) => {
    try {
      const newsPosts = await fetchNews();
      res.json(newsPosts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  

module.exports = router;