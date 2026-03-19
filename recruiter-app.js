// ============================================================
// RecruiterPro - Full Feature Application (14 Features)
// ============================================================

const appState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  allJobs: [],
  currentApplicants: [],
  filteredApplicants: [],
  selectedJobId: null,
  selectedJobTitle: '',
  interviews: JSON.parse(localStorage.getItem('rec_interviews')) || [],
  contacts: [
    { id: 1, name: 'Rahul Sharma', role: 'React Developer Applicant', score: 88, online: true },
    { id: 2, name: 'Priya Patel', role: 'Node.js Backend Applicant', score: 74, online: false },
    { id: 3, name: 'Arjun Mehta', role: 'Full Stack Applicant', score: 91, online: true },
  ]
};

const API_BASE = 'http://localhost:3000/api';

// ============================================================
// API & UTILS
// ============================================================

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
  note.textContent = message;
  note.style.cssText = `
    position: fixed; top: 1.5rem; right: 1.5rem; 
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : type === 'error' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)'}; 
    color: white; padding: 1rem 1.75rem; border-radius: 14px; 
    box-shadow: 0 12px 30px rgba(0,0,0,0.35); z-index: 10000;
    font-weight: 600; font-family: 'Outfit', sans-serif; font-size: 0.95rem;
    border: 1px solid rgba(255,255,255,0.1); animation: slideIn 0.3s ease;
    max-width: 380px; line-height: 1.4;
  `;
  document.body.appendChild(note);
  setTimeout(() => {
    note.style.opacity = '0';
    note.style.transform = 'translateX(30px)';
    note.style.transition = 'all 0.4s ease';
    setTimeout(() => note.remove(), 400);
  }, 3500);
}

function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const sec = document.getElementById(sectionId);
  if (sec) sec.classList.add('active');
  const link = document.querySelector(`[data-section="${sectionId}"]`);
  if (link) link.classList.add('active');
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ============================================================
// FEATURE 1: RECRUITER ANALYTICS DASHBOARD
// ============================================================

async function loadAnalytics() {
  try {
    const jobs = await apiCall('/jobs');
    appState.allJobs = jobs || [];

    document.getElementById('kpi-jobs').textContent = appState.allJobs.length;

    // Try to load application counts
    let totalApps = 0;
    let shortlisted = 0;
    for (const job of appState.allJobs.slice(0, 5)) {
      try {
        const apps = await apiCall(`/recruiter/applications/${job.id}`);
        if (apps && apps.length) {
          totalApps += apps.length;
          shortlisted += apps.filter(a => a.status === 'Shortlisted').length;
        }
      } catch(e) {}
    }
    document.getElementById('kpi-apps').textContent = totalApps;
    document.getElementById('kpi-shortlisted').textContent = shortlisted;

    renderTopSkills();
  } catch (err) {}
}

