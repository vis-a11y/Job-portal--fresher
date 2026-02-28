// ============================================
// FresherJob Portal - Frontend Application
// ============================================

// State Management
const appState = {
  currentStudent: null,
  allJobs: [],
  userApplications: [],
  mockInterviewQuestions: [
    { type: 'technical', text: 'Tell me about a project where you solved a difficult bug.' },
    { type: 'technical', text: 'How would you design a simple REST API for a todo app?' },
    { type: 'technical', text: 'Explain the difference between let, const, and var.' },
    { type: 'technical', text: 'What is the event loop in JavaScript?' },
    { type: 'hr', text: 'Why do you want to work in this role as a fresher?' },
    { type: 'hr', text: 'How do you handle feedback and criticism?' },
    { type: 'hr', text: 'Tell me about a time you worked in a team.' },
    { type: 'hr', text: 'What are your strengths and weaknesses?' }
  ],
  currentQuestionIndex: 0,
  interviewScore: 0
};

// Configuration
const API_BASE = 'http://localhost:3000/api';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Make API requests
 */
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(API_BASE + endpoint, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}

/**
 * Show notifications
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculate skill score
 */
function calculateSkillScore(userSkills, jobSkills) {
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
  
  const matched = jobSkillsLower.filter(s => userSkillsLower.includes(s)).length;
  return Math.round((matched / jobSkillsLower.length) * 100);
}

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Register a new student via API
 */
async function registerStudent(email, password, name, college, branch, year) {
  try {
    const response = await apiCall('/auth/register', 'POST', {
      email,
      password,
      name,
      college,
      branch,
      graduation_year: year
    });
    appState.currentStudent = response.student;
    localStorage.setItem('studentId', response.student.id);
    localStorage.setItem('studentEmail', response.student.email);
    showNotification('Registration successful!');
    window.location = 'index.html';
    return response.student;
  } catch (error) {
    console.error('Registration failed', error);
    throw error;
  }
}

/**
 * Login an existing student
 */
async function loginStudent(email, password) {
  try {
    const response = await apiCall('/auth/login', 'POST', { email, password });
    appState.currentStudent = response.student;
    localStorage.setItem('studentId', response.student.id);
    localStorage.setItem('studentEmail', response.student.email);
    showNotification('Login successful!');
    window.location = 'index.html';
    return response.student;
  } catch (error) {
    console.error('Login failed', error);
    throw error;
  }
}

/**
 * Logout current user
 */
function logoutStudent() {
  appState.currentStudent = null;
  localStorage.removeItem('studentId');
  localStorage.removeItem('studentEmail');
  showNotification('Logged out');
  window.location = 'login.html';
}

// ============================================
// PAGE NAVIGATION
// ============================================

/**
 * Switch between sections
 */
function switchSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove active state from nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Show selected section
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
    
    // Mark nav link as active
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
}

// Add event listeners for navigation
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      switchSection(section);
    });
  });
  
  // Default section
  switchSection('dashboard');
});

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

/**
 * Load and display dashboard
 */
async function loadStudentDashboard() {
  try {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) return;
    
    // Fetch student data
    const student = await apiCall(`/students/${studentId}`);
    appState.currentStudent = student;
    
    // Update readiness score
    const scoreData = await apiCall(`/students/${studentId}/readiness-score`);
    document.getElementById('readinessScore').textContent = scoreData.readiness_score;
    
    // Update profile info
    updateProfileDisplay(student);
    // Show name in welcome
    const welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl) {
      welcomeEl.textContent = `Hello, ${student.name || 'Friend'}!`;
    }
    
    // Load jobs
    loadFresherJobs();
    
    // Load applications
    loadApplications();
    
    // Load portfolio
    loadPortfolio();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

/**
 * Update profile display
 */
function updateProfileDisplay(student) {
  if (document.getElementById('profileEmail')) {
    document.getElementById('profileEmail').value = student.email || '';
    document.getElementById('profileName').value = student.name || '';
    document.getElementById('profileCollege').value = student.college || '';
    document.getElementById('profileBranch').value = student.branch || '';
    document.getElementById('profileYear').value = student.graduation_year || '';
    document.getElementById('profileContact').value = student.contact_number || '';
    document.getElementById('profileSkills').value = student.skills || '';
    document.getElementById('profileAbout').value = student.about || '';
    
    // Update stats
    const skillsCount = (student.skills || '').split(',').filter(s => s.trim()).length;
    document.getElementById('skillsCount').textContent = skillsCount;
    
    const profileCompletion = Math.round((
      (student.name ? 15 : 0) +
      (student.college ? 15 : 0) +
      (student.skills ? 20 : 0) +
      (student.about ? 20 : 0) +
      (student.resume_url ? 15 : 0) +
      (student.contact_number ? 15 : 0)
    ) / 6);
    
    const progressBar = document.getElementById('profileCompletion');
    if (progressBar) {
      progressBar.style.width = profileCompletion + '%';
    }
  }
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * Save/Update profile
 */
async function saveProfile(event) {
  event.preventDefault();
  
  const studentId = localStorage.getItem('studentId');
  if (!studentId) {
    showNotification('Please login first', 'error');
    return;
  }
  
  const formData = new FormData(event.currentTarget);
  const data = {
    name: formData.get('name'),
    college: formData.get('college'),
    skills: formData.get('skills'),
    about: formData.get('about'),
    contact_number: formData.get('contact')
  };
  
  try {
    await apiCall(`/students/${studentId}`, 'PUT', data);
    showNotification('Profile updated successfully! 🎉');
    loadStudentDashboard();
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', saveProfile);
  }
});

