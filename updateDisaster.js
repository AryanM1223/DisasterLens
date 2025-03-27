// Migration script (run once)
const mongoose = require("mongoose");
const Disaster = require("./models/disasterModel");

mongoose.connect("mongodb://localhost:27017/your-database", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateData = async () => {
  try {
    const disasters = await Disaster.find();
    for (const disaster of disasters) {
      if (disaster.location.state) {
        disaster.location = {
          name: disaster.location.state,
          coordinates: disaster.location.coordinates || null,
          type: "state", // Assume existing data is for Indian states
        };
        await disaster.save();
      }
    }
    console.log("Migration completed");
    mongoose.connection.close();
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.connection.close();
  }
};

migrateData();