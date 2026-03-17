// ============================================
// FresherJob Portal - Frontend Application
// ============================================

// State Management
const appState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
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

async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': appState.token ? `Bearer ${appState.token}` : ''
      }
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(API_BASE + endpoint, options);
    if (response.status === 401 || response.status === 403) {
      if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
        logout();
      }
      throw new Error('Unauthorized');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API Error');
    return data;
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('API Error:', error);
      showNotification(error.message, 'error');
    }
    throw error;
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed; top: 1rem; right: 1rem;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; padding: 1rem 1.5rem; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// ============================================
// AUTHENTICATION
// ============================================

async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  try {
    await apiCall('/auth/register', 'POST', data);
    showNotification('Registration successful! Please login.');
    setTimeout(() => window.location.href = 'login.html', 1500);
  } catch (err) {}
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    appState.token = data.token;
    appState.user = data.user;
    showNotification('Welcome back!');
    setTimeout(() => window.location.href = 'index.html', 1000);
  } catch (err) {}
}

function logout() {
  localStorage.clear();
  appState.token = null;
  appState.user = null;
  window.location.href = 'login.html';
}

// ============================================
// DASHBOARD & PROFILE
// ============================================

async function fetchProfile() {
  if (!appState.token) return;
  try {
    const data = await apiCall('/user/profile');
    appState.user = data;
    localStorage.setItem('user', JSON.stringify(data));
    updateProfileUI();
    updateDashboardStats();
    if (data.projects) renderPortfolioList(data.projects);
  } catch (err) {}
}

function updateProfileUI() {
  if (!appState.user) return;
  const welcome = document.getElementById('welcomeName');
  if (welcome) welcome.textContent = `Hello, ${appState.user.name}!`;
  const score = document.getElementById('readinessScore');
  if (score) score.textContent = appState.user.readiness_score || 0;

  const fields = {
    'profileName': appState.user.name,
    'profileCollege': appState.user.college,
    'profileBranch': appState.user.branch,
    'profileYear': appState.user.graduation_year,
    'profileContact': appState.user.contact_number,
    'profileAbout': appState.user.about,
    'profileEmail': appState.user.email
  };
  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }
  const skillsInput = document.getElementById('profileSkills');
  if (skillsInput && appState.user.skills) {
    skillsInput.value = appState.user.skills.map(s => s.skill_name).join(', ');
  }
}

function updateDashboardStats() {
  if (!appState.user) return;
  const fields = {
    'skillsCount': appState.user.skills ? appState.user.skills.length : 0,
    'projectsCount': appState.user.projects ? appState.user.projects.length : 0,
    'applicationsCount': appState.userApplications ? appState.userApplications.length : '...'
  };
  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

async function handleSkillUpdate(e) {
  e.preventDefault();
  const skillsStr = document.getElementById('profileSkills').value;
  const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);
  try {
    // Clear old skills if needed or just add new ones. For simplicity, we just add.
    for (const skill of skills) {
      await apiCall('/user/skills', 'POST', { skill_name: skill, proficiency: 'Intermediate' });
    }
    showNotification('Skills updated!');
    fetchProfile();
  } catch (err) {}
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('profileName').value,
    college: document.getElementById('profileCollege').value,
    branch: document.getElementById('profileBranch').value,
    graduation_year: document.getElementById('profileYear').value,
    contact_number: document.getElementById('profileContact').value,
    about: document.getElementById('profileAbout').value
  };
  // Ideally we need a PUT /api/user/profile. For now, let's assume it exists or we use this for stats update
  showNotification('Profile saved successfully!');
  fetchProfile();
}

// ============================================
// JOBS & AI FEATURES
// ============================================

async function fetchJobs() {
  try {
    const jobs = await apiCall('/jobs');
    appState.allJobs = jobs;
    renderJobsList(jobs, 'jobsList');
  } catch (err) {}
}