// ============================================
// JOB FUNCTIONS
// ============================================

/**
 * Load and display jobs
 */
async function loadFresherJobs() {
  try {
    const jobsData = await apiCall('/jobs/fresher-only');
    appState.allJobs = jobsData;
    renderJobs(jobsData);
  } catch (error) {
    console.error('Error loading jobs:', error);
  }
}

/**
 * Render jobs list
 */
function renderJobs(jobs) {
  const jobsList = document.getElementById('jobsList');
  if (!jobsList) return;
  
  jobsList.innerHTML = '';
  
  jobs.forEach(job => {
    const userSkills = (appState.currentStudent?.skills || '').split(',').map(s => s.trim());
    const jobSkills = (job.required_skills || '').split(',').map(s => s.trim());
    const matchPercentage = calculateSkillScore(userSkills, jobSkills);
    
    const jobCard = document.createElement('div');
    jobCard.className = 'card job-card';
    jobCard.innerHTML = `
      <div class="row" style="justify-content: space-between;">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 0.5rem 0;">${job.job_title}</h3>
          <p class="muted" style="margin: 0;">${job.company_name}</p>
        </div>
        <div style="text-align: right;">
          <span class="badge">${job.job_type}</span>
          ${job.salary_range_max ? `<span class="badge" style="margin-left: 0.5rem;">₹${job.salary_range_max/100000}L</span>` : ''}
        </div>
      </div>
      
      <p style="margin: 1rem 0;">${job.role_description || 'Open position for freshers'}</p>
      
      <div class="skills-tags">
        ${jobSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>

      <div class="row" style="justify-content: space-between; margin-top: 1rem; align-items: center;">
        <span class="muted" style="font-size: 0.85rem;">📊 Match: <strong>${matchPercentage}%</strong></span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary btn-sm" onclick="viewJobDetails(${job.id})">Details</button>
          <button class="btn-primary btn-sm" onclick="applyJob(${job.id})">Apply Now</button>
        </div>
      </div>
    `;
    
    jobsList.appendChild(jobCard);
  });
  
  if (jobs.length === 0) {
    jobsList.innerHTML = '<div class="card"><p class="muted">No jobs available. Check back soon!</p></div>';
  }
}

/**
 * Apply for job
 */
async function applyJob(jobId) {
  const studentId = localStorage.getItem('studentId');
  if (!studentId) {
    showNotification('Please login first', 'error');
    return;
  }
  
  const pitch = prompt('Tell us why you should be hired for this role:');
  if (!pitch) return;
  
  try {
    await apiCall('/applications', 'POST', {
      student_id: parseInt(studentId),
      job_id: jobId,
      pitch
    });
    
    showNotification('Application submitted! 🚀');
    loadApplications();
  } catch (error) {
    console.error('Error applying for job:', error);
  }
}

/**
 * View job details
 */
function viewJobDetails(jobId) {
  const job = appState.allJobs.find(j => j.id === jobId);
  if (job) {
    alert(`${job.job_title}\n\n${job.role_description}\n\nSkills: ${job.required_skills}`);
  }
}

/**
 * Apply job filters
 */
function applyJobFilters() {
  const searchTerm = (document.getElementById('jobSearch')?.value || '').toLowerCase();
  const filterType = document.getElementById('jobFilter')?.value || '';
  
  const filtered = appState.allJobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.job_title.toLowerCase().includes(searchTerm) ||
      job.required_skills.toLowerCase().includes(searchTerm);
    
    const matchesType = !filterType ||
      job.job_type.includes(filterType) ||
      (filterType === 'Training' && job.training_provided);
    
    return matchesSearch && matchesType;
  });
  
  renderJobs(filtered);
}

// ============================================
// MOCK INTERVIEW FUNCTIONS
// ============================================

/**
 * Start mock interview
 */
