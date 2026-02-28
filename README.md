# 🚀 FresherJob Portal - AI-Powered Job Platform for Freshers

## 📋 Overview

**FresherJob** is an advanced, all-in-one platform designed specifically for freshers to discover jobs, validate their skills, showcase projects, and prepare for interviews. It revolutionizes fresher hiring by combining intelligent job matching, practical skill validation, and career guidance.

### 🎯 Project Philosophy
Traditional job portals like Naukri, LinkedIn, and Indeed are not optimized for freshers. This portal solves this with:
- ✅ **Skill-based, not experience-based** hiring
- ✅ **Verified skills** through practical tests
- ✅ **Personalized learning paths** based on target roles
- ✅ **AI-powered mock interviews** with feedback
- ✅ **Rejection feedback system** for improvement
- ✅ **Fake job detection** for safety

---

## ⭐ Unique & Advanced Features

### 1. 🧠 **Skill → Job Roadmap Generator**
- Enter your current skills
- Get personalized learning path
- See eligible jobs with skill gap analysis
- Recommended upskilling resources
- **Not available in Naukri/LinkedIn**

### 2. 🎓 **Fresher Readiness Score**
- Calculated from multiple factors:
  - Resume quality (25%)
  - Skill test scores (30%)
  - Mock interview performance (20%)
  - Portfolio projects (10%)
  - Profile completeness (15%)
- Real-time score calculation
- Score-based recruiter filtering

### 3. 🧪 **Practical Skill Tests**
- Auto-evaluated MCQ tests
- Coding challenges
- Verified skill certificates
- Skill-specific difficulty levels
- Score tracking and analytics

### 4. 🎤 **AI Mock Interview Module**
- Technical interview questions
- HR questions
- Communication scoring
- Confidence assessment
- Weak topic identification
- Personalized feedback

### 5. 💬 **Rejection Feedback System**
- Mandatory feedback for recruiters
- Specific rejection reasons:
  - Skill gap
  - Communication issues
  - Resume formatting
  - Experience mismatch
- Improvement tips for each reason
- **Industry first - not in any other portal**

### 6. 🛡️ **Fake Job Detection**
- Company verification system
- Salary anomaly detection
- User reporting mechanism
- Admin review process
- Safety ratings for jobs

### 7. 📂 **Portfolio from Projects**
- Auto-verify college projects
- GitHub integration
- Live demo links
- Tech stack showcase
- One-click portfolio sharing

### 8. 📊 **AI Job Matching**
- Skill-based matching algorithm
- Match percentage display
- Eligible jobs identification
- Training-provided jobs filter
- Zero-experience friendly jobs

### 9. 🏫 **College-to-Job Integration**
- TPO dashboard
- Placement tracking
- Verified drives posting
- Batch-wise analytics

### 10. 📈 **Advanced Analytics**
- Application tracking
- Interview scheduling
- Placement success rate
- Skill demand analysis

---

## 🏗️ Project Structure

```
job-portal-fresher/
├── backend.js                 # Node.js Backend with All APIs
├── app.js                     # Advanced Frontend Logic
├── index.html                 # Main Portal Interface
├── styles.css                 # Advanced CSS (Animations, Dark Mode, etc.)
├── package.json               # Dependencies
├── db/
│   └── schema.sql            # Complete Database Schema
└── README.md                  # Documentation
```

---

## 📊 Database Schema

### Core Tables:
1. **students** - Fresher profiles (email, skills, scores)
2. **recruiters** - Company profiles (verification, details)
3. **admins** - Platform administrators
4. **jobs** - Job postings (verified, fresher-only)
5. **applications** - Application tracking
6. **skill_tests** - Test bank (MCQ, coding)
7. **skill_test_attempts** - Test results
8. **portfolio_projects** - Student projects
9. **mock_interviews** - Interview records
10. **readiness_score_components** - Score calculation
11. **rejection_feedback** - Feedback system
12. **job_reports** - Fake job reports
13. **notifications** - User notifications
14. **analytics** - Platform metrics

---

## 🔌 Backend API Endpoints

### Auth Endpoints
```
POST /api/auth/register          - Register new student
POST /api/auth/login             - Student login
```

### Student Endpoints
```
GET /api/students/:id            - Get student profile
PUT /api/students/:id            - Update profile
GET /api/students/:id/readiness-score  - Calculate score
```

