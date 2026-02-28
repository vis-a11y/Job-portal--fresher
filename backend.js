const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);

// Database Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fresher_job_portal',
  waitForConnections: true,
  connectionLimit: 10
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': MIME_TYPES['.json'] });
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  return body ? JSON.parse(body) : {};
}

// 🧠 UTILITY FUNCTIONS

/**
 * Calculate Fresher Readiness Score
 * Based on: resume, skills, projects, mock interview, profile completeness
 */
async function calculateReadinessScore(studentId) {
  try {
    const conn = await pool.getConnection();
    
    // Get all score components
    const [student] = await conn.query('SELECT * FROM students WHERE id = ?', [studentId]);
    const [skillTests] = await conn.query('SELECT score FROM skill_test_attempts WHERE student_id = ? ORDER BY attempted_at DESC LIMIT 1', [studentId]);
    const [mockInterviews] = await conn.query('SELECT overall_score FROM mock_interviews WHERE student_id = ? ORDER BY completed_at DESC LIMIT 1', [studentId]);
    const [projects] = await conn.query('SELECT COUNT(*) as count FROM portfolio_projects WHERE student_id = ? AND is_verified = TRUE', [studentId]);
    
    if (!student || !student[0]) {
      conn.release();
      return 0;
    }

    let score = 0;
    
    // Resume quality (25 points)
    score += student[0].resume_url ? 25 : 0;
    
    // Profile completeness (15 points)
    const profileFields = [student[0].name, student[0].college, student[0].skills, student[0].about];
    score += Math.floor((profileFields.filter(f => f).length / profileFields.length) * 15);
    
    // Skill test score (30 points)
    if (skillTests && skillTests[0]) {
      score += Math.floor((skillTests[0].score / 100) * 30);
    }
    
    // Mock interview score (20 points)
    if (mockInterviews && mockInterviews[0]) {
      score += Math.floor((mockInterviews[0].overall_score / 100) * 20);
    }
    
    // Projects (10 points)
    if (projects && projects[0]) {
      score += Math.min(projects[0].count * 5, 10);
    }
    
    // Update student readiness score
    await conn.query('UPDATE students SET readiness_score = ? WHERE id = ?', [score, studentId]);
    
    conn.release();
    return Math.min(score, 100);
  } catch (error) {
    console.error('Error calculating readiness score:', error);
    return 0;
  }
}

/**
 * Generate Skill → Job Roadmap
 * Shows eligible jobs and missing skills
 */
function generateRoadmap(userSkills, jobs) {
  return jobs.map(job => {
    const jobSkills = (job.required_skills || '').split(',').map(s => s.trim().toLowerCase());
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    
    const missing = jobSkills.filter(skill => !userSkillsLower.includes(skill));
    const matched = jobSkills.filter(skill => userSkillsLower.includes(skill));
    const matchPercentage = Math.round((matched.length / jobSkills.length) * 100);
    
    return {
      jobId: job.id,
      jobTitle: job.job_title,
      matchPercentage,
      matched,
      missing,
      eligible: matchPercentage >= 60,
      trainingSuggested: job.training_provided
    };
  });
}

/**
 * Detect Fake Job Postings
 */
function isSuspiciousJob(job) {
  const flags = [];
  
  // Check 1: Unusually high salary without experience required
  if (job.experience_required === 0 && job.salary_range_max > 1000000) {
    flags.push('Suspicious salary for fresher role');
  }
  
  // Check 2: Too vague job description
  if (!job.role_description || job.role_description.length < 50) {
    flags.push('Insufficient job description');
  }
  
  // Check 3: Company not verified
  if (!job.recruiter_verified) {
    flags.push('Company not verified');
  }
  
  return {
    isSuspicious: flags.length > 0,
    flags,
    riskScore: Math.min(flags.length * 25, 100)
  };
}

// 🔷 API ROUTES

