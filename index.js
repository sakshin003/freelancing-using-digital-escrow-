const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// LowDB setup
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { freelancers: [], hirers: [], jobs: [], reviews: [] });

// Read data from JSON file
db.read();

// Routes
app.post('/api/client/v2.0/app/whiz-ihwsd/service/freelancers/incoming_webhook/loginFreelancer', async (req, res) => {
  const { metamask } = req.body;
  const freelancer = db.data.freelancers.find(f => f.metamask === metamask);
  if (freelancer) {
    res.status(200).json(freelancer);
  } else {
    res.status(404).json({ error: 'User Not Found!' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/freelancers/incoming_webhook/registerFreelancer', async (req, res) => {
  const freelancer = req.body;
  freelancer._id = Date.now().toString(); // Simple ID
  db.data.freelancers.push(freelancer);
  db.write();
  res.status(200).json({ insertedId: freelancer._id });
});

app.get('/api/client/v2.0/app/whiz-ihwsd/service/freelancers/incoming_webhook/viewFreelancers', async (req, res) => {
  res.status(200).json(db.data.freelancers);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/freelancers/incoming_webhook/viewFlSkills', async (req, res) => {
  const { freelancerId } = req.body;
  const freelancer = db.data.freelancers.find(f => f._id === freelancerId);
  if (freelancer) {
    res.status(200).json(freelancer);
  } else {
    res.status(404).json({ error: 'Freelancer not found' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/freelancers/incoming_webhook/updateFreelancer', async (req, res) => {
  const { metamask, ...updateFields } = req.body;
  const freelancer = db.data.freelancers.find(f => f.metamask === metamask);
  if (freelancer) {
    Object.assign(freelancer, updateFields);
    db.write();
    res.status(200).json({ modifiedCount: 1 });
  } else {
    res.status(404).json({ error: 'Freelancer not found' });
  }
});

// Hirer routes
app.post('/api/client/v2.0/app/whiz-ihwsd/service/hirers/incoming_webhook/loginHirer', async (req, res) => {
  const { metamask } = req.body;
  const hirer = db.data.hirers.find(h => h.metamask === metamask);
  if (hirer) {
    res.status(200).json(hirer);
  } else {
    res.status(404).json({ error: 'User Not Found!' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/hirers/incoming_webhook/createHirer', async (req, res) => {
  const hirer = req.body;
  hirer._id = Date.now().toString();
  db.data.hirers.push(hirer);
  db.write();
  res.status(200).json({ insertedId: hirer._id });
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/hirers/incoming_webhook/viewHirer', async (req, res) => {
  const { hirerId } = req.body;
  const hirer = db.data.hirers.find(h => h._id === hirerId);
  if (hirer) {
    res.status(200).json(hirer);
  } else {
    res.status(404).json({ error: 'Hirer not found' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/hirers/incoming_webhook/editHirer', async (req, res) => {
  const { metamask, ...updateFields } = req.body;
  const hirer = db.data.hirers.find(h => h.metamask === metamask);
  if (hirer) {
    Object.assign(hirer, updateFields);
    db.write();
    res.status(200).json({ modifiedCount: 1 });
  } else {
    res.status(404).json({ error: 'Hirer not found' });
  }
});

// Job routes
app.get('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/viewJobs', async (req, res) => {
  const jobs = db.data.jobs.filter(j => j.gig_status === 'OPEN');
  res.status(200).json(jobs);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/createGig', async (req, res) => {
  const job = req.body;
  job._id = Date.now().toString();
  job.gig_status = 'OPEN';
  job.applicants = [];
  db.data.jobs.push(job);
  db.write();
  res.status(200).json({ insertedId: job._id });
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/jobInfo', async (req, res) => {
  const { jobId } = req.body;
  const job = db.data.jobs.find(j => j._id === jobId);
  if (job) {
    res.status(200).json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/bidJob', async (req, res) => {
  const { freelancerId, jobId } = req.body;
  const job = db.data.jobs.find(j => j._id === jobId);
  if (job && !job.applicants.includes(freelancerId)) {
    job.applicants.push(freelancerId);
    db.write();
    res.status(200).json({ modifiedCount: 1 });
  } else {
    res.status(400).json({ error: 'Job not found or already applied' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/confirmJob', async (req, res) => {
  const { jobId, freelancerId, freelancerName } = req.body;
  const job = db.data.jobs.find(j => j._id === jobId);
  if (job) {
    job.gig_status = 'ASSIGNED';
    job.assignedFreelancer = freelancerId;
    job.assignedFreelancerName = freelancerName;
    db.write();
    res.status(200).json({ modifiedCount: 1 });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/completeJob', async (req, res) => {
  const { jobId } = req.body;
  const job = db.data.jobs.find(j => j._id === jobId);
  if (job) {
    job.gig_status = 'COMPLETED';
    db.write();
    res.status(200).json({ modifiedCount: 1 });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/appliedJobs', async (req, res) => {
  const { freelancerId } = req.body;
  const jobs = db.data.jobs.filter(j => j.applicants && j.applicants.includes(freelancerId));
  res.status(200).json(jobs);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/jobsinProgress', async (req, res) => {
  const { freelancerId } = req.body;
  const jobs = db.data.jobs.filter(j => j.assignedFreelancer === freelancerId && ['ASSIGNED', 'DELIVERED'].includes(j.gig_status));
  res.status(200).json(jobs);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/completedJobs', async (req, res) => {
  const { freelancerId } = req.body;
  const jobs = db.data.jobs.filter(j => j.assignedFreelancer === freelancerId && j.gig_status === 'COMPLETED');
  res.status(200).json(jobs);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/recommendedJobs', async (req, res) => {
  const { skills } = req.body;
  const jobs = db.data.jobs.filter(j => j.gig_status === 'OPEN' && j.skills_required && j.skills_required.some(s => skills.includes(s)));
  res.status(200).json(jobs);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/hirerjobsopenforapplication', async (req, res) => {
  const { hirerId } = req.body;
  const jobs = db.data.jobs.filter(j => j.hirer === hirerId && j.gig_status === 'OPEN');
  res.status(200).json(jobs);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/hirerjobsinProgress', async (req, res) => {
  const { hirerId } = req.body;
  const jobs = db.data.jobs.filter(j => j.hirer === hirerId && ['ASSIGNED', 'DELIVERED'].includes(j.gig_status));
  res.status(200).json(jobs);
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/jobs/incoming_webhook/hirercompletedJobs', async (req, res) => {
  const { hirerId } = req.body;
  const jobs = db.data.jobs.filter(j => j.hirer === hirerId && j.gig_status === 'COMPLETED');
  res.status(200).json(jobs);
});

// Review routes
app.post('/api/client/v2.0/app/whiz-ihwsd/service/reviews/incoming_webhook/flReview', async (req, res) => {
  const { job } = req.body;
  const exists = db.data.reviews.find(r => r.job && r.job.jobID === job.jobID);
  if (!exists) {
    const review = req.body;
    review._id = Date.now().toString();
    db.data.reviews.push(review);
    db.write();
    res.status(200).json({ insertedId: review._id });
  } else {
    res.status(400).json({ error: 'Review already exists' });
  }
});

app.post('/api/client/v2.0/app/whiz-ihwsd/service/reviews/incoming_webhook/getReview', async (req, res) => {
  const { jobId } = req.body;
  const review = db.data.reviews.find(r => r.job && r.job.jobID === jobId);
  if (review) {
    res.status(200).json(review);
  } else {
    res.status(404).json({ error: 'Review not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});