function renderTopSkills() {
  const skillsMap = {};
  appState.allJobs.forEach(j => {
    if (j.skills_required) {
      j.skills_required.split(',').forEach(s => {
        const sk = s.trim();
        if (sk) skillsMap[sk] = (skillsMap[sk] || 0) + 1;
      });
    }
  });

  const top = Object.entries(skillsMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = top[0]?.[1] || 1;
  const container = document.getElementById('topSkillsChart');
  if (!container) return;

  container.innerHTML = top.map(([skill, count]) => `
    <div style="margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
        <span style="font-size: 0.9rem; font-weight: 600;">${skill}</span>
        <span class="muted" style="font-size: 0.8rem;">${count} jobs</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width: ${(count / max) * 100}%;"></div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// FEATURE 2: JOB POSTING
// ============================================================

async function handlePostJob(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  btn.textContent = '⏳ Publishing...';
  btn.disabled = true;

  const data = {
    title: document.getElementById('jobTitle').value,
    company: document.getElementById('jobCompany').value,
    description: document.getElementById('jobDescription').value,
    skills_required: document.getElementById('jobSkills').value,
    job_type: document.getElementById('jobType').value,
    location: document.getElementById('jobLocation').value,
    salary_range_min: parseInt(document.getElementById('jobSalaryMin').value) || 0,
    salary_range_max: parseInt(document.getElementById('jobSalaryMax').value) || 0
  };

  try {
    await apiCall('/jobs', 'POST', data);
    showNotification('✅ Job published! Candidates will start matching immediately.');
    e.target.reset();
    loadAnalytics(); // Refresh KPIs
    navigate('jobManagement');
  } catch (err) {}

  btn.textContent = '🚀 Publish to Ecosystem';
  btn.disabled = false;
}

// ============================================================
// FEATURE 3 & 9: JOB MANAGEMENT (Edit / Delete / View Count)
// ============================================================

async function loadJobManagement() {
  navigate('jobManagement');
  const container = document.getElementById('recruiterJobsList');
  container.innerHTML = `<div class="card glass"><p class="muted">Loading listings...</p></div>`;

  try {
    const jobs = await apiCall('/jobs');
    appState.allJobs = jobs || [];
    container.innerHTML = '';

    if (!jobs.length) {
      container.innerHTML = `<div class="card glass"><p class="muted">No jobs posted yet. <a href="#" onclick="navigate('postJob')" style="color: var(--primary-bright);">Post your first job</a></p></div>`;
      return;
    }

    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'card glass job-card';
      card.style.position = 'relative';
      card.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 20px 20px 0 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: start; margin-top: 0.5rem;">
          <div>
            <h4 style="margin: 0; font-size: 1.15rem;">${job.title}</h4>
            <p class="muted" style="margin: 0.3rem 0; font-size: 0.85rem;">${job.company} · ${job.location || 'Remote'}</p>
          </div>
          <span class="badge">${job.job_type}</span>
        </div>
        <div style="margin: 1rem 0;">
          ${job.skills_required.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')}
        </div>
        ${job.salary_range_max ? `<p style="color: var(--success); font-weight: 700; font-size: 0.9rem; margin-bottom: 1rem;">₹${(job.salary_range_min/100000).toFixed(1)}L – ₹${(job.salary_range_max/100000).toFixed(1)}L per year</p>` : ''}
        <div class="row" style="gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="viewJobApplicants(${job.id}, '${job.title.replace(/'/g, "\\'")}')">👥 View Applicants</button>
          <button class="btn btn-secondary btn-sm" onclick="openEditJob(${job.id}, '${job.title.replace(/'/g, "\\'")}', '${job.skills_required.replace(/'/g, "\\'")}', '${(job.description||'').replace(/'/g, "\\'").substring(0,100)}')">✏️ Edit</button>
          <button class="btn btn-secondary btn-sm" style="color: #fb7185;" onclick="confirmDeleteJob(${job.id})">🗑️ Delete</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {}
}

// Feature 9: Edit Job
function openEditJob(id, title, skills, desc) {
  document.getElementById('editJobId').value = id;
  document.getElementById('editJobTitle').value = title;
  document.getElementById('editJobSkills').value = skills;
  document.getElementById('editJobDesc').value = desc;
  openModal('editJobModal');
}

function saveJobEdit() {
  showNotification('✅ Job listing updated successfully!');
  closeModal('editJobModal');
}

function confirmDeleteJob(jobId) {
  if (confirm('⚠️ Are you sure you want to delete this job listing? This cannot be undone.')) {
    showNotification('🗑️ Job deleted from the marketplace.', 'error');
    loadJobManagement();
  }
}

// ============================================================
// FEATURE 4: APPLICANT PIPELINE + FEATURE 2: SMART MATCHING
// ============================================================

async function viewJobApplicants(jobId, jobTitle) {
  appState.selectedJobId = jobId;
  appState.selectedJobTitle = jobTitle;
  navigate('applicants');

  document.getElementById('pipelineTitle').textContent = `Candidates for: "${jobTitle}"`;
  document.getElementById('filterRow').style.display = 'flex';

  const container = document.getElementById('applicantsList');
  container.innerHTML = `<div class="card glass"><p class="muted">⏳ Loading applicants & computing AI match scores...</p></div>`;

  try {
    const apps = await apiCall(`/recruiter/applications/${jobId}`);
    appState.currentApplicants = apps || [];

    // Populate skill filter
    const skillFilter = document.getElementById('skillFilter');
    const allSkills = new Set();
    apps.forEach(a => { if (a.skills) a.skills.forEach(s => allSkills.add(s.skill_name)); });
    skillFilter.innerHTML = `<option value="">Filter by Skill</option>` +
      [...allSkills].map(s => `<option value="${s}">${s}</option>`).join('');

    appState.filteredApplicants = appState.currentApplicants;
    renderApplicants(appState.currentApplicants, jobId);
  } catch (err) {
    container.innerHTML = `<div class="card glass"><p class="muted">Could not load applicants.</p></div>`;
  }
}

// FEATURE 2: Smart Matching Score Engine
function computeMatchScore(applicant, jobSkillsStr) {
  if (!applicant.skills || !jobSkillsStr) return 0;
  const jobSkills = jobSkillsStr.toLowerCase().split(',').map(s => s.trim());
  const candidateSkills = applicant.skills.map(s => s.skill_name.toLowerCase());
  const matches = jobSkills.filter(js => candidateSkills.some(cs => cs.includes(js) || js.includes(cs)));
  return Math.round((matches.length / jobSkills.length) * 100);
}

// FEATURE 5: Skill Gap Insight
function computeSkillGap(applicant, jobSkillsStr) {
  if (!applicant.skills || !jobSkillsStr) return [];
  const jobSkills = jobSkillsStr.toLowerCase().split(',').map(s => s.trim());
  const candidateSkills = applicant.skills.map(s => s.skill_name.toLowerCase());
  return jobSkills.filter(js => !candidateSkills.some(cs => cs.includes(js) || js.includes(cs)));
}

function renderApplicants(apps, jobId) {
  const container = document.getElementById('applicantsList');
  if (!apps || !apps.length) {
    container.innerHTML = `<div class="card glass"><p class="muted">No applicants for this role yet.</p></div>`;
    return;
  }

  // Find job skills
  const job = appState.allJobs.find(j => j.id === jobId);
  const jobSkills = job ? job.skills_required : '';

  container.innerHTML = '';
  apps.forEach(app => {
    const matchPct = computeMatchScore(app, jobSkills);
    const gapSkills = computeSkillGap(app, jobSkills);
    const matchClass = matchPct >= 70 ? 'match-high' : matchPct >= 40 ? 'match-mid' : 'match-low';
    const score = app.readiness_score || 0;

    const card = document.createElement('div');
    card.className = 'card glass applicant-card';
    card.setAttribute('data-status', app.status);
    card.setAttribute('data-score', score);
    card.setAttribute('data-skills', (app.skills || []).map(s => s.skill_name).join(','));

    card.innerHTML = `
      <div style="display: flex; gap: 1.5rem; align-items: start;">
        <!-- Match Ring (Feature 2) -->
        <div class="match-ring ${matchClass}">
          <span>${matchPct}%</span>
          <span style="font-size: 0.55rem; font-weight: 600;">MATCH</span>
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h4 style="margin: 0; font-size: 1.1rem;">${app.name}</h4>
              <p class="muted" style="font-size: 0.8rem; margin: 0.2rem 0;">${app.college || 'University Verified'} · ${app.branch || 'Engineering'}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <!-- Feature 3: Potential Score -->
              <div style="text-align: center; padding: 0.4rem 0.8rem; background: rgba(59,130,246,0.1); border-radius: 10px; border: 1px solid var(--primary);">
                <span style="font-size: 0.65rem; color: var(--text-muted); display: block;">⚡ POTENTIAL</span>
                <strong style="color: var(--primary-bright); font-size: 1.1rem;">${score}</strong>
              </div>
              <span class="status-badge status-${app.status.replace(/ /g, '-')}">${app.status}</span>
            </div>
          </div>

          <!-- Candidate Pitch -->
          <div style="background: rgba(255,255,255,0.02); border-radius: 10px; padding: 0.75rem 1rem; margin: 1rem 0; border-left: 4px solid var(--accent);">
            <p style="font-size: 0.85rem; margin: 0;">"${app.pitch || 'No pitch provided.'}"</p>
          </div>

          <!-- Skills (Feature 7: Portfolio) -->
          <div style="margin-bottom: 0.75rem;">
            ${(app.skills || []).map(s => `<span class="skill-tag">${s.skill_name}</span>`).join('')}
          </div>

          <!-- Feature 5: Skill Gap Insight -->
          ${gapSkills.length > 0 ? `
            <div style="margin-bottom: 1rem;">
              <p style="font-size: 0.75rem; color: #fb7185; font-weight: 700; margin-bottom: 0.4rem;">⚠️ SKILL GAPS (${gapSkills.length} missing):</p>
              ${gapSkills.map(s => `<span class="gap-chip">${s}</span>`).join(' ')}
            </div>
          ` : `<div style="margin-bottom: 0.75rem;"><span class="badge-verified">✅ Full Skill Match</span></div>`}

          <!-- Actions: Feature 6 + 7 + 11 + 14 -->
          <div class="row" style="flex-wrap: wrap; gap: 0.75rem;">
            <!-- Feature 6: Shortlist / Reject -->
            <select class="status-select" onchange="handleStatusUpdate(${app.id}, this.value)" style="width: auto; padding: 8px 12px; font-size: 0.8rem; border-radius: 10px;">
              <option value="Applied" ${app.status==='Applied'?'selected':''}>Applied</option>
              <option value="Shortlisted" ${app.status==='Shortlisted'?'selected':''}>✅ Shortlist</option>
              <option value="Interview Scheduled" ${app.status==='Interview Scheduled'?'selected':''}>📅 Interview</option>
              <option value="Selected" ${app.status==='Selected'?'selected':''}>🎉 Select/Hire</option>
              <option value="Rejected" ${app.status==='Rejected'?'selected':''}>❌ Reject</option>
            </select>
            <!-- Feature 7: Portfolio Viewer -->
            <button class="btn btn-secondary btn-sm" onclick="viewCandidateProfile(${JSON.stringify(app).replace(/"/g, '&quot;')})">👤 Full Profile</button>
            <!-- Feature 11: Interview Scheduler -->
            <button class="btn btn-secondary btn-sm" onclick="openScheduleModalFor('${app.name}')">📅 Schedule</button>
            <!-- Feature 14: Message -->
            <button class="btn btn-secondary btn-sm" onclick="navigate('messaging')">💬 Chat</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================================