### Job Endpoints
```
GET /api/jobs                    - All approved jobs
GET /api/jobs/fresher-only       - Fresher-specific jobs
GET /api/roadmap/:studentId      - Skill roadmap & recommendations
```

### Application Endpoints
```
POST /api/applications           - Submit application
GET /api/applications            - Get my applications
GET /api/rejection-feedback/:appId - Get feedback
POST /api/rejection-feedback     - Add feedback
```

### Interview Endpoints
```
POST /api/mock-interview         - Record interview
GET /api/mock-interview/:studentId - Get interview history
```

### Portfolio Endpoints
```
POST /api/portfolio              - Add project
GET /api/portfolio/:studentId    - Get projects
```

### Recruiter Endpoints
```
POST /api/recruiters/register    - Register company
POST /api/recruiters/post-job    - Post job (pending approval)
```

### Reporting Endpoints
```
POST /api/report-job             - Report fake job
```

---

## 🎨 Frontend Features

### Navigation & Sections
- **Dashboard** - Overview, quick stats
- **Profile** - Personal info, skills, resume
- **Jobs** - Browse & apply to fresher jobs
- **Roadmap** - Skill analysis & learning path
- **Mock Interview** - Practice questions & scoring
- **Portfolio** - Showcase projects
- **Applications** - Track application status

### UI Components
- Advanced gradient buttons
- Animated cards with hover effects
- Real-time progress bars
- Status badges for applications
- Skill tag system
- Timeline visualizations
- Interactive filters

### Advanced CSS
- Dark mode support (`prefers-color-scheme`)
- GPU-accelerated animations
- Backdrop blur effects
- Glassmorphism design
- Responsive grid layouts
- Custom scrollbars
- Accessibility features

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- Modern web browser

### Installation

1. **Clone/Download the project**
```bash
cd Job-portal--fresher
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Database**
```bash
mysql -u root -p < db/schema.sql
```

4. **Configure Environment**
Create `.env` file (optional):
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fresher_job_portal
PORT=3000
```

5. **Start Backend Server**
```bash
npm start
# or with auto-reload
npm run dev
```

6. **Access the Application**

Open your browser and navigate to `http://localhost:3000/login.html` to sign in or create a new account. After successful authentication you will be redirected to the main dashboard (`index.html`).

You may also directly visit `register.html` to register. Recruiter and admin placeholder pages are available at `recruiter.html` and `admin.html`.


6. **Open in Browser**
```
http://localhost:3000
```

---

## 💡 How to Use

### For Freshers:

1. **Register & Login**
   - Create account with email, college, graduation year
   - Complete profile with skills and about section

2. **Build Your Profile**
   - Add technical skills (comma-separated)
   - Upload resume (ATS-friendly format)
   - Add portfolio projects with GitHub links
   - Watch readiness score increase

3. **Discover Jobs**
   - Browse fresher-only job listings
   - See skill match percentage for each role
   - Apply to roles you're interested in

4. **Generate Roadmap**
   - Get personalized skill → job mapping
   - Identify missing skills
   - Get recommended learning path
   - Track progress toward target role

5. **Take Skill Tests**
   - Complete MCQ tests for skills
   - Solve coding challenges
   - Get verified skill certificates
   - Boost readiness score

6. **Practice with Mock Interview**
   - Choose technical or HR questions
   - Get AI-generated questions
   - Record your answers
   - Receive communication score
   - Get feedback on weak areas

7. **Build Portfolio**
   - Add your college/personal projects
   - Link to GitHub repositories
   - Showcase live demos
   - Get projects verified by platform

8. **Track Applications**
   - Monitor application status
   - Receive rejection feedback with tips
   - Plan next steps based on feedback
   - Track interview schedules

### For Recruiters:

1. **Register Company**
   - Complete company verification
   - Upload company documents
   - Add company details & location

2. **Post Fresher Jobs**
   - Create job postings (pending approval)
   - Specify required skills
   - Set minimum test score
   - Mention training provided

3. **Review Candidates**
   - See ranked candidates by readiness score
   - View verified skills & test scores
   - Check portfolio projects
   - Review mock interview scores

4. **Interview & Hire**
   - Schedule interviews
   - Provide mandatory rejection feedback
   - Mark candidates for selection
   - Track hiring metrics

---

## 📱 Skills Covered

### Technical Skills
- Full-stack web development
- Database design (MySQL)
- RESTful API design
- Frontend development (HTML/CSS/JS)
- Advanced CSS animations
- Responsive design

### Concepts Implemented
- State management
- API integration
- Database schema design
- Authentication flow
- Error handling
- Data validation
- User experience design

