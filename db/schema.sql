CREATE DATABASE IF NOT EXISTS fresher_job_portal;
USE fresher_job_portal;

-- 👨‍🎓 FRESHER/STUDENT TABLE
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(120) NOT NULL,
  college VARCHAR(180) NOT NULL,
  branch VARCHAR(100),
  graduation_year INT NOT NULL,
  contact_number VARCHAR(20),
  profile_photo VARCHAR(255),
  about TEXT,
  skills TEXT,
  readiness_score INT DEFAULT 0,
  resume_url VARCHAR(255),
  portfolio_links TEXT,
  mock_interview_score INT DEFAULT 0,
  skill_test_score INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 🏢 RECRUITER/COMPANY TABLE
CREATE TABLE IF NOT EXISTS recruiters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(180) NOT NULL,
  company_email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  company_logo VARCHAR(255),
  company_website VARCHAR(255),
  company_description TEXT,
  industry_type VARCHAR(100),
  company_size VARCHAR(50),
  contact_person VARCHAR(120),
  contact_number VARCHAR(20),
  location VARCHAR(150),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_document VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ⚙️ ADMIN TABLE
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  email VARCHAR(120) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🧾 JOBS TABLE (Enhanced)
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruiter_id INT NOT NULL,
  job_title VARCHAR(180) NOT NULL,
  role_description TEXT,
  required_skills TEXT NOT NULL,
  job_category VARCHAR(100),
  job_type ENUM('Internship', 'Full-Time', 'Both') DEFAULT 'Both',
  salary_range_min INT,
  salary_range_max INT,
  experience_required INT DEFAULT 0,
  location VARCHAR(150),
  is_fresher_only BOOLEAN DEFAULT TRUE,
  training_provided BOOLEAN DEFAULT FALSE,
  minimum_test_score INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason VARCHAR(255),
  views INT DEFAULT 0,
  applications_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES recruiters(id)
);

-- 📋 APPLICATIONS TABLE (Enhanced)
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  job_id INT NOT NULL,
  pitch TEXT,
  selected_resume VARCHAR(255),
  skill_test_score INT,
  mock_interview_score INT,
  status ENUM('Applied', 'Under Review', 'Interview Scheduled', 'Selected', 'Rejected', 'Accepted') DEFAULT 'Applied',
  rejection_reason VARCHAR(100),
  rejection_feedback TEXT,
  interview_date DATETIME,
  interview_result TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- 🧪 SKILL TESTS TABLE
CREATE TABLE IF NOT EXISTS skill_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_name VARCHAR(150) NOT NULL,
  skill_category VARCHAR(100),
  difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Intermediate',
  questions_json LONGTEXT,
  test_duration_minutes INT DEFAULT 30,
  is_approved BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES recruiters(id)
);

-- 📊 SKILL TEST ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS skill_test_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  test_id INT NOT NULL,
  score INT DEFAULT 0,
  total_marks INT DEFAULT 100,
  percentage FLOAT DEFAULT 0,
  status ENUM('Completed', 'In Progress', 'Abandoned') DEFAULT 'In Progress',
  time_taken_seconds INT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (test_id) REFERENCES skill_tests(id)
);

-- 📂 PORTFOLIO PROJECTS TABLE
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  project_name VARCHAR(150) NOT NULL,
  project_description TEXT,
  project_links TEXT,
  tech_stack TEXT,
  github_url VARCHAR(255),
  live_url VARCHAR(255),
  project_images TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 🎤 MOCK INTERVIEW TABLE
CREATE TABLE IF NOT EXISTS mock_interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  job_id INT NOT NULL,
  interview_type ENUM('Technical', 'HR', 'Both') DEFAULT 'Both',
  questions_asked TEXT,
  answers_provided TEXT,
  confidence_score INT,
  communication_score INT,
  overall_score INT,
  weak_topics TEXT,
  feedback TEXT,
  interview_duration_seconds INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- 📈 FRESHER READINESS SCORE CALCULATION TABLE
CREATE TABLE IF NOT EXISTS readiness_score_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  resume_quality_score INT DEFAULT 0,
  skill_test_score INT DEFAULT 0,
  project_score INT DEFAULT 0,
  mock_interview_score INT DEFAULT 0,
  profile_completeness INT DEFAULT 0,
  total_score INT DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 💬 REJECTION FEEDBACK SYSTEM TABLE
CREATE TABLE IF NOT EXISTS rejection_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  recruiter_id INT NOT NULL,
  reason_category VARCHAR(100) NOT NULL,
  custom_feedback TEXT,
  improvement_tips TEXT,
  given_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (recruiter_id) REFERENCES recruiters(id)
);

-- 🛡️ FAKE JOB DETECTION TABLE
CREATE TABLE IF NOT EXISTS job_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  reported_by INT,
  report_reason VARCHAR(100),
  report_details TEXT,
  is_verified_fake BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (reported_by) REFERENCES students(id)
);

-- 🏫 COLLEGE-TO-JOB INTEGRATION TABLE
CREATE TABLE IF NOT EXISTS college_integrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_name VARCHAR(180) UNIQUE NOT NULL,
  tpo_email VARCHAR(120),
  tpo_contact VARCHAR(20),
  api_key VARCHAR(255),
  is_enabled BOOLEAN DEFAULT FALSE,
  verified_students_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 🔔 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_type ENUM('Student', 'Recruiter', 'Admin') NOT NULL,
  notification_type VARCHAR(100),
  message TEXT,
  related_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- 📊 ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_name VARCHAR(100),
  metric_value INT,
  recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
