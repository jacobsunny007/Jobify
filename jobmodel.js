const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true },
  salary: { type: String, required: true },
  description: { type: String, required: true },
  postedBy: { type: String, required: true }, // employer email
  postedAt: { type: Date, default: Date.now }
}, { timestamps: true }); // Enables createdAt and updatedAt

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