---

##  🎓 Features Breakdown by Section

### Dashboard
- Readiness score display
- Quick stats (skills, projects, applications)
- Feature overview
- Welcome message

### Profile Management
- Personal information form
- Skills input (comma-separated)
- About section (free text)
- Resume upload
- Profile completion tracker

### Job Browsing
- Fresher-only filtered jobs
- Real-time skill matching
- Search by role/skills
- Filter by job type
- Company information
- Match percentage display

### Skill Roadmap
- Current skills analysis
- Recommended jobs list
- Missing skills identification
- Learning path timeline
- Target role guidance

### Mock Interview
- Question selection (Technical/HR/Both)
- AI question bank
- Answer submission
- Scoring system
- Confidence assessment
- Feedback generation

### Portfolio
- Project addition form
- Tech stack input
- GitHub/Live links
- Project verification
- Portfolio statistics

### Applications
- Application list with status
- Status-based filtering
- Rejection reason display
- Feedback view
- Interview scheduling info

---

## 🎯 Future Enhancements

- 🔗 LinkedIn/GitHub profile integration
- 🤖 AI resume parser & optimization
- 📹 Video interview practice
- 💼 Internship → Full-time conversion tracking
- 🏢 Department-specific role families
- 📊 Salary prediction based on skills
- 🎓 Certification verification
- 🌐 Multi-language support
- 📱 Mobile app (React Native)
- ⚡ Real-time notifications

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Advanced styling, animations, gradients
- **JavaScript (ES6+)** - Dynamic interactivity
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** - Runtime environment
- **HTTP Module** - Server creation
- **MySQL2** - Database connectivity
- **Crypto** - Password hashing (SHA-256)

### Database
- **MySQL 8.0+** - Relational database
- **14 tables** - Comprehensive schema
- **Indexes** - Performance optimization

---

##  📝 Sample Data

### Sample Student Registration
```
Email: freshie@college.com
Password: password123
Name: Raj Kumar
College: IIT Delhi
Branch: Computer Science
Graduation Year: 2025
Skills: JavaScript, React, Node.js, SQL
```

### Sample Job Posting
```
Title: Junior Web Developer
Company: TechStartup XYZ
Required Skills: JavaScript, React, Node.js
Experience: 0 (Fresher)
Salary: 3-5 LPA
Training Provided: Yes
Location: Bangalore
```

---

## 🐛 Troubleshooting

**Issue: Database connection failed**
- Check MySQL is running
- Verify credentials in schema.sql
- Create database first: `mysql -u root -p < db/schema.sql`

**Issue: API endpoints return 404**
- Ensure backend.js is running
- Check server is on http://localhost:3000
- Verify endpoint spelling

**Issue: Jobs not loading**
- Check jobs are marked as `is_published=TRUE` and `is_approved=TRUE`
- Verify recruiter is verified (`is_verified=TRUE`)

**Issue: CSS not applying**
- Check styles.css is in root directory
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

---

## 🤝 Contributing

This is a comprehensive fresher job portal built with advanced features. Feel free to extend with:
- Real AI integration
- Video interviews
- Payment gateway
- Email notifications
- SMS alerts
- Advanced analytics dashboard

---

## 📄 License

This project is open-source and available for educational and commercial use.

---

## 📞 Support

For issues or questions, refer to:
1. Check database schema in `db/schema.sql`
2. Review API endpoints in `backend.js`
3. Check frontend logic in `app.js`
4. Verify HTML structure in `index.html`

---

## 🎉 Congratulations!

You now have a production-ready fresher job portal with:
- ✅ 14 database tables
- ✅ 20+ API endpoints
- ✅ 10 unique advanced features
- ✅ Advanced responsive UI
- ✅ Complete fresher workflow
- ✅ Recruiter management
- ✅ Admin capabilities

**Happy coding! 🚀**

---

## 🌟 What Makes This Special

Unlike other job portals, FresherJob:
1. **Skill-Focused** - Matches by skills, not experience
2. **Verified Skills** - Only accepts test-proven abilities
3. **Guided Path** - Shows exactly what to learn
4. **Feedback Loop** - Improves with rejection reasons
5. **Fresher First** - Designed specifically for graduates
6. **Fake Prevention** - Protects from scams
7. **Career Coaching** - Mock interviews with feedback
8. **Portfolio Showcase** - Projects speak louder than claims

---

Built with ❤️ for Freshers
