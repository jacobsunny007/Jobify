const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
require("./db");
const Interview = require("./interview");
const Job = require("./jobmodel");
const Employer = require("./employermodel");
const Seeker = require("./Seeker");
const AppliedJob = require("./appliedJobModel");

const app = express();
const port = 5000;

// Multer setup for resume upload
const upload = multer({ storage: multer.memoryStorage() });

app.use('/uploads/resumes', express.static(path.join(__dirname, 'uploads/resumes')));
app.use(express.json());
app.use(cors());

/* --------------------------- SEEKER ROUTES --------------------------- */
app.post('/api/seeker/register', upload.single('resume'), async (req, res) => {
  const { name, email, password, age, location, linkedin, bio } = req.body;
  try {
    const existing = await Seeker.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already used" });
    if (!req.file) return res.status(400).json({ error: "Resume is required" });

    const newSeeker = new Seeker({
      name, email, password, age, location, linkedin, bio,
      resume: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname,
      }
    });

    await newSeeker.save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/api/seeker/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const seeker = await Seeker.findOne({ email });
    if (!seeker || seeker.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get('/api/seeker/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const seeker = await Seeker.findOne({ email });
    if (!seeker) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      name: seeker.name,
      email: seeker.email,
      age: seeker.age,
      location: seeker.location,
      linkedin: seeker.linkedin,
      bio: seeker.bio,
      resume: seeker.resume ? {
        data: seeker.resume.data,
        contentType: seeker.resume.contentType,
        fileName: seeker.resume.fileName,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.put('/api/seeker/profile', upload.single('resume'), async (req, res) => {
  const { email, name, age, location, linkedin, bio } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const updateData = { name, age, location, linkedin, bio };
    if (req.file) {
      updateData.resume = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname,
      };
    }

    const updated = await Seeker.findOneAndUpdate({ email }, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "Profile updated", seeker: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* --------------------------- EMPLOYER ROUTES --------------------------- */
app.post('/api/employer/register', async (req, res) => {
  const { email, password, company } = req.body;
  try {
    const existing = await Employer.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already used" });

    const employer = new Employer({ company, email, password });
    await employer.save();

    res.status(201).json({
      message: "Registered successfully",
      employer: {
        id: employer._id,
        email: employer.email,
        company: employer.company,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/api/employer/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const employer = await Employer.findOne({ email });
    if (!employer || employer.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.status(200).json({
      message: "Login successful",
      employer: {
        id: employer._id,
        email: employer.email,
        company: employer.company,
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ----------------------------- JOB ROUTES ------------------------------ */
app.get("/api/jobs/employer-jobs", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const jobs = await Job.find({ postedBy: email }).sort({ createdAt: -1 });

    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await AppliedJob.countDocuments({ jobId: job._id });
        return { ...job.toObject(), applicationsCount: count };
      })
    );

    res.status(200).json(jobsWithCounts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.post('/api/jobs', async (req, res) => {
  const { title, company, location, type, salary, description, postedBy } = req.body;
  if (!postedBy) return res.status(400).json({ error: "Missing postedBy" });

  try {
    const newJob = await Job.create({ title, company, location, type, salary, description, postedBy });
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.send("Job deleted successfully!");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Invalid job ID' });
  }
});

/* --------------------------- APPLICATION ROUTES ------------------------- */
app.post("/api/apply", async (req, res) => {
  const { jobId, userEmail } = req.body;
  if (!jobId || !userEmail) return res.status(400).json({ error: "Missing jobId or userEmail" });

  try {
    const exists = await AppliedJob.findOne({ jobId, userEmail });
    if (exists) return res.status(409).json({ message: "Already applied" });

    const newApp = await AppliedJob.create({ jobId, userEmail, status: "applied" });
    res.status(201).json({ message: "Application successful", newApp });
  } catch (err) {
    res.status(500).json({ error: "Apply failed" });
  }
});

app.delete("/api/withdraw-application", async (req, res) => {
  const { jobId, email } = req.body;

  if (!jobId || !email) {
    return res.status(400).json({ error: "Missing jobId or email" });
  }

  try {
    const deleted = await AppliedJob.findOneAndDelete({ jobId, userEmail: email });

    if (!deleted) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.status(200).json({ message: "Application withdrawn and deleted from DB" });
  } catch (err) {
    console.error("Withdraw delete error:", err);
    res.status(500).json({ error: "Failed to withdraw application" });
  }
});


app.get("/api/applied-jobs", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const appliedJobs = await AppliedJob.find({ userEmail: email }).populate("jobId");

    const jobs = appliedJobs
      .filter(item => item.jobId)
     .map(item => ({
      ...item.jobId.toObject(),
      status: item.status || "applied",
      appliedAt: item.appliedAt,
      interviewDetails: item.interviewDetails || null,
    }));

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Fetching failed" });
  }
});

app.put("/api/applicant/status", async (req, res) => {
  const { jobId, email, status } = req.body;
  if (!jobId || !email || !status) return res.status(400).json({ error: "Missing jobId, email, or status" });

  try {
    const updated = await AppliedJob.findOneAndUpdate(
      { jobId, userEmail: email },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Application not found" });

    res.json({ message: "Status updated", application: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.get("/api/applicant", async (req, res) => {
  const { jobId } = req.query;
  if (!jobId) return res.status(400).json({ error: "Missing jobId" });

  try {
    const applications = await AppliedJob.find({ jobId });
    const applicants = await Promise.all(
      applications.map(async (app) => {
        const seeker = await Seeker.findOne({ email: app.userEmail });
        if (!seeker) return null;

        return {
          name: seeker.name,
          email: seeker.email,
          age: seeker.age,
          location: seeker.location,
          linkedin: seeker.linkedin,
          bio: seeker.bio,
          resume: seeker.resume,
          appliedAt: app.appliedAt,
          status: app.status || "applied"
        };
      })
    );

    res.json(applicants.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/applicant", async (req, res) => {
  const { jobId, email } = req.query;
  if (!jobId || !email) return res.status(400).json({ error: "Missing jobId or email" });

  try {
    const updated = await AppliedJob.findOneAndUpdate(
      { jobId, userEmail: email },
      { status: "rejected" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Application not found" });

    res.json({ message: "Applicant rejected", application: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject applicant" });
  }
});

app.get("/api/stats/interview-count", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const jobs = await Job.find({ postedBy: email });
    const jobIds = jobs.map((job) => job._id);
    const count = await AppliedJob.countDocuments({ jobId: { $in: jobIds }, status: "interview scheduled" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

/* ---------------------- EMPLOYER PROFILE ---------------------- */
app.get("/api/employer/profile", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const employer = await Employer.findOne({ email });
    if (!employer) return res.status(404).json({ error: "Not found" });

    res.status(200).json({
      name: employer.email.split("@")[0],
      company: employer.company,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employer" });
  }
});

/* --------------------------- INTERVIEW ROUTES --------------------------- */

// Create interview and update applicant status
app.post('/api/interviews', async (req, res) => {
  const { jobId, seekerEmail, interviewDate, interviewTime, mode, link, message } = req.body;

  if (!jobId || !seekerEmail || !interviewDate || !interviewTime || !mode) {
    return res.status(400).json({ error: "Missing required interview fields" });
  }

  try {
    const interview = new Interview({
      jobId,
      seekerEmail,
      interviewDate,
      interviewTime,
      mode,
      link,
      message,
    });
    await interview.save();

    // Update application status
    await AppliedJob.findOneAndUpdate(
      { jobId, userEmail: seekerEmail },
      { status: "interview scheduled" }
    );

    res.status(201).json({ message: "Interview scheduled", interview });
  } catch (err) {
    res.status(500).json({ error: "Failed to schedule interview", details: err.message });
  }
});

// Get interviews for a specific seeker (used in AppliedJobs)
app.get('/api/interviews', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const interviews = await Interview.find({ seekerEmail: email }).populate("jobId");
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch interviews", details: err.message });
  }
});

// Get interviews for a specific job (used in ApplicantListPage)
app.get('/api/interviews/job/:jobId', async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) return res.status(400).json({ error: "Job ID required" });

  try {
    const interviews = await Interview.find({ jobId }).populate("jobId");
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job-specific interviews", details: err.message });
  }
});

/* ---------------------- ADMIN ROUTES (from second code) ---------------------- */

// ✅ Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = "admin@jobportal.com";
  const adminPassword = "admin123";

  if (email === adminEmail && password === adminPassword) {
    res.status(200).json({ message: "Admin login successful", token: "admin-auth-token" });
  } else {
    res.status(401).json({ error: "Invalid admin credentials" });
  }
});

// ✅ Admin - Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const employers = await Employer.find().select("email company");
    const seekers = await Seeker.find().select("name email");

    const users = [
      ...employers.map(e => ({
        name: e.company,
        email: e.email,
        type: "Employer",
        status: "Active"
      })),
      ...seekers.map(s => ({
        name: s.name,
        email: s.email,
        type: "Job Seeker",
        status: "Active"
      }))
    ];

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Admin - Delete user
app.delete("/api/admin/users/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const employer = await Employer.findOneAndDelete({ email });
    const seeker = await Seeker.findOneAndDelete({ email });

    if (!employer && !seeker) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ✅ Admin - Get all job posts
app.get("/api/admin/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().select("title company");
    const result = jobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.company,
      status: "Active"
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// ✅ Admin - Delete job
app.delete("/api/admin/jobs/:id", async (req, res) => {
  try {
    const deleted = await Job.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ---------------------- ROOT ---------------------- */
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
