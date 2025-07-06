// models/employermodel.js
const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
  company: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('Employer', employerSchema);
