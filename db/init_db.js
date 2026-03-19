const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

async function init() {
  let connection;
  try {
    console.log('🚀 Connecting to MySQL...');
    connection = await mysql.createConnection(dbConfig);

    console.log('📦 Creating database if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS fresher_job_portal');
    await connection.query('USE fresher_job_portal');

    console.log('📜 Executing schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    
    for (let statement of statements) {
      await connection.query(statement);
    }

    console.log('🌱 Seeding database with freshers, recruiters, and jobs...');
    const hashedCandidatePass = await bcrypt.hash('fresher123', 10);
    const hashedRecruiterPass = await bcrypt.hash('recruiter123', 10);
    const hashedAdminPass = await bcrypt.hash('admin123', 10);

    // Clear existing data for fresh seed
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE applications');
    await connection.query('TRUNCATE TABLE projects');
    await connection.query('TRUNCATE TABLE skills');
    await connection.query('TRUNCATE TABLE jobs');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create Candidate
    const [candidateResult] = await connection.query(
      'INSERT INTO users (name, email, password, role, college, branch, graduation_year, about) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Amit Kumar', 'amit@example.com', hashedCandidatePass, 'fresher', 'IIT Bombay', 'Computer Science', 2025, 'Passionate about Web Development and AI.']
    );

    // Create Recruiter
    const [recruiterResult] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Rahul HR', 'hr@google.com', hashedRecruiterPass, 'recruiter']
    );

    // Create Admin
    await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin Master', 'admin@fresherjob.com', hashedAdminPass, 'admin']
    );

    const recruiterId = recruiterResult.insertId;
    const candidateId = candidateResult.insertId;

    // Add Skills
    const skills = [
      [candidateId, 'JavaScript', 'Expert'],
      [candidateId, 'Node.js', 'Intermediate'],
      [candidateId, 'React', 'Intermediate'],
      [candidateId, 'SQL', 'Beginner']
    ];
    for (const skill of skills) {
      await connection.query('INSERT INTO skills (user_id, skill_name, proficiency) VALUES (?, ?, ?)', skill);
    }

    // Add Jobs
    const jobs = [
      [recruiterId, 'Frontend Developer (React)', 'Google', 'Build world-class interfaces using React and Tailwind.', 'React, JavaScript, CSS, HTML', 'Full-Time', 800000, 1500000, 'Bangalore'],
      [recruiterId, 'Backend Engineer', 'Amazon', 'Design scalable microservices with Node.js and SQL.', 'Node.js, SQL, AWS, Python', 'Full-Time', 1000000, 1800000, 'Hyderabad'],
      [recruiterId, 'Full Stack Intern', 'Zomato', 'Help us build the future of food delivery.', 'Node.js, React, Express, MongoDB', 'Internship', 25000, 45000, 'Remote'],
      [recruiterId, 'Junior PythonDev', 'Microsoft', 'Focus on automation and scripting.', 'Python, Git, Linux', 'Full-Time', 700000, 1200000, 'Pune']
    ];

    for (const job of jobs) {
      await connection.query(
        'INSERT INTO jobs (recruiter_id, title, company, description, skills_required, job_type, salary_range_min, salary_range_max, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        job
      );
    }

    console.log('✅ Initialization complete!');
    console.log('--- TEST ACCOUNTS ---');
    console.log('Candidate: amit@example.com / fresher123');
    console.log('Recruiter: hr@google.com / recruiter123');
    console.log('Admin: admin@fresherjob.com / admin123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Initialization failed:', err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

init();
