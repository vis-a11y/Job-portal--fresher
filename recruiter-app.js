// ============================================
// RecruiterPro - Frontend Logic
// ============================================

const appState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  jobs: [],
  selectedJobId: null
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

// Actions
async function handlePostJob(e) {
  e.preventDefault();
  const data = {
    title: document.getElementById('jobTitle').value,
    company: document.getElementById('jobCompany').value,
    description: document.getElementById('jobDescription').value,
    skills_required: document.getElementById('jobSkills').value,
    job_type: document.getElementById('jobType').value,
    location: document.getElementById('jobLocation').value,
    salary_range_min: parseInt(document.getElementById('jobSalaryMin').value),
    salary_range_max: parseInt(document.getElementById('jobSalaryMax').value)
  };

  try {
    await apiCall('/jobs', 'POST', data);
    showNotification('Job listing published successfully!');
    e.target.reset();
  } catch (err) {}
}

async function fetchMyJobs() {
  try {
    const allJobs = await apiCall('/jobs');
    // Filter jobs by current recruiter if necessary - though the backend could handle this better
    // For now, let's just show all jobs from this company or keep simple
    const myJobs = allJobs.filter(j => j.company.toLowerCase().includes(appState.user.name.split(' ')[0].toLowerCase()) || true); 
    appState.jobs = myJobs;
    renderJobs();
  } catch (err) {}
}

function renderJobs() {
  const container = document.getElementById('recruiterJobsList');
  if (!container) return;
  container.innerHTML = appState.jobs.length ? '' : '<p class="muted">No jobs posted yet.</p>';
  
  appState.jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'card job-card glass';
    card.innerHTML = `
      <h4>${job.title}</h4>
      <p class="muted">${job.location} • ${job.job_type}</p>
      <div style="margin-top: 1rem;">
        <button class="btn-primary btn-sm" onclick="fetchApplicants(${job.id})">See Candidates</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function fetchApplicants(jobId) {
  try {
    const apps = await apiCall(`/recruiter/applications/${jobId}`);
    appState.selectedJobId = jobId;
    renderApplicants(apps);
    
    // Switch UI to applications section
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="viewApplications"]').classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('viewApplications').classList.add('active');
  } catch (err) {}
}

function renderApplicants(apps) {
  const container = document.getElementById('applicantsList');
  if (!container) return;
  container.innerHTML = apps.length ? '' : '<div class="card"><p class="muted">No candidates have applied for this position yet.</p></div>';
  
  apps.forEach(app => {
    const card = document.createElement('div');
    card.className = 'card glass applicant-card';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin:0; font-size: 1.25rem;">${app.name}</h4>
          <p class="muted" style="margin: 0.2rem 0;">${app.college || 'Verified Candidate'}</p>
        </div>
        <div class="score-pill" style="background: rgba(59, 130, 246, 0.1); padding: 0.5rem; border-radius: 10px; border: 1px solid var(--primary);">
          <span style="font-size: 0.75rem; color: var(--text-muted);">Potential:</span>
          <strong style="color: var(--primary);">${app.readiness_score}</strong>
        </div>
      </div>
      
      <div style="margin: 1.5rem 0; padding:1rem; background: rgba(255,255,255,0.03); border-radius: 12px;">
        <p style="font-size: 0.9rem;"><strong>Candidate Pitch:</strong><br>${app.pitch}</p>
      </div>

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
        <select class="status-select" onchange="handleStatusUpdate(${app.id}, this.value)" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;">
          <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
          <option value="Shortlisted" ${app.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
          <option value="Interview Scheduled" ${app.status === 'Interview Scheduled' ? 'selected' : ''}>Interview Scheduled</option>
          <option value="Selected" ${app.status === 'Selected' ? 'selected' : ''}>Hire / Select</option>
          <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Reject / Feedback</option>
        </select>
        <button class="btn-secondary btn-sm" onclick="alert('Email Sent to ${app.email}')">📞 Contact</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function handleStatusUpdate(appId, newStatus) {
  try {
    await apiCall(`/applications/${appId}/status`, 'PATCH', { status: newStatus });
    showNotification(`Candidate status updated to: ${newStatus}`);
  } catch (err) {}
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (!appState.token || appState.user.role !== 'recruiter' && appState.user.role !== 'admin') {
     // alert('Unauthorized access! Please login as recruiter.');
     // window.location.href = 'login.html';
  }

  const jobForm = document.getElementById('postJobForm');
  if (jobForm) jobForm.addEventListener('submit', handlePostJob);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('data-section');
      if (!id) return;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      link.classList.add('active');
      if (id === 'manageJobs') fetchMyJobs();
    });
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });
});

window.fetchApplicants = fetchApplicants;
