// ============================================
// LIGHT / DARK MODE
// ============================================
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

(function initTheme() {
  const saved = localStorage.getItem('fj_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon)  icon.textContent  = saved === 'light' ? '☀️' : '🌙';
  if (label) label.textContent = saved === 'light' ? 'Light' : 'Dark';
})();
window.toggleTheme = toggleTheme;

const appState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  users: [],
  jobs: []
};

const API_BASE = 'http://localhost:3000/api';

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
    const res = await fetch(API_BASE + endpoint, options);
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = 'login.html';
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    return data;
  } catch (err) {
    showNotification(err.message, 'error');
    throw err;
  }
}

function showNotification(message, type = 'success') {
  const note = document.createElement('div');
  note.className = `notification notification-${type}`;
  note.textContent = message;
  note.style.cssText = `
    position: fixed; top: 1.5rem; right: 1.5rem; 
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f43f5e, #e11d48)'}; 
    color: white; padding: 1.25rem 2rem; border-radius: 12px; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 10000;
    font-weight: 600; font-family: 'Outfit', sans-serif;
    border: 1px solid rgba(255,255,255,0.1);
  `;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 3000);
}

// Logic
async function fetchSystemSummary() {
  try {
     const data = await apiCall('/admin/summary');
     document.getElementById('adminTotalCandidates').textContent = data.totalUsers;
     document.getElementById('adminTotalRecruiters').textContent = data.totalJobs; // Or specific count if available
     
     // Update stats on dashboard
     const stats = document.querySelectorAll('.stat-val');
     if (stats[0]) stats[0].textContent = data.totalUsers;
     if (stats[1]) stats[1].textContent = data.totalJobs;
     
     renderRecentUsers(data.recentUsers);
     
     // Also fetch jobs for the verification list
     const jobs = await apiCall('/jobs');
     appState.jobs = jobs;
     renderJobs();
  } catch (err) {}
}

function renderRecentUsers(users) {
  const container = document.getElementById('adminUsersList');
  if (!container) return;
  container.innerHTML = users.length ? '' : '<p class="muted">No recent users.</p>';
  users.forEach(u => {
    const card = document.createElement('div');
    card.className = 'card glass';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h4 style="margin:0;">${u.name}</h4>
          <p class="muted">${u.email} · ${u.role}</p>
        </div>
        <span class="badge">${new Date(u.created_at).toLocaleDateString()}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderJobs() {
  const container = document.getElementById('adminJobsList');
  if (!container) return;
  container.innerHTML = appState.jobs.length ? '' : '<p class="muted">No jobs in queue.</p>';
  
  appState.jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'card job-card glass';
    card.innerHTML = `
      <h4 style="margin:0;">${job.title}</h4>
      <p class="muted">${job.company} • ${job.location}</p>
      <div class="row" style="margin-top: 1.5rem; gap: 0.75rem;">
        <button class="btn btn-primary btn-sm" onclick="approveJob(${job.id})">Approve</button>
        <button class="btn btn-secondary btn-sm" onclick="rejectJob(${job.id})">Flag Listing</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function approveJob(jobId) {
  showNotification('Job Approved for Live Platform! ✅');
}

async function rejectJob(jobId) {
  showNotification('Job Flagged for Verification! 🚩', 'error');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (!appState.token || appState.user.role !== 'admin') {
     // window.location.href = 'login.html';
  }

  fetchSystemSummary();

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('data-section');
      if (!id) return;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      const activeSection = document.getElementById(id);
      if (activeSection) activeSection.classList.add('active');
      link.classList.add('active');
    });
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });
});

window.approveJob = approveJob;
window.rejectJob = rejectJob;