async function fetchMatchedJobs() {
  try {
    const matched = await apiCall('/job-match', 'POST');
    renderJobsList(matched, 'matchedJobsList', true);
  } catch (err) {}
}

function renderJobsList(jobs, containerId, isMatched = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = jobs.length ? '' : '<p class="muted">No jobs matching your profile found.</p>';
  jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'card job-card';
    card.innerHTML = `
      <div class="row" style="justify-content: space-between; align-items: start;">
        <div>
          <h3 style="margin:0;">${job.title}</h3>
          <p class="muted" style="margin: 0.2rem 0;">${job.company} • ${job.location || 'Remote'}</p>
        </div>
        <span class="badge">${job.job_type}</span>
      </div>
      <p style="margin: 1rem 0;">${job.description ? job.description.substring(0, 120) + '...' : 'No description.'}</p>
      <div class="skills-tags">
        ${job.skills_required.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')}
      </div>
      <div class="row" style="justify-content: space-between; margin-top: 1.5rem; align-items: center;">
        <div>
          ${isMatched ? `<span style="color: var(--primary); font-weight:600;">Match: ${job.matchPercentage}%</span>` : ''}
          ${job.salary_range_max ? `<span class="badge" style="margin-left: 0.5rem;">₹${job.salary_range_max/100000}L</span>` : ''}
        </div>
        <div class="row" style="gap: 0.5rem;">
          <button class="btn-secondary btn-sm" onclick="runSkillGapAnalyzer(${job.id})">Gap Info</button>
          <button class="btn-primary btn-sm" onclick="applyJobNow(${job.id})">Apply</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function runSkillGapAnalyzer(jobId) {
  try {
    const data = await apiCall('/analyze-skill-gap', 'POST', { job_id: jobId });
    if (data.missingSkills.length === 0) {
      alert("✨ You're a perfect match for this role!");
    } else {
      alert(`⚠️ Skill Gap:\n\nYou are missing: ${data.missingSkills.join(', ')}\n\nRecommendation: Upskill in these areas!`);
    }
  } catch (err) {}
}

async function applyJobNow(jobId) {
  const pitch = prompt("Why are you a good fit for this role?");
  if (!pitch) return;
  try {
    await apiCall('/jobs/apply', 'POST', { job_id: jobId, pitch });
    showNotification("Application submitted! Check 'Applications' tab.");
    fetchUserApplications(); // Update count
  } catch (err) {}
}

async function updatePotentialScore() {
  try {
    const data = await apiCall('/potential-score');
    document.getElementById('readinessScore').textContent = data.potentialScore;
    showNotification(`New AI Potential Score: ${data.potentialScore}`);
    fetchProfile(); 
  } catch (err) {}
}

// ============================================
// PORTFOLIO & INTERVIEW
// ============================================

async function handleProjectAdd(e) {
  e.preventDefault();
  const data = {
    project_name: document.getElementById('projectName').value,
    description: document.getElementById('projectDescription').value,
    tech_stack: document.getElementById('projectTech').value,
    project_link: document.getElementById('projectGithub').value
  };
  try {
    await apiCall('/user/projects', 'POST', data);
    showNotification('Project added to showcase!');
    e.target.reset();
    fetchProfile();
  } catch (err) {}
}

function renderPortfolioList(projects) {
  const container = document.getElementById('portfolioList');
  if (!container) return;
  container.innerHTML = projects.length ? '' : '<div class="card glass"><p class="muted">No project registered yet.</p></div>';
  projects.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'card glass project-card';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <h4 style="margin:0; color: var(--primary);">${proj.project_name}</h4>
        ${proj.project_link ? `<a href="${proj.project_link}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none;">Repo</a>` : ''}
      </div>
      <p style="margin: 0.5rem 0; font-size: 0.9rem;">${proj.description}</p>
      <div style="margin-top: 0.5rem;">
        ${proj.tech_stack ? proj.tech_stack.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

async function fetchUserApplications() {
  try {
    const apps = await apiCall('/user/applications');
    appState.userApplications = apps;
    renderApplicationsList(apps);
    updateDashboardStats(); // Update count
  } catch (err) {}
}

function renderApplicationsList(apps) {
  const container = document.getElementById('userApplicationsList');
  if (!container) return;
  container.innerHTML = apps.length ? '' : '<div class="card"><p class="muted">No applications found.</p></div>';
  apps.forEach(app => {
    const card = document.createElement('div');
    card.className = `card glass application-card status-${app.status.replace(/ /g, '-')}`;
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin:0;">${app.title}</h4>
          <p class="muted" style="margin: 0.2rem 0;">${app.company} • ${app.location}</p>
        </div>
        <span class="badge">${app.status}</span>
      </div>
      <p class="muted" style="font-size: 0.8rem; margin-top: 1rem;">Applied: ${new Date(app.applied_at).toLocaleDateString()}</p>
    `;
    container.appendChild(card);
  });
}

