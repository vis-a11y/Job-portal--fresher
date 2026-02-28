# 🚀 FresherJob Portal - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Database Setup (2 minutes)
```bash
# Open MySQL
mysql -u root -p

# Run the schema file
source db/schema.sql;

# Verify tables created
USE fresher_job_portal;
SHOW TABLES;
```

### Step 2: Install Dependencies (1 minute)
```bash
npm install
```

### Step 3: Start Backend (30 seconds)
```bash
npm start
```
You should see:
```
🚀 FresherJob Portal Backend running on http://localhost:3000
📊 Database: fresher_job_portal
✅ All API endpoints ready
```

### Step 4: Open Portal (30 seconds)
```
Visit: http://localhost:3000/login.html
```
You can also go to `register.html` to create an account. After logging in you will be redirected to the dashboard.

---

## 🎓 First-Time User Guide

### For a Fresher:

1. **Dashboard** - See your readiness score (starts at 0)

2. **Profile** - Click on Profile tab
   - Fill name, college, graduation year
   - Add skills: "JavaScript, React, Node.js"
   - Write about yourself
   - Click "Save Profile" ✓

3. **Jobs** - Click on Jobs tab
   - See all fresher-only job listings
   - Notice "Match: XX%" for each role
   - Click "Apply Now" to apply ✓

4. **Roadmap** - Click on Roadmap tab
   - See your skills analyzed
   - Get recommended jobs
   - See skills to learn ✓

5. **Mock Interview** - Click Mock Interview tab
   - Select interview type
   - Click "Start Interview"
   - Answer questions
   - Get score ✓

6. **Portfolio** - Click Portfolio tab
   - Add a project
   - Provide GitHub link
   - Click "Add to Portfolio" ✓

7. **Applications** - Click Applications tab
   - See all your applications
   - Check status
   - View feedback if rejected ✓

---

## 🏢 Recruiter Setup

### Register as Recruiter:

1. Send POST request to `/api/recruiters/register`
```bash
curl -X POST http://localhost:3000/api/recruiters/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Tech Company XYZ",
    "company_email": "hr@techxyz.com",
    "password": "password123",
    "contact_person": "HR Manager",
    "contact_number": "+91 98765 43210",
    "industry_type": "IT Services"
  }'
```

### Post a Job:

```bash
curl -X POST http://localhost:3000/api/recruiters/post-job \
  -H "Content-Type: application/json" \
  -d '{
    "recruiter_id": 1,
    "job_title": "Junior Web Developer",
    "role_description": "Build web applications with modern tech stack",
    "required_skills": "JavaScript, React, Node.js",
    "salary_range_min": 300000,
    "salary_range_max": 500000,
    "training_provided": true
  }'
```

---

## 📊 Testing Endpoints (Postman Collection)

### 1. Register Student
```
POST /api/auth/register
{
  "email": "student@college.com",
  "password": "pass123",
  "name": "John Doe",
  "college": "XYZ University",
  "branch": "CSE",
  "graduation_year": 2025
}
```

### 2. Login Student
```
POST /api/auth/login
{
  "email": "student@college.com",
  "password": "pass123"
}
```

### 3. Get Student Profile
```
GET /api/students/1
```

### 4. Update Profile
```
PUT /api/students/1
{
  "name": "John Doe",
  "skills": "JavaScript, React, MongoDB",
  "about": "Aspiring web developer",
  "contact_number": "+91 90000 00000"
}
```

### 5. Get Readiness Score
```
GET /api/students/1/readiness-score
```

### 6. Get Jobs
```
GET /api/jobs/fresher-only
```

### 7. Get Roadmap
```
GET /api/roadmap/1
```

### 8. Apply for Job
```
POST /api/applications
{
  "student_id": 1,
  "job_id": 1,
  "pitch": "I'm very interested in this role and believe I'm a great fit."
}
```

### 9. Get Applications
```
GET /api/applications?studentId=1
```

### 10. Add Portfolio Project
```
POST /api/portfolio
{
  "student_id": 1,
  "project_name": "Todo App",
  "project_description": "A full-stack todo application",
  "tech_stack": "React, Node.js, MongoDB",
  "github_url": "https://github.com/user/todo-app"
}
```

### 11. Get Portfolio
```
GET /api/portfolio/1
```

### 12. Record Mock Interview
```
POST /api/mock-interview
{
  "student_id": 1,
  "job_id": 1,
  "confidence_score": 75,
  "communication_score": 80,
  "feedback": "Good technical knowledge, needs to improve communication"
}
```

---

## 🎨 Frontend Features at a Glance

| Feature | URL | Status |
|---------|-----|--------|
| Dashboard | `#dashboard` | ✅ |
| Profile | `#profile` | ✅ |
| Jobs | `#jobs` | ✅ |
| Roadmap | `#roadmap` | ✅ |
| Mock Interview | `#interview` | ✅ |
| Portfolio | `#portfolio` | ✅ |
| Applications | `#applications` | ✅ |

---

## 🔑 Key Credentials for Testing

### Admin Access
```
Username: admin
Password: admin123
```

### Sample Student
```
Email: fresher@college.com
Password: fresher123
Skills: JavaScript, React, Node.js, SQL
```

### Sample Company
```
Email: company@techcorp.com
Password: company123
Company: TechCorp Solutions
```

---

## 🐛 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| "Database connection failed" | Check MySQL is running: `mysql -u root -p` |
| "Cannot find jobs" | Ensure jobs table has data (run INSERT statements) |
| "API returns 404" | Check backend.js is running on port 3000 |
| "Styles not loading" | Clear cache (Ctrl+Shift+Delete) and hard refresh (Ctrl+F5) |
| "Profile not saving" | Fill all required fields and try again |

---

## 📝 Testing Workflow

### Full User Journey:
1. Open http://localhost:3000
2. See Dashboard
3. Go to Profile → Fill & Save
4. Go to Jobs → View & Apply
5. Go to Roadmap → See recommendations
6. Go to Mock Interview → Practice
7. Go to Portfolio → Add projects
8. Go to Applications → Track status

---

## 🚀 Production Deployment Checklist

- [ ] MySQL database backed up
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] CORS configured for allowed domains
- [ ] Rate limiting implemented
- [ ] Error logging enabled
- [ ] Database indexed for performance
- [ ] API documentation generated
- [ ] User acceptance testing completed
- [ ] Backup & recovery plan ready

---

## 📞 Help & Support

### Check Logs:
```bash
# View backend logs
node backend.js

# Check database
mysql -u root -p
USE fresher_job_portal;
SELECT * FROM students;
```

### Reset Database:
```bash
mysql -u root -p < db/schema.sql
```

### Restart Services:
```bash
# Stop current server (Ctrl+C)
# Clear port 3000
lsof -i :3000
kill -9 <PID>

# Start fresh
npm start
```

---

## 🎉 You're All Set!

Your FresherJob Portal is now ready to use! 

**Next Steps:**
1. Create student profiles
2. Post jobs as recruiter
3. Apply to jobs
4. Take skill tests
5. Practice mock interviews
6. Build portfolio

Enjoy! 🚀

---

## 📱 API Response Examples

### Success Response:
```json
{
  "message": "Profile updated successfully",
  "readiness_score": 45
}
```

### Error Response:
```json
{
  "error": "Email already registered"
}
```

### Job List Response:
```json
[
  {
    "id": 1,
    "job_title": "Junior Developer",
    "company_name": "TechCorp",
    "required_skills": "JavaScript, React",
    "salary_range_max": 500000
  }
]
```

---

Built to empower freshers! 💪
