const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  seekerEmail: { type: String, required: true },
  interviewDate: { type: String, required: true },
  interviewTime: { type: String, required: true },
  mode: { type: String, required: true },
  message: { type: String },
  link: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);
