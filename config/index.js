require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://aryan:aryanmishrav12@cluster0.qkzup.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  newsApiKey: process.env.NEWSAPI_KEY || '9e959739f7e64c67be05c70e1f640787',
};