function startMockInterview() {
  const interviewType = document.getElementById('interviewType')?.value || 'both';
  
  appState.currentQuestionIndex = 0;
  appState.interviewScore = 0;
  
  document.getElementById('interviewSection').style.display = 'none';
  document.getElementById('mockQuestion').style.display = 'block';
  
  getNextQuestion(interviewType);
}

/**
 * Get next question
 */
function getNextQuestion(type) {
  const filteredQuestions = appState.mockInterviewQuestions.filter(q => 
    type === 'both' || q.type === type
  );
  
  if (appState.currentQuestionIndex >= filteredQuestions.length) {
    finishInterview();
    return;
  }
  
  const question = filteredQuestions[appState.currentQuestionIndex];
  document.getElementById('questionText').textContent = question.text;
  document.getElementById('answerBox').value = '';
  document.getElementById('answerBox').focus();
}

/**
 * Submit interview answer
 */
function submitAnswer() {
  const answer = document.getElementById('answerBox').value;
  
  if (!answer.trim()) {
    showNotification('Please provide an answer', 'error');
    return;
  }
  
  // Simulate scoring (in real app, would use AI)
  // Score based on answer length and quality indicators
  const score = Math.min(20 + answer.length / 10, 100);
  appState.interviewScore += score;
  
  appState.currentQuestionIndex++;
  const interviewType = document.getElementById('interviewType')?.value || 'both';
  
  const filteredQuestions = appState.mockInterviewQuestions.filter(q => 
    interviewType === 'both' || q.type === interviewType
  );
  
  if (appState.currentQuestionIndex >= filteredQuestions.length) {
    finishInterview();
  } else {
    getNextQuestion(interviewType);
    showNotification('Great! Next question...', 'success');
  }
}

/**
 * Skip question
 */
function skipQuestion() {
  appState.currentQuestionIndex++;
  const interviewType = document.getElementById('interviewType')?.value || 'both';
  
  const filteredQuestions = appState.mockInterviewQuestions.filter(q => 
    interviewType === 'both' || q.type === document.getElementById('interviewType')?.value
  );
  
  if (appState.currentQuestionIndex >= filteredQuestions.length) {
    finishInterview();
  } else {
    getNextQuestion(interviewType);
  }
}

/**
 * Finish interview
 */
function finishInterview() {
  const interviewType = appState.mockInterviewQuestions.filter(q => 
    document.getElementById('interviewType')?.value === 'both' || q.type === document.getElementById('interviewType')?.value
  ).length;
  
  const finalScore = Math.round(appState.interviewScore / interviewType);
  
  document.getElementById('mockQuestion').style.display = 'none';
  document.getElementById('interviewSection').style.display = 'block';
  
  const scoresDiv = document.getElementById('interviewScores');
  if (scoresDiv) {
    scoresDiv.innerHTML = `
      <div class="stat-box" style="flex-direction: column;">
        <span>Overall Score</span>
        <strong>${Math.min(finalScore, 100)}/100</strong>
      </div>
      <p class="muted">✓ Interview completed! Share your results with recruiters.</p>
    `;
  }
  
  showNotification(`Interview completed! Your score: ${Math.min(finalScore, 100)}/100 🎉`);
}

// ============================================
// PORTFOLIO FUNCTIONS
// ============================================

/**
 * Load portfolio
 */
async function loadPortfolio() {
  const studentId = localStorage.getItem('studentId');
  if (!studentId) return;
  
  try {
    const projects = await apiCall(`/portfolio/${studentId}`);
    renderPortfolio(projects);
  } catch (error) {
    console.error('Error loading portfolio:', error);
  }
}

/**
 * Render portfolio
 */
function renderPortfolio(projects) {
  const portfolioList = document.getElementById('portfolioList');
  if (!portfolioList) return;
  
  portfolioList.innerHTML = '';
  
  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'card';
    projectCard.innerHTML = `
      <h4>${project.project_name}</h4>
      <p>${project.project_description}</p>
      <p class="muted">Tech: ${project.tech_stack}</p>
      <div class="row" style="gap: 0.5rem;">
        ${project.github_url ? `<a href="${project.github_url}" target="_blank" class="btn-secondary btn-sm">GitHub</a>` : ''}
        ${project.live_url ? `<a href="${project.live_url}" target="_blank" class="btn-secondary btn-sm">Live</a>` : ''}
      </div>
    `;
    portfolioList.appendChild(projectCard);
  });
  
  document.getElementById('projectsCount').textContent = projects.length;
}

/**
 * Add project to portfolio
 */