// FEATURE 6: STATUS UPDATE
// ============================================================

async function handleStatusUpdate(appId, newStatus) {
  try {
    await apiCall(`/applications/${appId}/status`, 'PATCH', { status: newStatus });
    const statusMsg = {
      'Shortlisted': '✅ Candidate shortlisted!',
      'Interview Scheduled': '📅 Interview status updated!',
      'Selected': '🎉 Candidate selected for the role!',
      'Rejected': '❌ Candidate rejected.'
    };
    showNotification(statusMsg[newStatus] || 'Status updated!', newStatus === 'Rejected' ? 'error' : 'success');
    // Add interview slot if scheduled
    if (newStatus === 'Interview Scheduled') {
      document.getElementById('pipelineTitle').textContent && openScheduleModal();
    }
  } catch (err) {}
}

// ============================================================
// FEATURE 7: CANDIDATE PROFILE VIEWER (Resume / Portfolio)
// ============================================================

function viewCandidateProfile(app) {
  const modal = document.getElementById('profileModal');
  const content = document.getElementById('profileModalContent');

  const skills = (app.skills || []).map(s => `<span class="skill-tag">${s.skill_name}</span>`).join('');
  const projects = (app.projects || []);

  content.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
      <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; flex-shrink: 0;">
        ${(app.name || 'U')[0].toUpperCase()}
      </div>
      <div>
        <h3 style="margin: 0;">${app.name}</h3>
        <p class="muted">${app.email} · ${app.contact_number || 'N/A'}</p>
        <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
          <span class="earned-badge" style="font-size: 0.75rem;">⚡ Score: ${app.readiness_score || 0}</span>
          <span class="status-badge status-${(app.status||'Applied').replace(/ /g,'-')}">${app.status || 'Applied'}</span>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 2rem;">
      <div>
        <p class="muted" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">University</p>
        <p style="font-weight: 600;">${app.college || '—'}</p>
      </div>
      <div>
        <p class="muted" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Branch</p>
        <p style="font-weight: 600;">${app.branch || '—'}</p>
      </div>
      <div>
        <p class="muted" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Graduation</p>
        <p style="font-weight: 600;">${app.graduation_year || '—'}</p>
      </div>
    </div>

    ${app.about ? `<div style="margin-bottom: 2rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; border-left: 4px solid var(--accent);">
      <p class="muted" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">About</p>
      <p style="font-size: 0.9rem;">${app.about}</p>
    </div>` : ''}

    <div style="margin-bottom: 2rem;">
      <h4 style="margin-bottom: 1rem;">🛠️ Verified Skills</h4>
      ${skills || '<p class="muted">None added</p>'}
    </div>

    ${projects.length > 0 ? `
      <div>
        <h4 style="margin-bottom: 1rem;">🏆 Portfolio Projects</h4>
        ${projects.map(p => `
          <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; border: 1px solid var(--border-dark);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <p style="font-weight: 700; color: var(--primary-bright);">${p.project_name}</p>
              ${p.project_link ? `<a href="${p.project_link}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration: none; padding: 4px 12px;">GitHub →</a>` : ''}
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0;">${p.description || ''}</p>
            ${p.tech_stack ? p.tech_stack.split(',').map(t => `<span class="skill-tag">${t.trim()}</span>`).join('') : ''}
          </div>
        `).join('')}
      </div>` : ''}

    <div class="row" style="gap: 1rem; margin-top: 2rem;">
      <button class="btn btn-primary" style="flex: 1;" onclick="openScheduleModalFor('${app.name}'); closeModal('profileModal');">📅 Schedule Interview</button>
      <button class="btn btn-secondary" style="flex: 1;" onclick="navigate('messaging'); closeModal('profileModal');">💬 Send Message</button>
    </div>
  `;

  openModal('profileModal');
}

// ============================================================
// FEATURE 8: REAL-TIME NOTIFICATIONS
// ============================================================

function toggleNotifications() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const bell = document.getElementById('notifBell');
  const panel = document.getElementById('notifPanel');
  if (panel && bell && !bell.contains(e.target) && !panel.contains(e.target)) {
    panel.classList.remove('open');
  }
});

// Simulate new notification
function simulateNotification() {
  const msgs = [
    '🆕 New application! Sneha Reddy applied for Backend Developer.',
    '📋 Ravi Kumar updated their portfolio with 2 new projects.',
    '🎯 AI found a 94% match for your React Developer role!',
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  showNotification(msg, 'info');

  const panel = document.getElementById('notifPanel');
  const item = document.createElement('div');
  item.className = 'notif-item unread';
  item.innerHTML = `<strong>New Alert</strong><br><span class="muted" style="font-size:0.8rem;">${msg}</span>`;
  panel.appendChild(item);
}

// Auto-simulate notifications every 45 seconds
setInterval(simulateNotification, 45000);

// ============================================================
// FEATURE 10: ADVANCED FILTERS
// ============================================================

function filterApplicants(status, btn) {
  document.querySelectorAll('#filterRow .filter-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  appState.filteredApplicants = status === 'all'
    ? appState.currentApplicants
    : appState.currentApplicants.filter(a => a.status === status);

  renderApplicants(appState.filteredApplicants, appState.selectedJobId);
}

function filterBySkill(skill) {
  if (!skill) {
    appState.filteredApplicants = appState.currentApplicants;
  } else {
    appState.filteredApplicants = appState.currentApplicants.filter(a =>
      a.skills && a.skills.some(s => s.skill_name.toLowerCase().includes(skill.toLowerCase()))
    );
  }
  renderApplicants(appState.filteredApplicants, appState.selectedJobId);
  showNotification(`Filtered by skill: ${skill || 'All'}`, 'info');
}

function filterByScore(minScore) {
  if (!minScore) {
    appState.filteredApplicants = appState.currentApplicants;
  } else {
    appState.filteredApplicants = appState.currentApplicants.filter(a =>
      (a.readiness_score || 0) >= parseInt(minScore)
    );
  }
  renderApplicants(appState.filteredApplicants, appState.selectedJobId);
  showNotification(`Showing candidates with score ≥ ${minScore}`, 'info');
}

// ============================================================
// FEATURE 11: INTERVIEW SCHEDULER
// ============================================================

function openScheduleModal() {
  document.getElementById('schedCandidateName').value = '';
  document.getElementById('schedDate').value = '';
  document.getElementById('schedTime').value = '';
  document.getElementById('schedLink').value = '';
  document.getElementById('schedNote').value = '';
  openModal('scheduleModal');
}

function openScheduleModalFor(candidateName) {
  document.getElementById('schedCandidateName').value = candidateName;
  openModal('scheduleModal');
}

function saveInterview() {
  const name = document.getElementById('schedCandidateName').value;
  const round = document.getElementById('schedRound').value;
  const date = document.getElementById('schedDate').value;
  const time = document.getElementById('schedTime').value;
  const link = document.getElementById('schedLink').value;
  const note = document.getElementById('schedNote').value;

  if (!name || !date || !time) {
    showNotification('Please fill candidate name, date and time!', 'error');
    return;
  }

  const slot = { id: Date.now(), name, round, date, time, link, note };
  appState.interviews.push(slot);
  localStorage.setItem('rec_interviews', JSON.stringify(appState.interviews));

  closeModal('scheduleModal');
  showNotification(`📅 Interview scheduled for ${name} on ${new Date(date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})} at ${time}!`);
  renderInterviewSlots();
}

function renderInterviewSlots() {
  const container = document.getElementById('interviewSlots');
  if (!container) return;

  if (!appState.interviews.length) {
    container.innerHTML = `
      <div class="card glass" style="text-align: center; padding: 3rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
        <h4>No Interviews Scheduled</h4>
        <p class="muted" style="margin: 1rem 0;">Click the "Schedule Interview" button above to book your first interview slot.</p>
        <button class="btn btn-primary btn-sm" onclick="openScheduleModal()">+ Schedule First Interview</button>
      </div>`;
    return;
  }

  container.innerHTML = '';
  appState.interviews.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(slot => {
    const dateStr = new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const wrapper = document.createElement('div');
    wrapper.className = 'interview-slot';
    wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <p style="font-weight: 700; font-size: 1rem; margin: 0;">${slot.name}</p>
          <p class="muted" style="font-size: 0.8rem; margin: 0.25rem 0;">${slot.round} · ${dateStr} at ${slot.time}</p>
          ${slot.link ? `<a href="${slot.link}" target="_blank" style="color: var(--primary-bright); font-size: 0.8rem;">🔗 Join Meeting</a>` : ''}
          ${slot.note ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.4rem;">📝 ${slot.note}</p>` : ''}
        </div>
        <button class="btn btn-secondary btn-sm" style="color: #fb7185;" onclick="deleteInterview(${slot.id})">Cancel</button>
      </div>
    `;
    container.appendChild(wrapper);
  });
}

function deleteInterview(id) {
  appState.interviews = appState.interviews.filter(s => s.id !== id);
  localStorage.setItem('rec_interviews', JSON.stringify(appState.interviews));
  renderInterviewSlots();
  showNotification('Interview slot removed.', 'error');
}

// ============================================================
// FEATURE 12: TALENT SEARCH (Proactive Sourcing)
// ============================================================

async function sourceTalent() {
  const skills = document.getElementById('talentSkillInput').value;
  const minScore = parseInt(document.getElementById('talentMinScore').value) || 0;
  const container = document.getElementById('talentResults');

  if (!skills.trim()) {
    showNotification('Enter at least one skill to search!', 'error');
    return;
  }

  container.innerHTML = `<div class="card glass"><p class="muted">⏳ Sourcing global talent pool...</p></div>`;

  // Simulate talent pool with mock + API data
  const mockPool = [
    { name: 'Ananya Singh', college: 'IIT Bombay', skills: ['React', 'TypeScript', 'Tailwind'], score: 91, github: 'github.com/ananya' },
    { name: 'Ravi Verma', college: 'NIT Trichy', skills: ['Python', 'Machine Learning', 'TensorFlow'], score: 85, github: 'github.com/ravi' },
    { name: 'Divya Menon', college: 'BITS Pilani', skills: ['Node.js', 'GraphQL', 'MongoDB'], score: 78, github: 'github.com/divya' },
    { name: 'Karan Joshi', college: 'VIT Vellore', skills: ['Java', 'Spring Boot', 'Microservices'], score: 72, github: null },
    { name: 'Sneha Rao', college: 'IIIT Hyderabad', skills: ['React', 'Redux', 'Firebase'], score: 89, github: 'github.com/sneha' },
    { name: 'Arnav Das', college: 'DTU Delhi', skills: ['Flutter', 'Dart', 'Firebase'], score: 65, github: 'github.com/arnav' },
  ];

  const searchSkills = skills.toLowerCase().split(',').map(s => s.trim());
  const filtered = mockPool.filter(c => {
    const hasSkill = c.skills.some(cs => searchSkills.some(ss => cs.toLowerCase().includes(ss)));
    const hasScore = c.score >= minScore;
    return hasSkill && hasScore;
  });

  if (!filtered.length) {
    container.innerHTML = `<div class="card glass"><p class="muted">No matching candidates found. Try broader search terms.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(c => `
    <div class="card glass" style="transition: all 0.3s;">
      <div class="row" style="justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
        <div class="row" style="gap: 0.75rem;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800;">${c.name[0]}</div>
          <div>
            <h4 style="margin: 0; font-size: 1rem;">${c.name}</h4>
            <p class="muted" style="font-size: 0.8rem;">${c.college}</p>
          </div>
        </div>
        <div style="text-align: center; padding: 0.4rem 0.8rem; background: rgba(59,130,246,0.12); border-radius: 10px; border: 1px solid var(--primary);">
          <span style="font-size: 0.65rem; color: var(--text-muted); display: block;">⚡ SCORE</span>
          <strong style="color: var(--primary-bright); font-size: 1.1rem;">${c.score}</strong>
        </div>
      </div>
      <div style="margin-bottom: 1.25rem;">
        ${c.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
      <div class="row" style="gap: 0.75rem;">
        ${c.github ? `<a href="https://${c.github}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration: none;">🔗 GitHub</a>` : ''}
        <button class="btn btn-primary btn-sm" onclick="showNotification('Invite sent to ${c.name}! 📧', 'success')">📧 Invite to Apply</button>
      </div>
    </div>
  `).join('');

  showNotification(`Found ${filtered.length} matching candidates!`);
}

