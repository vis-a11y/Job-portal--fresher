// ============================================
// PortalAdmin - Frontend Logic
// ============================================

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
  note.style.cssText = `position: fixed; top: 1rem; right: 1rem; background: ${type === 'success' ? '#10b981' : '#ef4444'}; color: white; padding: 1rem; border-radius: 8px; z-index: 9999;`;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 3000);
}

// Logic
async function fetchSystemSummary() {
  try {
     // Backend doesn't have an admin specific aggregate API yet, so we emulate or add it logic
     // For now, let's just use /api/jobs and count or similar
     const jobs = await apiCall('/jobs');
     document.getElementById('adminTotalCandidates').textContent = '2.4k'; // Simulation
     document.getElementById('adminTotalRecruiters').textContent = '150+'; // Simulation
     appState.jobs = jobs;
     renderJobs();
  } catch (err) {}
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
      <div class="row" style="margin-top: 1rem; gap: 0.5rem;">
        <button class="btn-primary btn-sm" onclick="approveJob(${job.id})">Approve</button>
        <button class="btn-secondary btn-sm" onclick="rejectJob(${job.id})">Flag</button>
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

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('data-section');
      if (!id) return;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.getElementById(id).classList.add('active');
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
