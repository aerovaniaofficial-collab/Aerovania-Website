require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JOBS_FILE = path.join(__dirname, 'data', 'jobs.json');

function readJobs() {
  return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
}
function writeJobs(jobs) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}
function nextId(jobs) {
  return jobs.length ? String(Math.max(...jobs.map(j => Number(j.id))) + 1) : '1';
}

// ── Admin auth middleware ───────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
// Allow multiple origins: the frontend dev server AND the admin panel (same origin as backend)
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (same-origin, curl, Postman) or matching origins
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Multer (CV uploads — memory storage, no disk writes) ────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter(req, file, cb) {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only PDF, DOC, and DOCX files are allowed.'));
  },
});

// ── Nodemailer transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Helper: verify SMTP on startup ─────────────────────────────────────────
transporter.verify((err) => {
  if (err) console.error('SMTP connection error:', err.message);
  else console.log('SMTP ready');
});

// ── POST /api/contact ───────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { fname, lname, email, company, subject, message } = req.body;

  if (!fname || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
  }

  const html = `
    <h2 style="color:#34C0C5;font-family:sans-serif;">New Contact Form Submission</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;color:#666;width:160px">Name</td><td style="padding:8px;font-weight:600">${fname} ${lname || ''}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px;color:#666">Company</td><td style="padding:8px">${company || '—'}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Topic</td><td style="padding:8px">${subject || '—'}</td></tr>
      <tr><td style="padding:8px;color:#666;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${message}</td></tr>
    </table>
  `;

  try {
    await transporter.sendMail({
      from: `"Aerovania Website" <${process.env.SMTP_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subject || 'New enquiry'} — ${fname} ${lname || ''}`,
      html,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"Aerovania" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'We received your message — Aerovania',
      html: `
        <p style="font-family:sans-serif;font-size:15px">Hi ${fname},</p>
        <p style="font-family:sans-serif;font-size:15px">Thanks for reaching out. Our team will get back to you within one business day.</p>
        <p style="font-family:sans-serif;font-size:15px;color:#34C0C5;font-weight:600">— Team Aerovania</p>
      `,
    });

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact mail error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
  }
});

// ── POST /api/careers ───────────────────────────────────────────────────────
app.post('/api/careers', upload.single('cv'), async (req, res) => {
  const { name, email, phone, role, linkedin, cover } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, error: 'Name, email, and role are required.' });
  }

  const attachments = [];
  if (req.file) {
    attachments.push({
      filename: req.file.originalname,
      content: req.file.buffer,
      contentType: req.file.mimetype,
    });
  }

  const html = `
    <h2 style="color:#34C0C5;font-family:sans-serif;">New Job Application</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;color:#666;width:160px">Name</td><td style="padding:8px;font-weight:600">${name}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px;color:#666">Phone</td><td style="padding:8px">${phone || '—'}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Role Applied</td><td style="padding:8px;font-weight:600;color:#34C0C5">${role}</td></tr>
      <tr><td style="padding:8px;color:#666">LinkedIn</td><td style="padding:8px">${linkedin ? `<a href="${linkedin}">${linkedin}</a>` : '—'}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;vertical-align:top">Cover Note</td><td style="padding:8px;white-space:pre-wrap">${cover || '—'}</td></tr>
      <tr><td style="padding:8px;color:#666">CV Attached</td><td style="padding:8px">${req.file ? req.file.originalname : 'No file uploaded'}</td></tr>
    </table>
  `;

  try {
    await transporter.sendMail({
      from: `"Aerovania Careers" <${process.env.SMTP_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `[Application] ${role} — ${name}`,
      html,
      attachments,
    });

    // Auto-reply to applicant
    await transporter.sendMail({
      from: `"Aerovania Careers" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Application received — Aerovania',
      html: `
        <p style="font-family:sans-serif;font-size:15px">Hi ${name},</p>
        <p style="font-family:sans-serif;font-size:15px">Thanks for applying for the <strong>${role}</strong> position at Aerovania. We've received your application and will review it shortly.</p>
        <p style="font-family:sans-serif;font-size:15px">If your profile is a match, we'll reach out to schedule a conversation.</p>
        <p style="font-family:sans-serif;font-size:15px;color:#34C0C5;font-weight:600">— Team Aerovania</p>
      `,
    });

    res.json({ success: true, message: 'Application submitted successfully.' });
  } catch (err) {
    console.error('Careers mail error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit application. Please try again.' });
  }
});

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Jobs — public (careers page) ────────────────────────────────────────────
app.get('/api/jobs', (req, res) => {
  const jobs = readJobs().filter(j => j.active);
  res.json(jobs);
});

// ── Jobs — admin CRUD ────────────────────────────────────────────────────────
// GET all (including inactive)
app.get('/api/admin/jobs', adminAuth, (req, res) => {
  res.json(readJobs());
});

// POST — create
app.post('/api/admin/jobs', adminAuth, (req, res) => {
  const { title, type, location, department } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });
  const jobs = readJobs();
  const job = { id: nextId(jobs), title, type: type || 'Full-Time', location: location || '', department: department || '', active: true };
  jobs.push(job);
  writeJobs(jobs);
  res.json({ success: true, job });
});

// PUT — update
app.put('/api/admin/jobs/:id', adminAuth, (req, res) => {
  const jobs = readJobs();
  const idx = jobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Job not found.' });
  jobs[idx] = { ...jobs[idx], ...req.body, id: jobs[idx].id };
  writeJobs(jobs);
  res.json({ success: true, job: jobs[idx] });
});

// DELETE
app.delete('/api/admin/jobs/:id', adminAuth, (req, res) => {
  let jobs = readJobs();
  const exists = jobs.find(j => j.id === req.params.id);
  if (!exists) return res.status(404).json({ success: false, error: 'Job not found.' });
  jobs = jobs.filter(j => j.id !== req.params.id);
  writeJobs(jobs);
  res.json({ success: true });
});

// ── Serve admin panel ────────────────────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── Error handler for multer ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
});

app.listen(PORT, () => console.log(`Aerovania backend running on port ${PORT}`));