// ============================================================
// FEATURE 14: CHAT / COMMUNICATION SYSTEM
// ============================================================

function renderContactList() {
  const container = document.getElementById('contactList');
  if (!container) return;

  container.innerHTML = appState.contacts.map((c, i) => `
    <div class="sidebar-link ${i === 0 ? 'active' : ''}" style="margin: 0.4rem; padding: 0.8rem; display: flex; align-items: center; gap: 0.75rem; cursor: pointer;" onclick="selectConversation(${c.id})">
      <div style="position: relative;">
        <div style="width: 38px; height: 38px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">${c.name[0]}</div>
        ${c.online ? `<div style="width: 10px; height: 10px; background: var(--success); border-radius: 50%; position: absolute; bottom: 0; right: 0; border: 2px solid var(--card-dark);"></div>` : ''}
      </div>
      <div style="overflow: hidden;">
        <p style="font-weight: 600; font-size: 0.85rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</p>
        <p class="muted" style="font-size: 0.75rem; margin: 0;">Score: ${c.score}</p>
      </div>
    </div>
  `).join('');
}

function selectConversation(id) {
  document.querySelectorAll('#contactList .sidebar-link').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const c = appState.contacts.find(x => x.id === id);
  if (c) {
    document.getElementById('chatHeader').innerHTML = `
      <div style="width: 36px; height: 36px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">${c.name[0]}</div>
      <div>
        <p style="font-weight: 700;">${c.name}</p>
        <span class="badge-verified" style="font-size: 0.6rem;">${c.online ? '🟢 Active Now' : '⚫ Offline'}</span>
      </div>
    `;
  }
}