const routes = {
  // ============ STUDENT/FRESHER ROUTES ============
  
  'POST /api/auth/register': async (req, res) => {
    try {
      const { email, password, name, college, branch, graduation_year } = await parseBody(req);
      
      if (!email || !password || !name || !college || !graduation_year) {
        return sendJson(res, 400, { error: 'Missing required fields' });
      }
      
      const conn = await pool.getConnection();
      
      // Check if email exists
      const [existing] = await conn.query('SELECT id FROM students WHERE email = ?', [email]);
      if (existing.length > 0) {
        conn.release();
        return sendJson(res, 409, { error: 'Email already registered' });
      }
      
      // Create new student
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const [result] = await conn.query(
        'INSERT INTO students (email, password_hash, name, college, branch, graduation_year) VALUES (?, ?, ?, ?, ?, ?)',
        [email, passwordHash, name, college, branch, graduation_year]
      );
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Student registered successfully',
        studentId: result.insertId,
        student: { id: result.insertId, email, name, college }
      });
    } catch (error) {
      console.error('Registration error:', error);
      sendJson(res, 500, { error: 'Registration failed' });
    }
  },
  
  'POST /api/auth/login': async (req, res) => {
    try {
      const { email, password } = await parseBody(req);
      
      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password required' });
      }
      
      const conn = await pool.getConnection();
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      
      const [students] = await conn.query('SELECT * FROM students WHERE email = ? AND password_hash = ?', [email, passwordHash]);
      conn.release();
      
      if (students.length === 0) {
        return sendJson(res, 401, { error: 'Invalid credentials' });
      }
      
      const student = students[0];
      sendJson(res, 200, {
        message: 'Login successful',
        student: { id: student.id, email: student.email, name: student.name, readiness_score: student.readiness_score }
      });
    } catch (error) {
      console.error('Login error:', error);
      sendJson(res, 500, { error: 'Login failed' });
    }
  },
  
  'GET /api/students/:id': async (req, res) => {
    try {
      const studentId = req.url.split('/')[3];
      const conn = await pool.getConnection();
      
      const [students] = await conn.query('SELECT * FROM students WHERE id = ?', [studentId]);
      conn.release();
      
      if (students.length === 0) {
        return sendJson(res, 404, { error: 'Student not found' });
      }
      
      sendJson(res, 200, students[0]);
    } catch (error) {
      console.error('Error fetching student:', error);
      sendJson(res, 500, { error: 'Failed to fetch student' });
    }
  },
  
  'PUT /api/students/:id': async (req, res) => {
    try {
      const studentId = req.url.split('/')[3];
      const { name, skills, about, contact_number } = await parseBody(req);
      
      const conn = await pool.getConnection();
      await conn.query(
        'UPDATE students SET name = ?, skills = ?, about = ?, contact_number = ? WHERE id = ?',
        [name || null, skills || null, about || null, contact_number || null, studentId]
      );
      
      // Recalculate readiness score
      const score = await calculateReadinessScore(studentId);
      
      conn.release();
      
      sendJson(res, 200, {
        message: 'Profile updated successfully',
        readiness_score: score
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      sendJson(res, 500, { error: 'Failed to update profile' });
    }
  },
  
  'GET /api/students/:id/readiness-score': async (req, res) => {
    try {
      const studentId = req.url.split('/')[3];
      const score = await calculateReadinessScore(studentId);
      
      sendJson(res, 200, {
        studentId,
        readiness_score: score
      });
    } catch (error) {
      console.error('Error calculating score:', error);
      sendJson(res, 500, { error: 'Failed to calculate score' });
    }
  },
  
  // ============ JOB ROUTES ============
  
  'GET /api/jobs': async (req, res) => {
    try {
      const conn = await pool.getConnection();
      const [jobs] = await conn.query(
        'SELECT j.*, r.company_name, r.is_verified FROM jobs j JOIN recruiters r ON j.recruiter_id = r.id WHERE j.is_published = TRUE AND j.is_approved = TRUE AND j.is_flagged = FALSE'
      );
      
      conn.release();
      
      // Check for suspicious jobs
      const jobsWithRiskScore = jobs.map(job => ({
        ...job,
        riskAssessment: isSuspiciousJob(job)
      }));
      
      sendJson(res, 200, jobsWithRiskScore);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      sendJson(res, 500, { error: 'Failed to fetch jobs' });
    }
  },
  
  'GET /api/jobs/fresher-only': async (req, res) => {
    try {
      const conn = await pool.getConnection();
      const [jobs] = await conn.query(
        'SELECT j.*, r.company_name FROM jobs j JOIN recruiters r ON j.recruiter_id = r.id WHERE j.is_fresher_only = TRUE AND j.is_published = TRUE AND j.is_approved = TRUE'
      );
      
      conn.release();
      sendJson(res, 200, jobs);
    } catch (error) {
      console.error('Error:', error);
      sendJson(res, 500, { error: 'Failed to fetch jobs' });
    }
  },
  
  'GET /api/roadmap/:studentId': async (req, res) => {
    try {
      const studentId = req.url.split('/')[3];
      const conn = await pool.getConnection();
      
      const [student] = await conn.query('SELECT skills FROM students WHERE id = ?', [studentId]);
      const [jobs] = await conn.query('SELECT * FROM jobs WHERE is_published = TRUE AND is_fresher_only = TRUE');
      
      conn.release();
      
      if (!student || student.length === 0) {
        return sendJson(res, 404, { error: 'Student not found' });
      }
      
      const userSkills = (student[0].skills || '').split(',').map(s => s.trim());
      const roadmap = generateRoadmap(userSkills, jobs);
      
      sendJson(res, 200, {
        studentId,
        userSkills,
        roadmap,
        recommendedJobs: roadmap.filter(r => r.eligible),
        skillsToLearn: [...new Set(roadmap.flatMap(r => r.missing))]
      });
    } catch (error) {
      console.error('Error generating roadmap:', error);
      sendJson(res, 500, { error: 'Failed to generate roadmap' });
    }
  },
  
  // ============ APPLICATION ROUTES ============
  
  'POST /api/applications': async (req, res) => {
    try {
      const { student_id, job_id, pitch } = await parseBody(req);
      
      if (!student_id || !job_id) {
        return sendJson(res, 400, { error: 'Missing required fields' });
      }
      
      const conn = await pool.getConnection();
      
      // Check if already applied
      const [existing] = await conn.query(
        'SELECT id FROM applications WHERE student_id = ? AND job_id = ?',
        [student_id, job_id]
      );
      
      if (existing.length > 0) {
        conn.release();
        return sendJson(res, 409, { error: 'Already applied to this job' });
      }
      
      const [result] = await conn.query(
        'INSERT INTO applications (student_id, job_id, pitch, status) VALUES (?, ?, ?, ?)',
        [student_id, job_id, pitch || '', 'Applied']
      );
      
      // Increment application count
      await conn.query('UPDATE jobs SET applications_count = applications_count + 1 WHERE id = ?', [job_id]);
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Application submitted successfully',
        applicationId: result.insertId
      });
    } catch (error) {
      console.error('Error creating application:', error);
      sendJson(res, 500, { error: 'Failed to submit application' });
    }
  },
  
  'GET /api/applications': async (req, res) => {
    try {
      const url = new URL('http://localhost' + req.url);
      const studentId = url.searchParams.get('studentId');
      
      if (!studentId) {
        return sendJson(res, 400, { error: 'Student ID required' });
      }
      
      const conn = await pool.getConnection();
      const [applications] = await conn.query(
        'SELECT a.*, j.job_title, j.salary_range_max FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.student_id = ? ORDER BY a.applied_at DESC',
        [studentId]
      );
      
      conn.release();
      sendJson(res, 200, applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      sendJson(res, 500, { error: 'Failed to fetch applications' });
    }
  },
  
  // ============ MOCK INTERVIEW ROUTES ============
  
  'POST /api/mock-interview': async (req, res) => {
    try {
      const { student_id, job_id, confidence_score, communication_score, feedback } = await parseBody(req);
      
      const conn = await pool.getConnection();
      
      const overall_score = Math.round((confidence_score + communication_score) / 2);
      
      const [result] = await conn.query(
        'INSERT INTO mock_interviews (student_id, job_id, confidence_score, communication_score, overall_score, feedback) VALUES (?, ?, ?, ?, ?, ?)',
        [student_id, job_id, confidence_score, communication_score, overall_score, feedback]
      );
      
      // Update student mock interview score
      await conn.query('UPDATE students SET mock_interview_score = ? WHERE id = ?', [overall_score, student_id]);
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Mock interview recorded',
        interviewId: result.insertId,
        overall_score
      });
    } catch (error) {
      console.error('Error recording interview:', error);
      sendJson(res, 500, { error: 'Failed to record interview' });
    }
  },
  
  'GET /api/mock-interview/:studentId': async (req, res) => {
    try {
      const studentId = req.url.split('/')[3];
      const conn = await pool.getConnection();
      
      const [interviews] = await conn.query(
        'SELECT * FROM mock_interviews WHERE student_id = ? ORDER BY completed_at DESC',
        [studentId]
      );
      
      conn.release();
      sendJson(res, 200, interviews);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      sendJson(res, 500, { error: 'Failed to fetch interviews' });
    }
  },
  
  // ============ REJECTION FEEDBACK ROUTES ============
  
  'POST /api/rejection-feedback': async (req, res) => {
    try {
      const { application_id, recruiter_id, reason_category, custom_feedback } = await parseBody(req);
      
      const improvementTips = {
        'skill': 'Focus on learning the missing technical skills. Take online courses and practice problems.',
        'communication': 'Work on communication skills through mock interviews and public speaking practice.',
        'resume': 'Improve your resume formatting, use ATS-friendly templates, and highlight projects clearly.',
        'experience': 'Gain practical experience through internships, projects, or freelance work.'
      };
      
      const conn = await pool.getConnection();
      
      const [result] = await conn.query(
        'INSERT INTO rejection_feedback (application_id, recruiter_id, reason_category, custom_feedback, improvement_tips) VALUES (?, ?, ?, ?, ?)',
        [application_id, recruiter_id, reason_category, custom_feedback, improvementTips[reason_category] || 'Keep improving!']
      );
      
      // Update application status
      await conn.query('UPDATE applications SET status = ?, rejection_reason = ? WHERE id = ?', ['Rejected', reason_category, application_id]);
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Feedback submitted',
        feedbackId: result.insertId,
        improvementTips: improvementTips[reason_category]
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      sendJson(res, 500, { error: 'Failed to submit feedback' });
    }
  },
  
  'GET /api/rejection-feedback/:applicationId': async (req, res) => {
    try {
      const applicationId = req.url.split('/')[3];
      const conn = await pool.getConnection();
      
      const [feedback] = await conn.query(
        'SELECT * FROM rejection_feedback WHERE application_id = ?',
        [applicationId]
      );
      
      conn.release();
      sendJson(res, 200, feedback[0] || {});
    } catch (error) {
      console.error('Error fetching feedback:', error);
      sendJson(res, 500, { error: 'Failed to fetch feedback' });
    }
  },
  
  // ============ JOB REPORTING (FAKE DETECTION) ROUTES ============
  
  'POST /api/report-job': async (req, res) => {
    try {
      const { job_id, reported_by, report_reason, report_details } = await parseBody(req);
      
      const conn = await pool.getConnection();
      
      const [result] = await conn.query(
        'INSERT INTO job_reports (job_id, reported_by, report_reason, report_details) VALUES (?, ?, ?, ?)',
        [job_id, reported_by, report_reason, report_details]
      );
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Job reported successfully',
        reportId: result.insertId
      });
    } catch (error) {
      console.error('Error reporting job:', error);
      sendJson(res, 500, { error: 'Failed to report job' });
    }
  },
  
  // ============ RECRUITER ROUTES ============
  
  'POST /api/recruiters/register': async (req, res) => {
    try {
      const { company_name, company_email, password, contact_person, contact_number, industry_type } = await parseBody(req);
      
      const conn = await pool.getConnection();
      
      const [existing] = await conn.query('SELECT id FROM recruiters WHERE company_email = ?', [company_email]);
      if (existing.length > 0) {
        conn.release();
        return sendJson(res, 409, { error: 'Company already registered' });
      }
      
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const [result] = await conn.query(
        'INSERT INTO recruiters (company_name, company_email, password_hash, contact_person, contact_number, industry_type) VALUES (?, ?, ?, ?, ?, ?)',
        [company_name, company_email, passwordHash, contact_person, contact_number, industry_type]
      );
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Company registered successfully',
        recruiterId: result.insertId
      });
    } catch (error) {
      console.error('Registration error:', error);
      sendJson(res, 500, { error: 'Registration failed' });
    }
  },
  
  'POST /api/recruiters/post-job': async (req, res) => {
    try {
      const { recruiter_id, job_title, role_description, required_skills, salary_range_min, salary_range_max, training_provided } = await parseBody(req);
      
      const conn = await pool.getConnection();
      
      const [result] = await conn.query(
        'INSERT INTO jobs (recruiter_id, job_title, role_description, required_skills, salary_range_min, salary_range_max, training_provided, is_fresher_only) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
        [recruiter_id, job_title, role_description, required_skills, salary_range_min, salary_range_max, training_provided ? 1 : 0]
      );
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Job posted successfully (pending admin approval)',
        jobId: result.insertId
      });
    } catch (error) {
      console.error('Error posting job:', error);
      sendJson(res, 500, { error: 'Failed to post job' });
    }
  },
  
  // ============ PORTFOLIO ROUTES ============
  
  'POST /api/portfolio': async (req, res) => {
    try {
      const { student_id, project_name, project_description, tech_stack, github_url } = await parseBody(req);
      
      const conn = await pool.getConnection();
      
      const [result] = await conn.query(
        'INSERT INTO portfolio_projects (student_id, project_name, project_description, tech_stack, github_url, is_verified) VALUES (?, ?, ?, ?, ?, TRUE)',
        [student_id, project_name, project_description, tech_stack, github_url]
      );
      
      conn.release();
      
      sendJson(res, 201, {
        message: 'Project added to portfolio',
        projectId: result.insertId
      });
    } catch (error) {
      console.error('Error adding project:', error);
      sendJson(res, 500, { error: 'Failed to add project' });
    }
  },
  
  'GET /api/portfolio/:studentId': async (req, res) => {
    try {
      const studentId = req.url.split('/')[3];
      const conn = await pool.getConnection();
      
      const [projects] = await conn.query(
        'SELECT * FROM portfolio_projects WHERE student_id = ? AND is_verified = TRUE',
        [studentId]
      );
      
      conn.release();
      sendJson(res, 200, projects);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      sendJson(res, 500, { error: 'Failed to fetch portfolio' });
    }
  }
};

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL('http://localhost' + req.url);
  const pathname = url.pathname + (url.search || '');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  
  // Serve static files
  if (pathname.startsWith('/assets/') || !pathname.includes('/api/')) {
    const filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    try {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
      res.end(content);
      return;
    } catch {
      if (pathname === '/' || pathname === '') {
        const content = fs.readFileSync(path.join(__dirname, 'index.html'));
        res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
        res.end(content);
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
  }
  
  // API route handling
  const routeKey = `${req.method} ${url.pathname}`;
  const route = Object.keys(routes).find(key => {
    const pattern = key.replace(/:\w+/g, '[^/]+');
    return new RegExp(`^${pattern}$`).test(routeKey);
  });
  
  if (route && routes[route]) {
    try {
      await routes[route](req, res);
    } catch (error) {
      console.error('Route error:', error);
      sendJson(res, 500, { error: 'Internal server error' });
    }
  } else {
    sendJson(res, 404, { error: 'Route not found' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 FresherJob Portal Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: fresher_job_portal`);
  console.log(`✅ All API endpoints ready`);
});
