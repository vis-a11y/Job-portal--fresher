# 🚀 Premium FresherJob Portal - Quick Start

Welcome to the **Master Version** of the Fresher Job Portal. This version includes a unified authentication system, AI-driven skill analysis, and a premium dark-mode UI.

## ⚡ Setup Instructions

### 1. Database Initialization
Ensure you have **MySQL** installed and running on your system.

```bash
# Initialize database with schema and sample seed data
node db/init_db.js
```
*Note: If connection fails, check your credentials in the `.env` file.*

### 2. Environment Configuration
Create a `.env` file in the root directory (one is already provided for local dev):
```env
PORT=3000
JWT_SECRET=fresher_portal_master_key_2026
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=fresher_job_portal
```

### 3. Install & Start
```bash
# Install dependencies
npm install

# Start the Master Ecosystem
npm start
```

---

## 🎭 Test Accounts

Use these pre-seeded accounts to explore the portal features immediately:

| Role | Email | Password | Features to Test |
|------|-------|----------|-------------------|
| **Candidate** | `amit@example.com` | `fresher123` | AI Match, Skill Gap, Portfolio, Mock Interview |
| **Recruiter** | `hr@google.com` | `recruiter123` | Post Jobs, Manage Listings, View Applicants |
| **Admin** | `admin@fresherjob.com` | `admin123` | System Overview, Platform Integrity |

---

## 🌟 Key Innovations inside

1. **AI Potential Score:** A dynamic metric (0-100) calculated based on verified skills, projects, and education.
2. **Skill Gap Analyzer:** Compares your profile against specific job requirements and suggests missing skills.
3. **Smart Job Matching:** Filters and ranks jobs based on a compatibility percentage using your tech stack.
4. **Interactive Interview Lab:** Adaptive mock sessions with real-time scoring to boost confidence.
5. **Verified Showcase:** A project portfolio system that recruiters can trust.

---

## 🛠️ API Architecture

- **Auth:** `/api/auth/register`, `/api/auth/login`
- **User:** `/api/user/profile`, `/api/user/skills`, `/api/user/projects`, `/api/user/applications`
- **Jobs:** `/api/jobs` (GET/POST), `/api/jobs/apply`
- **AI Core:** `/api/analyze-skill-gap`, `/api/job-match`, `/api/potential-score`, `/api/recommend-career`

---

Built with **Node.js, Express, MySQL, and Premium CSS**. 🚀