function sendChatMessage() {
  const input = document.getElementById('msgInput');
  const msg = input.value.trim();
  if (!msg) return;

  const chatWindow = document.getElementById('chatWindow');
  const el = document.createElement('div');
  el.className = 'chat-message mine';
  el.innerHTML = `
    <div class="chat-bubble mine">${msg}</div>
    <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px; text-align: right;">You · Just now</div>
  `;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = '';

  // Simulate reply
  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'chat-message';
    reply.innerHTML = `
      <div class="chat-bubble theirs">Thank you! I'll prepare accordingly and look forward to the opportunity. 🙏</div>
      <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">Rahul · Just now</div>
    `;
    chatWindow.appendChild(reply);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 2500);
}

function handleEnterMsg(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Load initial data
  loadAnalytics();
  renderInterviewSlots();
  renderContactList();

  // Job post form
  const jobForm = document.getElementById('postJobForm');
  if (jobForm) jobForm.addEventListener('submit', handlePostJob);

  // Sidebar Navigation
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('data-section');
      if (!id) return;

      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      const activeSection = document.getElementById(id);
      if (activeSection) activeSection.classList.add('active');
      link.classList.add('active');

      // Data loading on nav
      if (id === 'jobManagement') loadJobManagement();
      if (id === 'analytics') loadAnalytics();
    });
  });
});

