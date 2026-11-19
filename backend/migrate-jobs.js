require('dotenv').config();
const { pool, initSchema } = require('./db');

const seedJobs = [
  {
    title: 'AI / Computer Vision Engineer',
    type: 'Full-Time',
    location: 'Nagpur / Hybrid',
    department: 'Engineering',
    description: '<h2>Role &amp; Responsibilities</h2><ul><li>Build and deploy AI/ML models for real-time aerial image analysis</li><li>Work on object detection, segmentation, and classification pipelines</li><li>Integrate models into our drone intelligence stack</li></ul><h2>Required Skills</h2><ul><li>Python, PyTorch / TensorFlow, OpenCV</li><li>Experience with YOLO, detectron2, or similar frameworks</li><li>Understanding of edge inference and model optimization</li></ul>',
    active: true,
  },
  {
    title: 'Drone Systems Engineer (Hardware)',
    type: 'Full-Time',
    location: 'Nagpur',
    department: 'Hardware',
    description: '<h2>Role &amp; Responsibilities</h2><ul><li>Design, build, and test UAV platforms including airframes and propulsion systems</li><li>Collaborate with embedded and software teams</li><li>Deliver reliable drone systems for industrial survey applications</li></ul><h2>Required Skills</h2><ul><li>UAV design and flight dynamics</li><li>Experience with flight controllers (Pixhawk, ArduPilot)</li><li>Mechanical or aerospace engineering background</li></ul>',
    active: true,
  },
  {
    title: 'GIS & Geospatial Analyst',
    type: 'Full-Time',
    location: 'Nagpur / Remote',
    department: 'Geospatial',
    description: '<h2>Role &amp; Responsibilities</h2><ul><li>Process LiDAR point clouds, orthomosaics, and satellite imagery</li><li>Deliver actionable geospatial intelligence for clients</li><li>Support senior engineers in project execution</li></ul><h2>Required Skills</h2><ul><li>QGIS, ArcGIS, or Global Mapper</li><li>Photogrammetry software (Pix4D, Agisoft Metashape)</li><li>GIS &amp; Remote Sensing fundamentals</li></ul>',
    active: true,
  },
  {
    title: 'Embedded Systems Developer',
    type: 'Full-Time',
    location: 'Nagpur',
    department: 'Embedded',
    description: '<h2>Role &amp; Responsibilities</h2><ul><li>Develop low-latency firmware for onboard drone processors</li><li>Enable real-time AI inference at sub-200ms speeds</li><li>Work with custom hardware interfaces</li></ul><h2>Required Skills</h2><ul><li>C/C++, ROS</li><li>RTOS and bare-metal firmware experience</li><li>Knowledge of communication protocols (UART, SPI, I2C, CAN)</li></ul>',
    active: true,
  },
  {
    title: 'Business Development Manager',
    type: 'Full-Time',
    location: 'Pan-India',
    department: 'Sales',
    description: '<h2>Role &amp; Responsibilities</h2><ul><li>Drive revenue growth in mining, railways, highways, and energy sectors</li><li>Manage full sales cycle from prospecting to contract closure</li><li>Conduct product demos and technical presentations</li></ul><h2>Required Skills</h2><ul><li>B2B enterprise sales experience</li><li>Understanding of drone survey or geospatial solutions</li><li>Strong communication and negotiation skills</li></ul>',
    active: true,
  },
];

async function run() {
  await initSchema();

  // Clear existing jobs to avoid duplicates on re-run
  await pool.query('DELETE FROM jobs');
  console.log('Cleared existing jobs.');

  for (const job of seedJobs) {
    await pool.query(
      `INSERT INTO jobs (title, type, location, department, description, active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [job.title, job.type, job.location, job.department, job.description, job.active]
    );
    console.log(`Inserted: ${job.title}`);
  }

  console.log('Migration complete.');
  await pool.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
