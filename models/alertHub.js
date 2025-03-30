const mongoose = require('mongoose');

const alertHubSchema = new mongoose.Schema({
  disasterType: { 
    type: String, 
    enum: ['cyclone', 'rainfall', 'flood', 'earthquake', 'tsunami', 'landslide', 'avalanche', 'drought', 'thunderstorm', 'wildfire'], 
    required: true 
  },
  affected_areas: [{
    state: { type: String, required: true },
    districts: [{ type: String }],
    zone: { type: String, enum: ['No warning', 'Watch', 'Alert', 'Warning'], required: true },
    details: { type: String }
  }],
  alertDetails: { type: String },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AlertHub', alertHubSchema);