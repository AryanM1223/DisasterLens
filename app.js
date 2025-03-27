const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors'); 
const config = require('./config');
const disasterRoutes = require('./routes/disasterRoute');
const { startDataCollection } = require('./controllers/disasterController');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());

app.use(express.json());
app.use('/api', disasterRoutes);

mongoose.connect(config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

startDataCollection(io);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});