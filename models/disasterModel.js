const mongoose = require('mongoose');

const disasterSchema = new mongoose.Schema({
  text: String,
  category: { type: String, enum: ['flood', 'earthquake', 'cyclone', 'unknown'], default: 'unknown' },
  location: {
    state: String,
    coordinates: [Number], 
  },
  timestamp: { type: Date, default: Date.now },
  source: String, 
});

module.exports = mongoose.model('Disaster', disasterSchema);