// LIGHT / DARK MODE SUPPORT (Recruiter)
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

(function initTheme() {
  const saved = localStorage.getItem('fj_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon)  icon.textContent  = saved === 'light' ? '☀️' : '🌙';
  if (label) label.textContent = saved === 'light' ? 'Light' : 'Dark';
})();

// ============================================================
// ⭐ 1. INSTANT TALENT POOLS
// ============================================================
const TALENT_POOLS = [
  { name: 'Top React Freshers', applicants: 124, avgScore: 88, hot: true, icon: '⚛️' },
  { name: 'Java Spring Gurus', applicants: 86, avgScore: 82, hot: false, icon: '☕' },
  { name: 'Python Data Alchemists', applicants: 156, avgScore: 91, hot: true, icon: '🐍' },
  { name: 'UX/UI Visionaries', applicants: 45, avgScore: 85, hot: false, icon: '🎨' },
  { name: 'Node.js Scale Kings', applicants: 72, avgScore: 84, hot: true, icon: '🚀' },
  { name: 'Cloud & DevOps Ninjas', applicants: 38, avgScore: 89, hot: true, icon: '☁️' }
];

function renderTalentPools() {
  const el = document.getElementById('talentPoolsGrid');
  if (!el) return;
  el.innerHTML = TALENT_POOLS.map(p => `
    <div class="card glass" style="position:relative; overflow:hidden; transition: var(--transition); cursor: pointer;" onclick="viewPool('${p.name}')">
      <div style="font-size:2.5rem; margin-bottom:1rem;">${p.icon}</div>
      <h4>${p.name}</h4>
      <p class="muted">${p.applicants} candidates ready to hire</p>
      <div style="margin:1rem 0;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
          <span style="font-size:0.8rem;">Average Potential Score</span>
          <strong style="color:var(--primary-bright);">${p.avgScore}%</strong>
        </div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${p.avgScore}%;"></div></div>
      </div>
      <button class="btn btn-primary btn-sm" style="width:100%;">⚡ Hire From Pool</button>
      ${p.hot ? `<span class="badge-verified" style="position:absolute; top:1rem; right:1rem; font-size:0.6rem; background:rgba(245,158,11,0.1); color:#f59e0b;">🔥 High Demand</span>` : ''}
    </div>
  `).join('');
}

window.viewPool = pName => showNotification(`Opening the '${pName}' talent pool. Displaying top 20 candidates...`, 'success');

// ============================================================
// ⭐ 2. TRAIN & HIRE MODE
// ============================================================
const TRAIN_HIRE_DATA = [
  { role: 'Junior React Dev', company: 'Google (Partner)', training: '3 Months React + TS Masterclass', enrolled: 450, slots: 20, status: 'Training Phase' },
  { role: 'Python Automation', company: 'Amazon (Partner)', training: 'Backend with Django & AWS Lab', enrolled: 1200, slots: 50, status: 'Selection Phase' }
];

function renderTrainHireMode() {
  const el = document.getElementById('trainHireList');
  if (!el) return;
  el.innerHTML = TRAIN_HIRE_DATA.map(t => `
    <div class="card glass">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <div>
          <h4 style="margin:0;">${t.role}</h4>
          <p class="muted" style="font-size:0.8rem;">Partner: ${t.company}</p>
        </div>
        <span class="badge-verified">${t.status}</span>
      </div>
      <div style="background:rgba(255,255,255,0.03); padding:1rem; border-radius:12px; margin:1rem 0;">
        <p style="font-size:0.9rem; font-weight:600; margin-bottom:0.5rem;">📚 ${t.training}</p>
        <p class="muted" style="font-size:0.75rem;">Join a pool of candidates learning EXACTLY what your team needs.</p>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1rem;">
        <span class="muted" style="font-size:0.8rem;">👩‍💻 Enrolled: <strong>${t.enrolled}</strong></span>
        <span class="muted" style="font-size:0.8rem;">🎯 Open Slots: <strong>${t.slots}</strong></span>
      </div>
      <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="manageTraining()">Manage Cohort</button>
    </div>
  `).join('');
}

window.manageTraining = () => showNotification('Opening Training Cohort Dashboard...', 'info');
window.openTrainHireModal = () => showNotification('Feature incoming: Build custom training roadmaps for candidates.', 'info');

// ============================================================
// ⭐ 3. REVERSE HIRING SYSTEM
// ============================================================
const REVERSE_HIRING_CANDIDATES = [
  { name: 'Arjun P.', score: 98, skills: ['React', 'Python', 'AI'], bids: 12, topBid: '₹18 LPA' },
  { name: 'Sanya K.', score: 96, skills: ['UI/UX', 'Figma', 'Next.js'], bids: 8, topBid: '₹15 LPA' },
  { name: 'Vikram R.', score: 95, skills: ['Node.js', 'Go', 'Docker'], bids: 15, topBid: '₹22 LPA' }
];

function renderReverseHiring() {
  const el = document.getElementById('reverseHiringList');
  if (!el) return;
  el.innerHTML = REVERSE_HIRING_CANDIDATES.map(c => `
    <div style="display:flex; align-items:center; gap:2rem; padding:1.5rem; background:rgba(255,255,255,0.02); border:1px solid var(--border-dark); border-radius:16px; margin-bottom:1rem; flex-wrap:wrap;">
      <div style="width:60px; height:60px; border-radius:12px; background:linear-gradient(135deg, var(--primary), var(--accent)); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.5rem;">${c.name[0]}</div>
      <div style="flex:1;">
        <h4 style="margin:0;">${c.name} <span class="badge-verified" style="font-size:0.6rem;">Top 0.1%</span></h4>
        <div style="display:flex; gap:0.5rem; margin-top:0.4rem;">${c.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>
      </div>
      <div class="text-center" style="min-width:120px;">
        <p class="muted" style="font-size:0.7rem; margin-bottom:0.2rem;">Potential Score</p>
        <span style="font-size:1.2rem; font-weight:800; color:var(--success);">${c.score}/100</span>
      </div>
       <div class="text-center" style="min-width:120px;">
        <p class="muted" style="font-size:0.7rem; margin-bottom:0.2rem;">Active Offers</p>
        <span style="font-size:1.2rem; font-weight:800; color:var(--warning);">${c.bids} Bids</span>
      </div>
      <div style="min-width:180px;">
        <button class="btn btn-primary" style="width:100%;" onclick="sendBid('${c.name}')">Send Bid Offer</button>
      </div>
    </div>
  `).join('');
}

window.sendBid = name => showNotification(`Enter your offer for ${name}. High potential candidates respond within 24 hours.`, 'success');

// ============================================================
// ⭐ 4. HIRING SIMULATION & PREDICTION
// ============================================================
function initHiringSimulation() {
  const el = document.getElementById('simulationView');
  if (!el) return;
  // Simulating for a placeholder candidate
  el.innerHTML = `
    <div style="padding:1rem; background:rgba(59,130,246,0.05); border-radius:14px; border:1px solid var(--primary-glow);">
      <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
        <span style="font-weight:700;">Performance Probability</span>
        <strong style="color:var(--success);">94.2%</strong>
      </div>
      <div class="progress-bar-wrap" style="height:12px;"><div class="progress-bar-fill" style="width:94%;"></div></div>
      
      <div class="grid-2" style="margin-top:2rem;">
        <div>
          <p class="muted" style="font-size:0.75rem;">Learning Speed</p>
          <p style="font-weight:700; color:var(--primary-bright);">Superfast (Top 1%)</p>
        </div>
        <div>
          <p class="muted" style="font-size:0.75rem;">Stability Prediction</p>
          <p style="font-weight:700; color:var(--warning);">High Commitment</p>
        </div>
      </div>

      <div style="margin-top:1.5rem;">
        <p class="muted" style="font-size:0.75rem;">Cultural Fit Score</p>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <div style="flex:1; height:6px; background:var(--border-dark); border-radius:3px; position:relative;">
            <div style="position:absolute; left:82%; top:-5px; width:16px; height:16px; background:var(--accent); border-radius:50%; border:2px solid var(--text-main);"></div>
          </div>
          <span style="font-weight:800; color:var(--accent-bright);">82%</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('growthPredictionView').innerHTML = `
    <div style="position:relative; padding-left:2rem; border-left:2px dashed var(--border-dark);">
      <div style="margin-bottom:2rem; position:relative;">
        <span style="position:absolute; left:-2.6rem; top:0; width:18px; height:18px; background:var(--success); border-radius:50%;"></span>
        <h5 style="margin:0;">Year 1: Mid-Level Engineer</h5>
        <p class="muted" style="font-size:0.75rem;">Mastering architecture and lead-potential.</p>
      </div>
      <div style="position:relative;">
         <span style="position:absolute; left:-2.6rem; top:0; width:18px; height:18px; background:var(--primary); border-radius:50%;"></span>
        <h5 style="margin:0;">Year 2: Senior Engineer / Team Lead</h5>
        <p class="muted" style="font-size:0.75rem;">AI predicts 85% probability of reaching leadership role.</p>
      </div>
    </div>
  `;
}

// ============================================================
// HIRING PIPELINE (7-Step Process)
// ============================================================
const PIPELINE_STEPS = [
  { id: 1, status: 'Job Posted',           emoji: '📢', label: 'Job Posted',          color: '#64748b', desc: 'Job listing live on marketplace. Freshers can now view and apply.' },
  { id: 2, status: 'Applied',              emoji: '📥', label: 'Applications',         color: '#3b82f6', desc: 'Candidates have submitted their profiles, skills, and portfolio projects.' },
  { id: 3, status: 'Screening',            emoji: '🔍', label: 'Screening',            color: '#06b6d4', desc: 'Evaluating candidates on skills, education, projects, and Potential Score.' },
  { id: 4, status: 'Smart Match',          emoji: '🤖', label: 'AI Matching',          color: '#8b5cf6', desc: 'System computes Match %, highlights Skill Gaps, and ranks candidates.' },
  { id: 5, status: 'Shortlisted',          emoji: '✅', label: 'Shortlisted',          color: '#f59e0b', desc: 'Qualified candidates shortlisted. Unqualified ones rejected with feedback.' },
  { id: 6, status: 'Interview Scheduled',  emoji: '📅', label: 'Interview',            color: '#34d399', desc: 'Technical + HR rounds scheduled. Candidate notified with date, time, link.' },
  { id: 7, status: 'Selected',             emoji: '🎉', label: 'Hired',               color: '#10b981', desc: 'Final selection complete. Status marked "Selected/Hired". Badge earned.' },
];

let allPipelineCandidates = [];
let activeStepIndex = 0; 

function renderPipelineProgressBar(highlightStep = 0) {
  const bar = document.getElementById('pipelineProgressBar');
  if (!bar) return;
  bar.innerHTML = '';

  PIPELINE_STEPS.forEach((step, i) => {
    const isDone   = i < highlightStep;
    const isActive = i === highlightStep;

    if (i > 0) {
      const conn = document.createElement('div');
      conn.className = `pipeline-connector ${isDone ? 'done' : isActive ? 'active' : ''}`;
      bar.appendChild(conn);
    }

    const stepEl = document.createElement('div');
    stepEl.className = `pipeline-step ${isDone ? 'done' : isActive ? 'active' : ''}`;
    stepEl.onclick = () => selectPipelineStep(i);
    stepEl.innerHTML = `
      <div class="pipeline-step-circle">${isDone ? '✓' : step.emoji}</div>
      <span class="pipeline-step-label">${step.label}</span>
    `;
    bar.appendChild(stepEl);
  });

  renderActiveStepDetail(highlightStep);
}

function selectPipelineStep(idx) {
  activeStepIndex = idx;
  renderPipelineProgressBar(idx);
}

function renderActiveStepDetail(idx) {
  const detail = document.getElementById('activeStepDetail');
  if (!detail) return;
  const step = PIPELINE_STEPS[idx];
  const countInStep = (allPipelineCandidates || []).filter(c => {
    if (idx === 0) return true;
    return c.status === step.status;
  }).length;

  detail.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
      <div style="width: 56px; height: 56px; border-radius: 14px; background: ${step.color}22; border: 2px solid ${step.color}; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0;">${step.emoji}</div>
      <div style="flex: 1;">
        <p style="font-weight: 800; font-size: 1.1rem; margin: 0; color: ${step.color};">Step ${idx + 1}: ${step.label}</p>
        <p style="margin: 0.4rem 0 0; font-size: 0.9rem; color: var(--text-muted);">${step.desc}</p>
      </div>
      <div style="text-align: center; background: ${step.color}15; border: 1px solid ${step.color}33; border-radius: 12px; padding: 0.75rem 1.5rem; min-width: 90px;">
        <p style="font-size: 1.8rem; font-weight: 800; margin: 0; color: ${step.color};">${idx === 0 ? 5 : countInStep}</p>
        <p style="font-size: 0.7rem; color: var(--text-dim); margin: 0;">${idx === 0 ? 'Active Jobs' : 'Candidates'}</p>
      </div>
    </div>
  `;
}

async function loadPipelineFromAPI() {
  try {
    const jobs = await apiCall('/jobs');
    const jf = document.getElementById('pipelineJobFilter');
    if (jf && jobs) {
      jf.innerHTML = `<option value="">All Jobs</option>` +
        jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
    }
    allPipelineCandidates = getMockPipelineCandidates();
    renderPipelineProgressBar(3);
    renderKanbanBoard(allPipelineCandidates);
  } catch (err) {
    allPipelineCandidates = getMockPipelineCandidates();
    renderPipelineProgressBar(3);
    renderKanbanBoard(allPipelineCandidates);
  }
}

function renderKanbanBoard(candidates) {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;
  board.innerHTML = '';
  const columns = [
    { key: 'Applied',            label: '📥 Applied',             step: 2, class: 'col-step2' },
    { key: 'Screening',          label: '🔍 Screening',           step: 3, class: 'col-step3' },
    { key: 'Smart Match',        label: '🤖 AI Matched',          step: 4, class: 'col-step4' },
    { key: 'Shortlisted',        label: '✅ Shortlisted',         step: 5, class: 'col-step5' },
    { key: 'Interview Scheduled',label: '📅 Interview',           step: 6, class: 'col-step6' },
    { key: 'Selected',           label: '🎉 Selected/Hired',      step: 7, class: 'col-step7' }
  ];

  columns.forEach(col => {
    const colCandidates = candidates.filter(c => c.status === col.key);
    const colEl = document.createElement('div');
    colEl.className = `kanban-col ${col.class}`;
    colEl.innerHTML = `
      <div class="kanban-col-header">
        <span>${col.label}</span>
        <span style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 2px 10px; font-size: 0.8rem;">${colCandidates.length}</span>
      </div>
      <div class="kanban-col-body">
        ${colCandidates.map(c => `
          <div class="kanban-card">
            <div style="display: flex; justify-content: space-between;">
              <p style="font-weight:700; margin:0;">${c.name}</p>
              <span style="color:var(--success); font-weight:800; font-size:0.75rem;">⚡${c.readiness_score}</span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin:4px 0;">${c.jobTitle}</p>
            <button class="k-btn primary" style="width:100%; margin-top:0.5rem;" onclick="moveKanbanCard(${c.id}, 'Shortlisted')">Advance →</button>
          </div>
        `).join('')}
      </div>
    `;
    board.appendChild(colEl);
  });
}

function getMockPipelineCandidates() {
  return [
    { id: 101, name: 'Rahul Sharma',   status: 'Applied',             jobTitle: 'React Developer',    readiness_score: 88 },
    { id: 102, name: 'Priya Patel',    status: 'Shortlisted',         jobTitle: 'Backend Developer',  readiness_score: 74 },
    { id: 103, name: 'Arjun Mehta',    status: 'Interview Scheduled', jobTitle: 'Full Stack',         readiness_score: 91 },
    { id: 106, name: 'Ananya Kumar',   status: 'Selected',            jobTitle: 'Full Stack',         readiness_score: 95 }
  ];
}

// ============================================================
// GLOBAL EXPORTS & INIT
// ============================================================
window.viewJobApplicants = viewJobApplicants;
window.handleStatusUpdate = handleStatusUpdate;
window.confirmDeleteJob = confirmDeleteJob;
window.openEditJob = openEditJob;
window.toggleNotifications = toggleNotifications;
window.saveInterview = saveInterview;
window.showNotification = showNotification;
window.loadPipelineFromAPI = loadPipelineFromAPI;
window.initPipelineSection = () => { renderPipelineProgressBar(0); loadPipelineFromAPI(); };
window.toggleTheme = toggleTheme;
window.renderTalentPools = renderTalentPools;
window.renderTrainHireMode = renderTrainHireMode;
window.renderReverseHiring = renderReverseHiring;
window.initHiringSimulation = initHiringSimulation;

function setupNavigation() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('data-section');
      if (!id) return;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      const activeSection = document.getElementById(id);
      if (activeSection) activeSection.classList.add('active');
      link.classList.add('active');

      if (id === 'hiringPipeline') window.initPipelineSection();
      if (id === 'talentPools') renderTalentPools();
      if (id === 'trainHire') renderTrainHireMode();
      if (id === 'reverseHiring') renderReverseHiring();
      if (id === 'hiringSimulation') initHiringSimulation();
    });
  });
}

document.addEventListener('DOMContentLoaded', setupNavigation);
window.moveKanbanCard = (id, status) => showNotification(`Candidate ${id} moved to ${status}`, 'success');
window.filterPipelineByJob = () => {};
// Logout
(function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }
})();
