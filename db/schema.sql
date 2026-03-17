-- 📊 FRESHER JOB PORTAL DATABASE SCHEMA
CREATE DATABASE IF NOT EXISTS fresher_job_portal;
USE fresher_job_portal;

-- 👤 USERS TABLE (Unified for Students, Recruiters, and Admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('fresher', 'recruiter', 'admin') DEFAULT 'fresher',
  college VARCHAR(180),
  branch VARCHAR(100),
  graduation_year INT,
  contact_number VARCHAR(20),
  about TEXT,
  readiness_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 🧾 JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruiter_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  description TEXT,
  skills_required TEXT NOT NULL,
  job_type ENUM('Internship', 'Full-Time', 'Both') DEFAULT 'Full-Time',
  salary_range_min INT,
  salary_range_max INT,
  location VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 📋 APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  status ENUM('Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected') DEFAULT 'Applied',
  pitch TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 📂 SKILLS TABLE
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  proficiency ENUM('Beginner', 'Intermediate', 'Expert') DEFAULT 'Intermediate',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 🛠️ PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_name VARCHAR(150) NOT NULL,
  project_link VARCHAR(255),
  description TEXT,
  tech_stack TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 🔔 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

