// appliedJobModel.js
const mongoose = require('mongoose');

const appliedJobSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  userEmail: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'applied' } // <-- make sure this line exists
});

module.exports = mongoose.model('AppliedJob', appliedJobSchema);
  