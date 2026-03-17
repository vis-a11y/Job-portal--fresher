const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fresher_portal_super_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files excluding any route that starts with /api
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  express.static(path.join(__dirname))(req, res, next);
});

// Database Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fresher_job_portal',
  waitForConnections: true,
  connectionLimit: 10
});

// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, college, branch, graduation_year } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    // Handle optional fields empty strings
    const dbCollege = college || null;
    const dbBranch = branch || null;
    const dbYear = graduation_year && graduation_year !== "" ? parseInt(graduation_year) : null;
    const dbRole = role || 'fresher';

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, college, branch, graduation_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, dbRole, dbCollege, dbBranch, dbYear]
    );

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server could not complete registration. Check DB connection.' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- USER ROUTES ---

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, college, branch, graduation_year, about, readiness_score FROM users WHERE id = ?', [req.user.id]);
    const [userSkills] = await pool.query('SELECT skill_name, proficiency FROM skills WHERE user_id = ?', [req.user.id]);
    const [userProjects] = await pool.query('SELECT * FROM projects WHERE user_id = ?', [req.user.id]);
    
    res.json({ ...users[0], skills: userSkills, projects: userProjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user applications
app.get('/api/user/applications', authenticateToken, async (req, res) => {
  try {
    const [apps] = await pool.query(`
      SELECT a.id, a.status, a.applied_at, a.pitch, j.title, j.company, j.location, j.job_type
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.user_id = ?
      ORDER BY a.applied_at DESC
    `, [req.user.id]);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/skills', authenticateToken, async (req, res) => {
  try {
    const { skill_name, proficiency } = req.body;
    await pool.query('INSERT INTO skills (user_id, skill_name, proficiency) VALUES (?, ?, ?)', [req.user.id, skill_name, proficiency]);
    res.status(201).json({ message: 'Skill added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/projects', authenticateToken, async (req, res) => {
  try {
    const { project_name, project_link, description, tech_stack } = req.body;
    await pool.query('INSERT INTO projects (user_id, project_name, project_link, description, tech_stack) VALUES (?, ?, ?, ?, ?)', 
      [req.user.id, project_name, project_link, description, tech_stack]);
    res.status(201).json({ message: 'Project added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- JOB ROUTES ---

app.get('/api/jobs', async (req, res) => {
  try {
    const { skill, role, company } = req.query;
    let query = 'SELECT * FROM jobs';
    const params = [];

    if (skill || role || company) {
      query += ' WHERE';
      const conditions = [];
      if (skill) { conditions.push(' skills_required LIKE ?'); params.push(`%${skill}%`); }
      if (role) { conditions.push(' title LIKE ?'); params.push(`%${role}%`); }
      if (company) { conditions.push(' company LIKE ?'); params.push(`%${company}%`); }
      query += conditions.join(' AND');
    }

    const [jobs] = await pool.query(query, params);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', authenticateToken, async (req, res) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only recruiters can post jobs' });
  }
  try {
    const { title, company, description, skills_required, job_type, salary_range_min, salary_range_max, location } = req.body;
    const [result] = await pool.query(
      'INSERT INTO jobs (recruiter_id, title, company, description, skills_required, job_type, salary_range_min, salary_range_max, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, company, description, skills_required, job_type, salary_range_min, salary_range_max, location]
    );
    res.status(201).json({ message: 'Job posted successfully', jobId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs/apply', authenticateToken, async (req, res) => {
  try {
    const { job_id, pitch } = req.body;
    const [existing] = await pool.query('SELECT id FROM applications WHERE user_id = ? AND job_id = ?', [req.user.id, job_id]);
    if (existing.length > 0) return res.status(400).json({ error: 'Already applied' });

    await pool.query('INSERT INTO applications (user_id, job_id, pitch) VALUES (?, ?, ?)', [req.user.id, job_id, pitch]);
    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RECRUITER SPECIFIC ENDPOINTS ---

// Get all applications for a specific job (Recruiter view)
app.get('/api/recruiter/applications/:jobId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  try {
    const { jobId } = req.params;
    const [apps] = await pool.query(`
      SELECT a.id, a.status, a.pitch, a.applied_at, u.name, u.email, u.college, u.readiness_score 
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.job_id = ?
      ORDER BY u.readiness_score DESC
    `, [jobId]);
    
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
app.patch('/api/applications/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- UNIQUE AI FEATURES (INNOVATION) ---

// 1. Skill Gap Analyzer API
app.post('/api/analyze-skill-gap', authenticateToken, async (req, res) => {
  try {
    const { job_id } = req.body;
    const [jobs] = await pool.query('SELECT skills_required FROM jobs WHERE id = ?', [job_id]);
    if (jobs.length === 0) return res.status(404).json({ error: 'Job not found' });

    const [userSkills] = await pool.query('SELECT skill_name FROM skills WHERE user_id = ?', [req.user.id]);
    const jobSkills = jobs[0].skills_required.split(',').map(s => s.trim().toLowerCase());
    const mySkills = userSkills.map(s => s.skill_name.toLowerCase());

    const missingSkills = jobSkills.filter(skill => !mySkills.includes(skill));
    res.json({ missingSkills });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Job Matching API
app.post('/api/job-match', authenticateToken, async (req, res) => {
  try {
    const [userSkills] = await pool.query('SELECT skill_name FROM skills WHERE user_id = ?', [req.user.id]);
    const mySkills = userSkills.map(s => s.skill_name.toLowerCase());

    const [jobs] = await pool.query('SELECT * FROM jobs');
    
    const matchedJobs = jobs.map(job => {
      const jobSkills = job.skills_required.split(',').map(s => s.trim().toLowerCase());
      const matched = jobSkills.filter(skill => mySkills.includes(skill));
      const percentage = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 0;
      
      return { ...job, matchPercentage: percentage };
    }).filter(j => j.matchPercentage > 20).sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json(matchedJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Fresher Potential Score API
app.get('/api/potential-score', authenticateToken, async (req, res) => {
  try {
    const [userData] = await pool.query('SELECT college, graduation_year FROM users WHERE id = ?', [req.user.id]);
    const [userSkills] = await pool.query('SELECT id FROM skills WHERE user_id = ?', [req.user.id]);
    const [userProjects] = await pool.query('SELECT id FROM projects WHERE user_id = ?', [req.user.id]);

    // Logic: Skills (40%), Projects (30%), Education (30%)
    let skillScore = Math.min((userSkills.length / 5) * 40, 40);
    let projectScore = Math.min((userProjects.length / 3) * 30, 30);
    let educationScore = userData[0].college ? 30 : 10;

    const totalScore = Math.round(skillScore + projectScore + educationScore);
    
    await pool.query('UPDATE users SET readiness_score = ? WHERE id = ?', [totalScore, req.user.id]);
    res.json({ potentialScore: totalScore, breakdown: { skills: skillScore, projects: projectScore, education: educationScore } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Career Recommendation API
app.get('/api/recommend-career', authenticateToken, async (req, res) => {
  try {
    const [userSkills] = await pool.query('SELECT skill_name FROM skills WHERE user_id = ?', [req.user.id]);
    const mySkills = userSkills.map(s => s.skill_name.toLowerCase());

    const recommendations = [];
    if (mySkills.includes('javascript') || mySkills.includes('react')) recommendations.push('Frontend Developer');
    if (mySkills.includes('node.js') || mySkills.includes('python')) recommendations.push('Backend Developer');
    if (mySkills.includes('sql') || mySkills.includes('mongodb')) recommendations.push('Database Administrator');
    if (recommendations.length === 0) recommendations.push('Junior Software Engineer');

    res.json({ recommendedRoles: recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve Frontend Catch-all (Express 5 compatible)
app.get('/*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Database Connection Test and Start
async function startServer() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL Database.');
    conn.release();
    
    app.listen(PORT, () => {
      console.log(`🚀 Master Fresher Portal running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:');
    console.error(`Reason: ${err.message}`);
    console.log('\n💡 Tip: Check your DB_USER and DB_PASSWORD in the .env file.');
    process.exit(1);
  }
}

startServer();

