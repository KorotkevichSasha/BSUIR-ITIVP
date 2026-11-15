const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);
// Prepare collections/indexes explicitly after connect, not at model compilation.
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);

async function connectMongo() {
  if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in the local .env file');
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || 'game_media_lab6',
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 5,
  });
  console.log('MongoDB connected');
}

module.exports = { mongoose, connectMongo };
