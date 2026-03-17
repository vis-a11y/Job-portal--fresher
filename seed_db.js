const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fresher_job_portal',
  waitForConnections: true,
  connectionLimit: 10
});

async function seed() {
  try {
    console.log('🚀 Seeding database...');

    const hashedCandidatePass = await bcrypt.hash('fresher123', 10);
    const hashedRecruiterPass = await bcrypt.hash('recruiter123', 10);
    const hashedAdminPass = await bcrypt.hash('admin123', 10);

    // 1. CLEAR TABLES
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE applications');
    await pool.query('TRUNCATE TABLE projects');
    await pool.query('TRUNCATE TABLE skills');
    await pool.query('TRUNCATE TABLE jobs');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. CREATE USERS
    const [candidateResult] = await pool.query(
      'INSERT INTO users (name, email, password, role, college, branch, graduation_year, about, readiness_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['Amit Kumar', 'amit@example.com', hashedCandidatePass, 'fresher', 'IIT Bombay', 'Computer Science', 2025, 'Passionate about Web Development and AI.', 0]
    );

    const [recruiterResult] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Rahul HR', 'hr@google.com', hashedRecruiterPass, 'recruiter']
    );

    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin Master', 'admin@fresherjob.com', hashedAdminPass, 'admin']
    );

    const recruiterId = recruiterResult.insertId;
    const candidateId = candidateResult.insertId;

    // 3. ADD CANDIDATE SKILLS
    await pool.query('INSERT INTO skills (user_id, skill_name, proficiency) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)', [
      candidateId, 'JavaScript', 'Advanced',
      candidateId, 'Node.js', 'Intermediate',
      candidateId, 'React', 'Intermediate'
    ]);

    // 4. ADD JOBS
    const jobs = [
      ['Frontend Developer (React)', 'Google', 'Build world-class interfaces using React and Tailwind.', 'React, JavaScript, CSS, HTML', 'Full-Time', 800000, 1500000, 'Bangalore'],
      ['Backend Engineer', 'Amazon', 'Design scalable microservices with Node.js and SQL.', 'Node.js, SQL, AWS, Python', 'Full-Time', 1000000, 1800000, 'Hyderabad'],
      ['Intern - MERN Stack', 'StartUp X', 'Looking for enthusiastic freshers to work on our core product.', 'React, Node.js, Express, MongoDB', 'Internship', 15000, 30000, 'Remote'],
      ['Data Science Intern', 'Microsoft', 'Focus on data cleaning and analysis using Python and SQL.', 'Python, SQL, R, Pandas', 'Internship', 40000, 60000, 'Pune']
    ];

    for (const job of jobs) {
      await pool.query(
        'INSERT INTO jobs (recruiter_id, title, company, description, skills_required, job_type, salary_range_min, salary_range_max, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [recruiterId, ...job]
      );
    }

    // 5. ADD PROJECTS FOR CANDIDATE
    await pool.query(
      'INSERT INTO projects (user_id, project_name, description, tech_stack, project_link) VALUES (?, ?, ?, ?, ?)',
      [candidateId, 'Portfolio Site', 'Personal portfolio built using React and Glassmorphism.', 'React, CSS', 'https://github.com/amit/portfolio']
    );

    console.log('✅ Seeding complete!');
    console.log('--- TEST ACCOUNTS ---');
    console.log('Candidate: amit@example.com / fresher123');
    console.log('Recruiter: hr@google.com / recruiter123');
    console.log('Admin: admin@fresherjob.com / admin123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
