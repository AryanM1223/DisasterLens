const mongoose = require("mongoose");

const disasterSchema = new mongoose.Schema({
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  source: { type: String, required: true },
  category: { type: String, required: true },
  location: {
    name: { type: String, required: true },
    coordinates: { type: [Number], default: null }, 
    type: { type: String, enum: ["state", "country", "unknown"], required: true },
  },
});

module.exports = mongoose.model("Disaster", disasterSchema);