async function addProjectToPortfolio(event) {
  event.preventDefault();
  
  const studentId = localStorage.getItem('studentId');
  if (!studentId) {
    showNotification('Please login first', 'error');
    return;
  }
  
  const data = {
    student_id: parseInt(studentId),
    project_name: document.getElementById('projectName').value,
    project_description: document.getElementById('projectDescription').value,
    tech_stack: document.getElementById('projectTech').value,
    github_url: document.getElementById('projectGithub').value
  };
  
  try {
    await apiCall('/portfolio', 'POST', data);
    showNotification('Project added to portfolio! 🎉');
    
    event.currentTarget.reset();
    loadPortfolio();
  } catch (error) {
    console.error('Error adding project:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const portfolioForm = document.getElementById('portfolioForm');
  if (portfolioForm) {
    portfolioForm.addEventListener('submit', addProjectToPortfolio);
  }
});

// ============================================
// APPLICATIONS FUNCTIONS
// ============================================

/**
 * Load applications
 */
async function loadApplications() {
  const studentId = localStorage.getItem('studentId');
  if (!studentId) return;
  
  try {
    const applications = await apiCall(`/applications?studentId=${studentId}`);
    renderApplications(applications);
    document.getElementById('applicationsCount').textContent = applications.length;
  } catch (error) {
    console.error('Error loading applications:', error);
  }
}

/**
 * Render applications
 */
function renderApplications(applications, filter = 'All') {
  const list = document.getElementById('applicationsList');
  if (!list) return;
  
  list.innerHTML = '';
  
  const filtered = filter === 'All' ? applications : applications.filter(a => a.status === filter);
  
  filtered.forEach(app => {
    const appCard = document.createElement('div');
    appCard.className = 'card application-card';
    appCard.innerHTML = `
      <div class="row" style="justify-content: space-between;">
        <div>
          <h4 style="margin: 0;">${app.job_title}</h4>
          <p class="muted" style="margin: 0;">Company</p>
        </div>
        <span class="status-badge status-${app.status.replace(/\s+/g, '\\ ')}">${app.status}</span>
      </div>
      
      <p style="margin: 1rem 0 0.5rem 0; font-size: 0.9rem;">Applied: ${formatDate(app.applied_at)}</p>
      
      ${app.rejection_reason ? `
        <div class="rejection-info">
          <p><strong>📝 Reason:</strong> ${app.rejection_reason}</p>
          <p><strong>💡 Feedback:</strong> ${app.rejection_feedback || 'Check your mail for detailed feedback'}</p>
        </div>
      ` : ''}
      
      <div class="row" style="gap: 0.5rem; margin-top: 1rem;">
        <button class="btn-secondary btn-sm">Details</button>
      </div>
    `;
    
    list.appendChild(appCard);
  });
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="card"><p class="muted">No applications in this category</p></div>';
  }
}

/**
 * Filter applications by status
 */
function filterApplications(status) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  const studentId = localStorage.getItem('studentId');
  if (studentId) {
    apiCall(`/applications?studentId=${studentId}`).then(apps => {
      renderApplications(apps, status);
    });
  }
}

// ============================================
// INITIALIZE APP ON LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // If on index.html redirect to login if not authenticated
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      window.location = 'login.html';
      return;
    }
    loadStudentDashboard();
    loadFresherJobs();
    loadRoadmap();
    loadApplications();
    loadPortfolio();
  }

  // Prevent access to login/register when already logged in
  if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      window.location = 'index.html';
      return;
    }
  }

  // Add filter listeners
  const jobSearch = document.getElementById('jobSearch');
  const jobFilter = document.getElementById('jobFilter');

  if (jobSearch) jobSearch.addEventListener('input', applyJobFilters);
  if (jobFilter) jobFilter.addEventListener('change', applyJobFilters);

  // Login/register forms handling if present
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      try { await loginStudent(email, password); } catch (err) {
        alert(err.message);
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        name: document.getElementById('regName').value,
        college: document.getElementById('regCollege').value,
        branch: document.getElementById('regBranch').value,
        graduation_year: Number(document.getElementById('regYear').value)
      };
      try { await registerStudent(data.email, data.password, data.name, data.college, data.branch, data.graduation_year); } catch (err) {
        alert(err.message);
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutStudent);
  }
});

// Export functions for HTML onclick handlers
window.startMockInterview = startMockInterview;
window.submitAnswer = submitAnswer;
window.skipQuestion = skipQuestion;
window.applyJob = applyJob;
window.viewJobDetails = viewJobDetails;
window.applyJobFilters = applyJobFilters;
window.filterApplications = filterApplications;

// Helper functions for template buttons with data attributes
window.viewJobDetailsBtn = function(button) {
  const jobId = parseInt(button.getAttribute('data-job-id'));
  viewJobDetails(jobId);
};

window.applyJobBtn = function(button) {
  const jobId = parseInt(button.getAttribute('data-job-id'));
  applyJob(jobId);
};
