require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
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

// ── Multer ──────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only PDF, DOC, and DOCX files are allowed.'));
  },
});

// ── Nodemailer ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) console.error('SMTP connection error:', err.message);
  else console.log('SMTP ready');
});

// ── Admin auth ──────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

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

// ── GET /api/jobs — public ──────────────────────────────────────────────────
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await db.getActiveJobs();
    res.json(jobs);
  } catch (err) {
    console.error('GET /api/jobs error:', err.message);
    res.status(500).json({ error: 'Failed to load jobs.' });
  }
});

// ── GET /api/admin/jobs — all jobs ─────────────────────────────────────────
app.get('/api/admin/jobs', adminAuth, async (req, res) => {
  try {
    const jobs = await db.getAllJobs();
    res.json(jobs);
  } catch (err) {
    console.error('GET /api/admin/jobs error:', err.message);
    res.status(500).json({ error: 'Failed to load jobs.' });
  }
});

// ── POST /api/admin/jobs — create ──────────────────────────────────────────
app.post('/api/admin/jobs', adminAuth, async (req, res) => {
  const { title, type, location, department, description } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });
  try {
    const job = await db.createJob({ title, type, location, department, description });
    res.json({ success: true, job });
  } catch (err) {
    console.error('POST /api/admin/jobs error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create job.' });
  }
});

// ── PUT /api/admin/jobs/:id — update ───────────────────────────────────────
app.put('/api/admin/jobs/:id', adminAuth, async (req, res) => {
  try {
    const job = await db.updateJob(req.params.id, req.body);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found.' });
    res.json({ success: true, job });
  } catch (err) {
    console.error('PUT /api/admin/jobs error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update job.' });
  }
});

// ── DELETE /api/admin/jobs/:id ─────────────────────────────────────────────
app.delete('/api/admin/jobs/:id', adminAuth, async (req, res) => {
  try {
    const deleted = await db.deleteJob(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Job not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/jobs error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete job.' });
  }
});

// ── Serve admin panel ───────────────────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── Multer error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
});

// ── Start + init DB schema ──────────────────────────────────────────────────
db.initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Aerovania backend running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB init failed:', err.message);
    process.exit(1);
  });
