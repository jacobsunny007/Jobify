// models/Seeker.js
const mongoose = require('mongoose');

const seekerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  age: Number,
  location: String,
  linkedin: String,
  bio: String,
  resume: {
    data: Buffer,
    contentType: String,
    fileName: String
  }
});

module.exports = mongoose.model('Seeker', seekerSchema);