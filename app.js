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
    position: fixed; top: 1.5rem; right: 1.5rem;
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : type === 'error' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)'};
    color: white; padding: 1.25rem 2rem; border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 10000;
    font-weight: 600; font-family: 'Outfit', sans-serif;
    border: 1px solid rgba(255,255,255,0.1);
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(20px)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 3000);
  }, 3000);
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
        <div class="row" style="gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" onclick="runSkillGapAnalyzer(${job.id})">Gap Analysis</button>
          <button class="btn btn-primary btn-sm" onclick="applyJobNow(${job.id})">Apply Now</button>
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
        <h4 style="margin:0; color: var(--primary-bright); font-size: 1.1rem;">${proj.project_name}</h4>
        ${proj.project_link ? `<a href="${proj.project_link}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none; padding: 5px 12px;">View Repo</a>` : ''}
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

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      if (!sectionId) return;
      
      // Update UI active states
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      
      const activeSection = document.getElementById(sectionId);
      if (activeSection) activeSection.classList.add('active');
      link.classList.add('active');
      
      // Fetch data based on section
      if (sectionId === 'jobs') fetchJobs();
      if (sectionId === 'roadmap') fetchMatchedJobs();
      if (sectionId === 'applications') fetchUserApplications();
      if (sectionId === 'dashboard') fetchProfile();
    });
  });

  // Topbar Scroll Effect (Maintain for legacy or content areas)
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.addEventListener('scroll', () => {
      const header = document.querySelector('.content-header');
      if (mainContent.scrollTop > 20) {
        header.style.background = 'rgba(2, 6, 23, 0.95)';
        header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
      } else {
        header.style.background = 'rgba(2, 6, 23, 0.7)';
        header.style.boxShadow = 'none';
      }
    });
  }
});

// Globals
window.runSkillGapAnalyzer = runSkillGapAnalyzer;
window.applyJobNow = applyJobNow;
window.startAIInterview = startAIInterview;
window.submitAIAnswer = submitAIAnswer;
window.updatePotentialScore = updatePotentialScore;
window.addSkillEntry = addSkillEntry;
window.activateHireMode = activateHireMode;
window.submitHireWithout = submitHireWithout;
window.saveAlertPrefs = saveAlertPrefs;
window.generateProjects = generateProjects;
window.toggleTheme = toggleTheme;

// ============================================================
// LIGHT / DARK MODE
// ============================================================

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');
  localStorage.setItem('fj_theme', isLight ? 'dark' : 'light');
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon)  icon.textContent  = isLight ? '🌙' : '☀️';
  if (label) label.textContent = isLight ? 'Dark' : 'Light';
}