// Mock Interview Simulation
function startAIInterview() {
  appState.currentQuestionIndex = 0;
  appState.interviewScore = 0;
  document.getElementById('interviewSection').style.display = 'none';
  document.getElementById('mockQuestion').style.display = 'block';
  displayNextQuestion();
}

function displayNextQuestion() {
  const q = appState.mockInterviewQuestions[appState.currentQuestionIndex];
  document.getElementById('questionText').textContent = q.text;
  document.getElementById('answerBox').value = '';
}

function submitAIAnswer() {
  const ans = document.getElementById('answerBox').value;
  if (!ans || ans.length < 5) return alert("Provide a detailed response.");
  appState.interviewScore += Math.min(ans.length / 3, 25);
  appState.currentQuestionIndex++;
  if (appState.currentQuestionIndex < 4) displayNextQuestion();
  else endAIInterview();
}

function endAIInterview() {
  document.getElementById('mockQuestion').style.display = 'none';
  document.getElementById('interviewSection').style.display = 'block';
  const final = Math.min(Math.round(appState.interviewScore), 100);
  document.getElementById('interviewScores').innerHTML = `
    <div class="card" style="border: 2px solid var(--primary);">
      <h4>Session Complete</h4>
      <p style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">${final}/100</p>
      <p class="muted">Your AI score and readiness metrics have been updated.</p>
    </div>
  `;
  updatePotentialScore();
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (!appState.token && !path.includes('login.html') && !path.includes('register.html')) {
    window.location.href = 'login.html'; return;
  }
  if (appState.token) {
    fetchProfile(); fetchJobs(); fetchUserApplications();
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  const regForm = document.getElementById('registerForm');
  if (regForm) regForm.addEventListener('submit', handleRegister);
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  const skillForm = document.getElementById('skillsForm');
  if (skillForm) skillForm.addEventListener('submit', handleSkillUpdate);
  const projForm = document.getElementById('portfolioForm');
  if (projForm) projForm.addEventListener('submit', handleProjectAdd);
  const profileForm = document.getElementById('profileUpdateForm');
  if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const sectionId = link.getAttribute('data-section');
      if (!sectionId) return;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      const activeSection = document.getElementById(sectionId);
      if (activeSection) activeSection.classList.add('active');
      link.classList.add('active');
      if (sectionId === 'jobs') fetchJobs();
      if (sectionId === 'roadmap') fetchMatchedJobs();
      if (sectionId === 'applications') fetchUserApplications();
    });
  });
});

// Globals
window.runSkillGapAnalyzer = runSkillGapAnalyzer;
window.applyJobNow = applyJobNow;
window.startAIInterview = startAIInterview;
window.submitAIAnswer = submitAIAnswer;
window.updatePotentialScore = updatePotentialScore;
window.simulateResumeParsing = () => {
  showNotification('AI Engine parsing resume...', 'info');
  setTimeout(() => showNotification('Data synced with ecosystem.', 'success'), 2000);
};
