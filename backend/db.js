const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'Full-Time',
      location TEXT DEFAULT '',
      department TEXT DEFAULT '',
      description TEXT DEFAULT '',
      active BOOLEAN DEFAULT true
    );
  `);
  // Add description column if it doesn't exist yet (safe migration)
  await pool.query(`
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
  `);
}

async function getAllJobs() {
  const { rows } = await pool.query('SELECT * FROM jobs ORDER BY id ASC');
  return rows;
}

async function getActiveJobs() {
  const { rows } = await pool.query('SELECT * FROM jobs WHERE active = true ORDER BY id ASC');
  return rows;
}

async function createJob({ title, type, location, department, description }) {
  const { rows } = await pool.query(
    `INSERT INTO jobs (title, type, location, department, description, active)
     VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
    [title, type || 'Full-Time', location || '', department || '', description || '']
  );
  return rows[0];
}

async function updateJob(id, fields) {
  const existing = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (existing.rows.length === 0) return null;

  const current = existing.rows[0];
  const merged = { ...current, ...fields };

  const { rows } = await pool.query(
    `UPDATE jobs SET title=$1, type=$2, location=$3, department=$4, description=$5, active=$6
     WHERE id=$7 RETURNING *`,
    [merged.title, merged.type, merged.location, merged.department, merged.description ?? '', merged.active, id]
  );
  return rows[0];
}

async function deleteJob(id) {
  const { rowCount } = await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { pool, initSchema, getAllJobs, getActiveJobs, createJob, updateJob, deleteJob };