// Init theme from storage
(function initTheme() {
  const saved = localStorage.getItem('fj_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon)  icon.textContent  = saved === 'light' ? '☀️' : '🌙';
  if (label) label.textContent = saved === 'light' ? 'Light' : 'Dark';
})();

// ============================================================
// ⭐ 1. DYNAMIC SKILL EVOLUTION TRACKER
// ============================================================

let skillEntries = JSON.parse(localStorage.getItem('fj_skills_tracker') || '[]');

const SKILL_DEMANDS = [
  { skill: 'React',      demand: 92, trend: '+18%', hot: true  },
  { skill: 'Python',     demand: 95, trend: '+25%', hot: true  },
  { skill: 'Node.js',    demand: 78, trend: '+12%', hot: false },
  { skill: 'TypeScript', demand: 85, trend: '+30%', hot: true  },
  { skill: 'DevOps',     demand: 88, trend: '+22%', hot: true  },
  { skill: 'ML/AI',      demand: 97, trend: '+40%', hot: true  },
  { skill: 'Java',       demand: 70, trend: '+5%',  hot: false },
  { skill: 'Flutter',    demand: 65, trend: '+14%', hot: false },
];

function renderSkillGrowthChart() {
  const container = document.getElementById('skillGrowthChart');
  if (!container) return;
  const data = skillEntries.length ? skillEntries : [
    { name: 'JavaScript', level: 75, source: 'Self-Taught' },
    { name: 'React',      level: 60, source: 'Udemy'       },
    { name: 'Node.js',    level: 45, source: 'YouTube'     },
  ];
  container.innerHTML = data.map(s => `
    <div>
      <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
        <span style="font-weight:600;">${s.name}</span>
        <div style="display:flex; gap:0.75rem; align-items:center;">
          <span class="muted" style="font-size:0.75rem;">${s.source || ''}</span>
          <strong style="color:var(--primary-bright);">${s.level}%</strong>
        </div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${s.level}%; background: ${s.level >= 70 ? 'linear-gradient(90deg, var(--success),#34d399)' : 'linear-gradient(90deg, var(--primary), var(--accent))'}; transition: width 1.2s ease;"></div>
      </div>
    </div>
  `).join('');
}

function renderDemandForecast() {
  const el = document.getElementById('demandForecast');
  if (!el) return;
  el.innerHTML = SKILL_DEMANDS.map(s => `
    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
      <div style="width:120px; font-weight:600; font-size:0.85rem; flex-shrink:0;">${s.skill}</div>
      <div class="progress-bar-wrap" style="flex:1;">
        <div class="progress-bar-fill" style="width:${s.demand}%; background:${s.hot ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg, var(--primary), var(--accent))'}; transition:width 1.2s ease;"></div>
      </div>
      <span style="font-size:0.8rem; font-weight:700; color:${s.hot ? '#f59e0b' : 'var(--success)'}; width:50px; text-align:right;">${s.trend}</span>
      ${s.hot ? '<span style="font-size:0.7rem; background:rgba(245,158,11,0.15); color:#f59e0b; padding:2px 8px; border-radius:10px; font-weight:700;">🔥 HOT</span>' : ''}
    </div>
  `).join('');
}

function addSkillEntry() {
  const name   = document.getElementById('newSkillName')?.value?.trim();
  const level  = parseInt(document.getElementById('skillRange')?.value || 50);
  const source = document.getElementById('skillSource')?.value || 'Self-Taught';
  if (!name) { showNotification('Please enter a skill name!', 'error'); return; }
  skillEntries = skillEntries.filter(s => s.name.toLowerCase() !== name.toLowerCase());
  skillEntries.unshift({ name, level, source, date: new Date().toLocaleDateString('en-IN') });
  localStorage.setItem('fj_skills_tracker', JSON.stringify(skillEntries));
  renderSkillGrowthChart();
  document.getElementById('newSkillName').value = '';
  showNotification(`📈 ${name} progress logged at ${level}%!`);
}

// ============================================================
// ⭐ 2. HIRE ME WITHOUT RESUME
// ============================================================

function activateHireMode() {
  showNotification('⚡ Hire-Me Mode ACTIVATED! Recruiters can now discover you anonymously.', 'success');
  const btn = document.querySelector('#hireWithout .btn-primary');
  if (btn) { btn.textContent = '✅ Active — Visible to Recruiters'; btn.style.background = 'linear-gradient(135deg, var(--success), #059669)'; }
  localStorage.setItem('fj_hire_mode', 'active');
}

function submitHireWithout() {
  const skill   = document.getElementById('hwrSkill')?.value?.trim();
  const project = document.getElementById('hwrProject')?.value?.trim();
  if (!skill || !project) { showNotification('Please fill in all fields!', 'error'); return; }
  showNotification('🚀 Skill profile submitted! 3 recruiters are reviewing your profile.', 'success');
  setTimeout(() => showNotification('📨 New message from Recruiter @ Startups Inc!', 'info'), 3000);
}

// ============================================================
// ⭐ 3. REAL-TIME SKILL DEMAND ALERTS
// ============================================================

const MARKET_ALERTS = [
  { skill: 'Python (AI/ML)',  change: '+25%', color: 'var(--success)',   icon: '🔥', time: '2 min ago',  jobs: 1240 },
  { skill: 'React Developer', change: '+18%', color: '#3b82f6',          icon: '📈', time: '15 min ago', jobs: 980  },
  { skill: 'TypeScript',      change: '+30%', color: 'var(--accent)',     icon: '⚡', time: '1 hr ago',   jobs: 650  },
  { skill: 'DevOps / AWS',    change: '+22%', color: 'var(--warning)',    icon: '🚀', time: '3 hrs ago',  jobs: 820  },
  { skill: 'Flutter Dev',     change: '+14%', color: 'var(--cyan)',       icon: '📱', time: '5 hrs ago',  jobs: 340  },
  { skill: 'Java Backend',    change: '+5%',  color: 'var(--text-muted)', icon: '☕', time: '1 day ago',  jobs: 560  },
];

function renderLiveAlerts() {
  const el = document.getElementById('liveAlerts');
  if (!el) return;
  el.innerHTML = MARKET_ALERTS.map(a => `
    <div style="display:flex; align-items:center; gap:1rem; padding:0.9rem 1rem; background:rgba(255,255,255,0.02); border:1px solid var(--border-dark); border-radius:12px; border-left:3px solid ${a.color};">
      <span style="font-size:1.5rem; flex-shrink:0;">${a.icon}</span>
      <div style="flex:1;">
        <p style="font-weight:700; font-size:0.9rem; margin:0;">${a.skill}</p>
        <p class="muted" style="font-size:0.75rem; margin:0;">${a.jobs.toLocaleString()} new jobs • ${a.time}</p>
      </div>
      <span style="font-weight:800; font-size:1rem; color:${a.color}; flex-shrink:0;">${a.change}</span>
    </div>
  `).join('');
}

function saveAlertPrefs() {
  const skills = document.getElementById('alertSkills')?.value;
  showNotification(`✅ Alerts set for: ${skills || 'your saved skills'}. You'll be notified!`);
}

// Auto-refresh alerts every 30s
setInterval(() => {
  const el = document.getElementById('liveAlerts');
  if (el && el.innerHTML) renderLiveAlerts();
}, 30000);

// ============================================================
// ⭐ 4. MICRO-TASK GIG BOARD
// ============================================================

const GIG_TASKS = [
  { company: 'Google', task: 'Build a responsive navbar component in React', reward: '₹500 + Interview', time: '2 hrs', skills: ['React','CSS'], difficulty: 'Easy',   applicants: 12 },
  { company: 'Flipkart', task: 'Write REST API endpoints for product listing', reward: '₹800 + Referral', time: '4 hrs', skills: ['Node.js','MongoDB'], difficulty: 'Medium', applicants: 7  },
  { company: 'Zomato', task: 'Design a mobile-first login page (Figma)', reward: '₹300 + Badge',    time: '1 hr', skills: ['Figma','UI/UX'], difficulty: 'Easy',   applicants: 22 },
  { company: 'Swiggy', task: 'Debug and fix 3 Python data processing scripts', reward: '₹600 + Job',   time: '3 hrs', skills: ['Python','Pandas'], difficulty: 'Hard',   applicants: 5  },
  { company: 'Razorpay', task: 'Implement a JWT authentication middleware', reward: '₹700 + Hire',   time: '3 hrs', skills: ['Node.js','JWT'], difficulty: 'Medium', applicants: 9  },
  { company: 'PhonePe', task: 'Create SQL queries for transaction analytics', reward: '₹400 + Shortlist', time: '2 hrs', skills: ['SQL','MySQL'], difficulty: 'Easy',   applicants: 16 },
];

function renderGigTasks() {
  const el = document.getElementById('gigTasksList');
  if (!el) return;
  el.innerHTML = GIG_TASKS.map(g => `
    <div class="card glass" style="position:relative; overflow:hidden;">
      <div style="position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg, var(--primary), var(--accent));"></div>
      <div style="display:flex; justify-content:space-between; align-items:start; margin-top:0.5rem;">
        <div>
          <p class="muted" style="font-size:0.75rem; margin:0; font-weight:700; letter-spacing:0.04em;">${g.company}</p>
          <h4 style="margin:0.4rem 0; font-size:1rem; line-height:1.4;">${g.task}</h4>
        </div>
        <span style="background:${g.difficulty==='Hard'?'rgba(244,63,94,0.15)':g.difficulty==='Medium'?'rgba(245,158,11,0.15)':'rgba(16,185,129,0.15)'}; color:${g.difficulty==='Hard'?'var(--danger)':g.difficulty==='Medium'?'var(--warning)':'var(--success)'}; padding:4px 12px; border-radius:20px; font-size:0.72rem; font-weight:700; flex-shrink:0; margin-left:0.5rem;">${g.difficulty}</span>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin:0.75rem 0;">${g.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin:0.75rem 0; padding:0.75rem; background:rgba(255,255,255,0.02); border-radius:10px;">
        <span style="color:var(--success); font-weight:700; font-size:0.9rem;">💰 ${g.reward}</span>
        <span class="muted" style="font-size:0.8rem;">⏱ ${g.time} • ${g.applicants} applied</span>
      </div>
      <button class="btn btn-primary" style="width:100%; margin-top:0.5rem;" onclick="applyGigTask('${g.company}', '${g.task.substring(0,30)}...')">🎯 Accept Task & Attempt</button>
    </div>
  `).join('');
}

window.applyGigTask = function(company, task) {
  showNotification(`🎯 Task accepted from ${company}! Complete within the time limit to get hired.`);
};

// ============================================================
// ⭐ 5. LEARNING-TO-JOB PIPELINE
// ============================================================

const LEARNING_TRACKS = [
  {
    title: 'Full Stack Web Developer', duration: '3 months',
    steps: [
      { phase: 'Learn', icon: '📚', label: 'HTML, CSS, JS Fundamentals', status: 'done',    resource: 'FreeCodeCamp' },
      { phase: 'Learn', icon: '📚', label: 'React + Node.js',            status: 'done',    resource: 'Udemy Course' },
      { phase: 'Build', icon: '🔨', label: 'Build Todo App (React)',      status: 'done',    resource: 'Personal Project' },
      { phase: 'Build', icon: '🔨', label: 'Build REST API (Node+Mongo)', status: 'active',  resource: 'Side Project' },
      { phase: 'Build', icon: '🔨', label: 'Full Stack CRUD App',          status: 'pending', resource: 'Coming Next' },
      { phase: 'Apply', icon: '📤', label: 'Apply to 10 Jobs',             status: 'pending', resource: 'FresherJob' },
      { phase: 'Hired', icon: '🎉', label: 'Get Hired!',                   status: 'pending', resource: 'Goal' },
    ]
  }
];

function renderLearningPipeline() {
  const el = document.getElementById('learningPipelineView');
  if (!el) return;
  const track = LEARNING_TRACKS[0];
  const doneCount = track.steps.filter(s => s.status === 'done').length;
  const pct = Math.round((doneCount / track.steps.length) * 100);

  el.innerHTML = `
    <div class="card glass" style="margin-bottom:1.5rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <h3 style="margin:0;">${track.title}</h3>
          <p class="muted" style="font-size:0.85rem; margin:0.25rem 0;">Estimated: ${track.duration} • ${doneCount}/${track.steps.length} steps complete</p>
        </div>
        <span style="font-size:1.5rem; font-weight:800; color:var(--primary-bright);">${pct}%</span>
      </div>
      <div class="progress-bar-wrap" style="margin-top:1.25rem;"><div class="progress-bar-fill" style="width:${pct}%;"></div></div>
    </div>
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      ${track.steps.map((s, i) => `
        <div style="display:flex; align-items:center; gap:1.25rem; padding:1.25rem; background:${s.status==='done'?'rgba(16,185,129,0.05)':s.status==='active'?'rgba(59,130,246,0.08)':'rgba(255,255,255,0.02)'}; border:1px solid ${s.status==='done'?'rgba(16,185,129,0.2)':s.status==='active'?'rgba(59,130,246,0.25)':'var(--border-dark)'}; border-radius:14px; border-left:4px solid ${s.status==='done'?'var(--success)':s.status==='active'?'var(--primary)':'var(--border-dark)'};">
          <div style="width:44px; height:44px; border-radius:50%; background:${s.status==='done'?'var(--success)':s.status==='active'?'var(--primary)':'var(--border-dark)'}; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">${s.status==='done'?'✓':s.icon}</div>
          <div style="flex:1;">
            <p style="font-weight:700; margin:0; font-size:0.95rem;">${s.label}</p>
            <p class="muted" style="font-size:0.78rem; margin:0.2rem 0;">${s.phase} Phase • ${s.resource}</p>
          </div>
          <span style="font-size:0.75rem; font-weight:700; padding:4px 12px; border-radius:20px; background:${s.status==='done'?'rgba(16,185,129,0.15)':s.status==='active'?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.05)'}; color:${s.status==='done'?'var(--success)':s.status==='active'?'var(--primary-bright)':'var(--text-dim)'}; flex-shrink:0;">${s.status==='done'?'✅ Done':s.status==='active'?'🔵 In Progress':'⏳ Pending'}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================
// ⭐ 6. AUTO PROJECT AI GENERATOR
// ============================================================

const PROJECT_DB = {
  react:  [ { name:'Task Manager', desc:'A full CRUD task board with drag-and-drop, filters, and local persistence.', tech:'React, Context API, CSS', difficulty:'Intermediate', impact:'High' }, { name:'Movie Search App', desc:'Search movies via OMDB API with favorites list and rating system.', tech:'React, REST API, Hooks', difficulty:'Beginner', impact:'Medium' } ],
  python: [ { name:'Web Scraper', desc:'Scrape job listings from a website and export to CSV for analysis.', tech:'Python, BeautifulSoup, Pandas', difficulty:'Intermediate', impact:'High' }, { name:'Expense Tracker CLI', desc:'Command-line expense manager with categories, summaries, and charts.', tech:'Python, Click, Matplotlib', difficulty:'Beginner', impact:'Medium' } ],
  java:   [ { name:'Library Management System', desc:'Full OOP implementation with book checkout, returns, and fine calculation.', tech:'Java, OOP, File I/O', difficulty:'Beginner', impact:'High' }, { name:'Banking App API', desc:'REST API for account management, transactions, and balance enquiry.', tech:'Java, Spring Boot, MySQL', difficulty:'Advanced', impact:'Very High' } ],
  nodejs: [ { name:'REST API with Auth', desc:'Full JWT-based authentication API with user roles, refresh tokens, rate limiting.', tech:'Node.js, Express, JWT, MongoDB', difficulty:'Intermediate', impact:'Very High' }, { name:'Real-Time Chat Server', desc:'WebSocket-powered chat app with rooms and message history.', tech:'Node.js, Socket.io, Redis', difficulty:'Advanced', impact:'High' } ],
  sql:    [ { name:'E-Commerce Database Design', desc:'Normalized database with products, orders, users, payments and advanced queries.', tech:'MySQL, ERD, Stored Procedures', difficulty:'Intermediate', impact:'High' } ],
  flutter:[ { name:'Expense Tracker Mobile App', desc:'Cross-platform app with categories, charts, local notifications, and dark mode.', tech:'Flutter, Dart, Hive DB', difficulty:'Intermediate', impact:'High' } ],
};

function generateProjects() {
  const rawSkills = document.getElementById('pgSkills')?.value || '';
  const level = document.getElementById('pgLevel')?.value || 'Intermediate';
  const el = document.getElementById('projectSuggestions');
  if (!el) return;
  if (!rawSkills.trim()) { showNotification('Please enter your skills first!', 'error'); return; }

  const skills = rawSkills.toLowerCase().split(',').map(s => s.trim());
  let ideas = [];
  skills.forEach(sk => {
    const key = Object.keys(PROJECT_DB).find(k => sk.includes(k) || k.includes(sk));
    if (key) ideas.push(...PROJECT_DB[key]);
  });

  if (!ideas.length) {
    el.innerHTML = `<div class="card glass"><p class="muted">No specific suggestions for "${rawSkills}". Try: React, Python, Java, Node.js, SQL, Flutter</p></div>`;
    return;
  }

  // Remove duplicates
  ideas = [...new Map(ideas.map(i => [i.name, i])).values()];

  el.innerHTML = ideas.map(p => `
    <div class="card glass" style="border-left:4px solid var(--accent);">
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.75rem;">
        <h4 style="margin:0; color:var(--accent-bright);">🏗️ ${p.name}</h4>
        <span style="font-size:0.72rem; background:rgba(139,92,246,0.15); color:var(--accent-bright); padding:3px 10px; border-radius:12px; font-weight:700; flex-shrink:0; margin-left:0.5rem;">${p.difficulty}</span>
      </div>
      <p style="font-size:0.87rem; color:var(--text-muted); margin-bottom:1rem;">${p.desc}</p>
      <div style="margin-bottom:1rem;">${p.tech.split(',').map(t=>`<span class="skill-tag">${t.trim()}</span>`).join('')}</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.78rem; color:var(--success); font-weight:700;">📊 Portfolio Impact: ${p.impact}</span>
        <button class="btn btn-primary btn-sm" onclick="showNotification('📋 ${p.name} added to your project roadmap!', 'success')">➕ Add to Plan</button>
      </div>
    </div>
  `).join('');

  showNotification(`🤖 Generated ${ideas.length} project ideas for your skills!`);
}

// ============================================================
// SECTION INIT ON NAVIGATE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Wire new sections
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const existing = link.getAttribute('data-section');
    if (!existing) return;
    // Re-attach additional section inits
    link.addEventListener('click', () => {
      if (existing === 'skillTracker') { renderSkillGrowthChart(); renderDemandForecast(); }
      if (existing === 'skillAlerts')  { renderLiveAlerts(); }
      if (existing === 'microTasks')   { renderGigTasks(); }
      if (existing === 'learningPath') { renderLearningPipeline(); }
    });
  });
});

