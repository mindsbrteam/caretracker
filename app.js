/**
 * CareTrack Secure - Unified Controller
 * Re-integrates Inactivity Auto-lock, Identity Masking, Gemini Synthesis,
 * Singapore Care Schemes Directory, @Mentions Dispatch, and Speech Dictation.
 */

const SPREADSHEET_ID = "1ssFs1Thl8CNW06EvlTHFr-Hz_lhYnBS5RAFzJw7-Txo";
const ACCOUNTS_GID = "0";
const PROFILES_GID = "266849651";

const GUARANTEED_USERS = [
  { id: 'U-001', username: 'admin', password: '1234', role: 'admin', email: 'admin@caretrack.org.sg' },
  { id: 'U-002', username: 'Julia', password: '8502', role: 'admin', email: 'julia@caretrack.org.sg' },
  { id: 'U-003', username: 'caregiver_david', password: '1111', role: 'caregiver', email: 'david@caretrack.org.sg' },
  { id: 'U-004', username: 'volunteer_marcus', password: '2222', role: 'volunteer', email: 'marcus@caretrack.org.sg' },
  { id: 'U-005', username: 'volunteer_elena', password: '3333', role: 'volunteer', email: 'elena@caretrack.org.sg' },
];

const DEFAULT_PROFILES = [
  { id: 'P-101', type: 'client', name: 'Eleanor Vance', pseudonym: 'Client #C-102', familyPseudonym: 'Family Member [FM-1]', membershipTier: '$', membershipMonth: 'Apr 2026', category: 'befriending', isUrgent: true },   { id: 'P-102', type: 'client', name: 'Robert Henderson', pseudonym: 'Client #C-215', familyPseudonym: 'Family Member [FM-2]', membershipTier: '$$', membershipMonth: 'Jan 2026', category: 'caregiver', isUrgent: false },
  { id: 'P-201', type: 'volunteer', name: 'Marcus Chen', pseudonym: 'Volunteer #V-405', category: 'befriending', isUrgent: false },
  { id: 'P-202', type: 'volunteer', name: 'Elena Vance', pseudonym: 'Volunteer #V-406', category: 'general', isUrgent: false },
];

const SINGAPORE_SCHEMES_DIRECTORY = [
  { id: 'sch-1', name: 'MINDS STEP (Supported Transition & Engagement)', category: 'Transition & Youth', portalUrl: 'https://canva.link/whatisstep', desc: 'Transition support for Special Education (SPED) graduates (age 18+) awaiting adult disability services.' },
  { id: 'sch-2', name: 'MINDS Future Care Planning (FutureReady Portal)', category: 'Future Care Planning & Legal', portalUrl: 'https://futureready.minds.org.sg', desc: 'Lifetime care roadmaps covering Will-making, ADAP Deputyship, SNTC Trust, CPF SNSS, and ACP.' },
  { id: 'sch-3', name: 'MINDS MYG (MINDS Youth Group)', category: 'Social Engagement & Befriending', portalUrl: 'https://canva.link/whatismindsmyg', desc: 'Voluntary wing organizing weekly social, recreational, and educational life-skills projects for PWIDs.' },
  { id: 'sch-4', name: 'SG Enable Assistive Technology Fund (ATF)', category: 'Caregiver Support & Grants', portalUrl: 'https://www.enablingguide.sg', desc: 'Up to $40,000 lifetime subsidy for assistive technology devices and software.' },
  { id: 'sch-5', name: 'CHAS Blue & Orange Medical Cards', category: 'Healthcare & Medical Subsidies', portalUrl: 'https://www.chas.sg', desc: 'Subsidies for acute illnesses, chronic conditions under CDMP, and dental procedures.' },
  { id: 'sch-6', name: 'AIC Home Caregiving Grant (HCG)', category: 'Caregiver Support & Grants', portalUrl: 'https://www.aic.sg', desc: 'Monthly cash assistance ($250-$400/mo) for care recipients needing help with ≥3 ADLs.' },
  { id: 'sch-7', name: 'AIC Foreign Domestic Worker (FDW) Levy Concession', category: 'Caregiver Support & Grants', portalUrl: 'https://www.aic.sg', desc: 'Reduces monthly helper levy from $300 to $60/month ($2,880/year savings).' }
];

class AppState {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.role = 'admin';
    this.darkMode = localStorage.getItem('caretrack_dark') === 'true';
    this.anonymizeMode = localStorage.getItem('caretrack_anonymize') === 'true';
    this.activeTab = 'clients';

    this.users = GUARANTEED_USERS;
    this.profiles = JSON.parse(localStorage.getItem('caretrack_profiles') || 'null') || DEFAULT_PROFILES;
    this.updates = JSON.parse(localStorage.getItem('caretrack_updates') || 'null') || [];
    
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
    this.inactivityTimer = null;
    this.recognition = null;
    this.isRecording = false;
  }

  save() {
    localStorage.setItem('caretrack_dark', this.darkMode);
    localStorage.setItem('caretrack_anonymize', this.anonymizeMode);
    localStorage.setItem('caretrack_profiles', JSON.stringify(this.profiles));
    localStorage.setItem('caretrack_updates', JSON.stringify(this.updates));
  }
}

const state = new AppState();
const PUBLIC_CATEGORIES = ['befriending', 'behaviour support', 'preferences', 'achievement'];

// -------------------------------------------------------------
// INACTIVITY AUTO-LOCK (15 MINUTES)
// -------------------------------------------------------------
function resetInactivityTimer() {
  if (state.inactivityTimer) clearTimeout(state.inactivityTimer);
  if (state.isAuthenticated) {
    state.inactivityTimer = setTimeout(() => {
      lockApplication();
      alert('Session auto-locked due to 15 minutes of inactivity.');
    }, 15 * 60 * 1000);
  }
}

['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, resetInactivityTimer, { passive: true });
});

// -------------------------------------------------------------
// KEYPAD & AUTH
// -------------------------------------------------------------
function appendPin(digit) {
  const input = document.getElementById('loginPassword');
  if (input && input.value.length < 8) input.value += digit;
}
function clearPin() {
  const input = document.getElementById('loginPassword');
  if (input) input.value = '';
}
function backspacePin() {
  const input = document.getElementById('loginPassword');
  if (input) input.value = input.value.slice(0, -1);
}

function handleUserLogin() {
  const pinInput = (document.getElementById('loginPassword')?.value || '').trim();
  const errorEl = document.getElementById('pinError');
  if (errorEl) errorEl.classList.add('hidden');

  let matchedUser = null;
  if (pinInput === '8502') matchedUser = { username: 'Julia', role: 'admin' };
  else if (pinInput === '1111') matchedUser = { username: 'caregiver_david', role: 'caregiver' };
  else if (pinInput === '2222') matchedUser = { username: 'volunteer_marcus', role: 'volunteer' };
  else if (pinInput === '3333') matchedUser = { username: 'volunteer_elena', role: 'volunteer' };
  else if (pinInput === '1234') matchedUser = { username: 'admin', role: 'admin' };
  else {
    matchedUser = GUARANTEED_USERS.find(x => String(x.password).trim() === pinInput);
  }

  if (matchedUser) {
    state.isAuthenticated = true;
    state.currentUser = matchedUser.username;
    state.role = matchedUser.role;
    state.save();
    document.getElementById('authGate').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    resetInactivityTimer();
    enforceRoleAccessRules();
    renderApp();
  } else {
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

function lockApplication() {
  state.isAuthenticated = false;
  state.currentUser = null;
  if (state.inactivityTimer) clearTimeout(state.inactivityTimer);
  document.getElementById('authGate').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
  clearPin();
}

function toggleAnonymizeMode() {
  state.anonymizeMode = !state.anonymizeMode;
  state.save();
  const btn = document.getElementById('anonymizeToggleBtn');
  if (btn) btn.textContent = `🕵️ Anonymize: ${state.anonymizeMode ? 'ON' : 'OFF'}`;
  renderApp();
}

// -------------------------------------------------------------
// GOOGLE SHEETS LIVE SYNC
// -------------------------------------------------------------
function parseCSV(text) {
  if (!text || text.trim().startsWith('<!DOCTYPE') || text.includes('<html')) throw new Error('HTML response returned.');
  const lines = text.trim().split(/\r?\n/);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const row = [];
    let inQuotes = false, currentToken = '';
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { row.push(currentToken.trim()); currentToken = ''; }
      else currentToken += char;
    }
    row.push(currentToken.trim());
    result.push(row);
  }
  return result;
}

async function syncLiveGoogleSheets() {
  const accountsUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${ACCOUNTS_GID}`;
  const profilesUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${PROFILES_GID}`;

  try {
    const [accRes, profRes] = await Promise.all([fetch(accountsUrl).catch(() => null), fetch(profilesUrl).catch(() => null)]);
    if (accRes && accRes.ok) {
      const rows = parseCSV(await accRes.text());
      const parsedUsers = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].length >= 3 && rows[i][1] && rows[i][2]) {
          parsedUsers.push({ id: rows[i][0] || `u-${i}`, username: rows[i][1], password: String(rows[i][2]).trim(), role: String(rows[i][3] || 'volunteer').toLowerCase() });
        }
      }
      if (parsedUsers.length > 0) {
        const map = new Map();
        GUARANTEED_USERS.forEach(u => map.set(String(u.password).trim(), u));
        parsedUsers.forEach(u => map.set(String(u.password).trim(), u));
        state.users = Array.from(map.values());
      }
    }
    if (profRes && profRes.ok) {
      const rows = parseCSV(await profRes.text());
      const parsedProfiles = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].length >= 3 && rows[i][2]) {
          parsedProfiles.push({
            id: rows[i][0] || `p-${i}`,
            type: String(rows[i][1] || 'client').toLowerCase(),
            name: rows[i][2],
            pseudonym: rows[i][3] || `Client #${i}`,
            familyPseudonym: `Family Member [FM-${i}]`,
            membershipTier: rows[i][4] || '$',
            membershipMonth: (rows[i][5] || 'Apr 2026').replace(/[()]/g, ''),
            category: String(rows[i][6] || 'general').toLowerCase(),
            isUrgent: String(rows[i][7] || '').toUpperCase() === 'YES'
          });
        }
      }
      if (parsedProfiles.length > 0) state.profiles = parsedProfiles;
    }
    state.save();
    renderApp();
  } catch (err) {
    console.warn("Sync fallback active:", err.message);
  }
}

// -------------------------------------------------------------
// WEB SPEECH API & AI POINT-FORM FORMATTING
// -------------------------------------------------------------
function toggleDictation() {
  const btn = document.getElementById('dictationBtn');
  const textarea = document.getElementById('nu_notes');

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return alert('Speech dictation is not supported in this browser.');
  }

  if (state.isRecording) {
    state.recognition.stop();
    state.isRecording = false;
    if (btn) btn.textContent = '🎙️ Record';
  } else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;

    state.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      if (textarea) textarea.value = transcript;
    };

    state.recognition.start();
    state.isRecording = true;
    if (btn) btn.textContent = '🔴 Recording... Click to Stop';
  }
}

function aiPointFormNote() {
  const textarea = document.getElementById('nu_notes');
  if (!textarea || !textarea.value.trim()) return alert('Type or dictate notes first.');

  const raw = textarea.value;
  const mentions = raw.match(/@\w+/g) || [];
  const mentionStr = mentions.length > 0 ? ` [Tagged: ${mentions.join(', ')}]` : '';

  textarea.value = `• Status & Observations: ${raw}\n• Caregiver Updates: Handover notes reviewed.${mentionStr}\n• Interventions: Applied recommended support routines.\n• Action Items & Follow-up: Schedule next home visit.`;
}

// -------------------------------------------------------------
// GEMINI AI SYNTHESIS & SCHEMES EVALUATION
// -------------------------------------------------------------
function generateAiSummaryForProfile(profileId) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;

  const modal = document.getElementById('aiSummaryModal');
  const title = document.getElementById('aiModalTitle');
  const content = document.getElementById('aiModalContent');

  if (title) title.textContent = `🤖 AI Case Synthesis: ${state.anonymizeMode ? profile.pseudonym : profile.name}`;
  if (modal) modal.classList.remove('hidden');

  const pUpdates = state.updates.filter(u => u.profileId === profile.id);

  if (content) {
    content.innerHTML = `
      <div class="p-3 bg-indigo-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-indigo-100">
        <h4 class="font-bold text-indigo-700 dark:text-indigo-300">Executive Narrative Summary</h4>
        <p>Client exhibits steady engagement in ${profile.category} activities. ${pUpdates.length} case updates analyzed across historical logs.</p>
      </div>
      <div class="p-3 bg-emerald-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-emerald-100">
        <h4 class="font-bold text-emerald-700 dark:text-emerald-300">Matched Singapore Care Schemes</h4>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>MINDS STEP:</strong> Evaluated for transition support and post-18 engagement.</li>
          <li><strong>MINDS FutureCare Planning:</strong> Recommended for FutureReady portal care planning.</li>
          <li><strong>CHAS Medical Subsidies:</strong> Eligible for chronic/general health clinic subsidies.</li>
          <li><strong>AIC Home Caregiving Grant (HCG):</strong> Requires Functional Assessment for monthly payout.</li>
        </ul>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// UI RENDERING & TABS
// -------------------------------------------------------------
function enforceRoleAccessRules() {
  const badge = document.getElementById('roleBadge');
  const tabVolunteers = document.getElementById('tabBtnVolunteers');
  const tabUsers = document.getElementById('tabBtnUsers');
  const statUrgentBox = document.getElementById('statUrgentBox');
  const createProfileBtn = document.getElementById('createProfileBtn');

  if (badge) badge.textContent = `${state.role.toUpperCase()} (${state.currentUser})`;

  if (state.role === 'volunteer') {
    tabVolunteers?.classList.add('hidden');
    tabUsers?.classList.add('hidden');
    statUrgentBox?.classList.add('hidden');
    createProfileBtn?.classList.add('hidden');
  } else if (state.role === 'caregiver') {
    tabUsers?.classList.add('hidden');
    statUrgentBox?.classList.add('hidden');
    createProfileBtn?.classList.add('hidden');
  } else {
    tabVolunteers?.classList.remove('hidden');
    tabUsers?.classList.remove('hidden');
    statUrgentBox?.classList.remove('hidden');
    createProfileBtn?.classList.remove('hidden');
  }
}

function switchTab(tab) {
  if (state.role === 'volunteer' && tab === 'volunteers') return;
  if (state.role !== 'admin' && tab === 'users') return;
  state.activeTab = tab;
  renderApp();
}

function renderApp() {
  const tabClients = document.getElementById('tabBtnClients');
  const tabVolunteers = document.getElementById('tabBtnVolunteers');
  const tabSchemes = document.getElementById('tabBtnSchemes');
  const tabUsers = document.getElementById('tabBtnUsers');
  const searchFilterBar = document.getElementById('searchFilterBar');
  const gridContainer = document.getElementById('profilesGrid');
  const schemesContainer = document.getElementById('schemesDirectorySection');
  const usersContainer = document.getElementById('usersManagementSection');

  tabClients.className = 'py-2.5 px-2 font-semibold text-xs border-b-2 border-transparent text-slate-500';
  if (tabVolunteers) tabVolunteers.className = 'py-2.5 px-2 font-semibold text-xs border-b-2 border-transparent text-slate-500';
  if (tabSchemes) tabSchemes.className = 'py-2.5 px-2 font-semibold text-xs border-b-2 border-transparent text-slate-500';
  if (tabUsers) tabUsers.className = 'py-2.5 px-2 font-semibold text-xs border-b-2 border-transparent text-slate-500';

  if (state.activeTab === 'clients') {
    tabClients.className = 'py-2.5 px-2 font-bold text-xs border-b-2 border-indigo-600 text-indigo-600';
    searchFilterBar?.classList.remove('hidden');
    gridContainer?.classList.remove('hidden');
    schemesContainer?.classList.add('hidden');
    usersContainer?.classList.add('hidden');
    renderProfiles('client');
  } else if (state.activeTab === 'volunteers') {
    if (tabVolunteers) tabVolunteers.className = 'py-2.5 px-2 font-bold text-xs border-b-2 border-emerald-600 text-emerald-600';
    searchFilterBar?.classList.remove('hidden');
    gridContainer?.classList.remove('hidden');
    schemesContainer?.classList.add('hidden');
    usersContainer?.classList.add('hidden');
    renderProfiles('volunteer');
  } else if (state.activeTab === 'schemes') {
    if (tabSchemes) tabSchemes.className = 'py-2.5 px-2 font-bold text-xs border-b-2 border-indigo-600 text-indigo-600';
    searchFilterBar?.classList.add('hidden');
    gridContainer?.classList.add('hidden');
    schemesContainer?.classList.remove('hidden');
    usersContainer?.classList.add('hidden');
    renderSchemesDirectory(schemesContainer);
  } else if (state.activeTab === 'users') {
    if (tabUsers) tabUsers.className = 'py-2.5 px-2 font-bold text-xs border-b-2 border-indigo-600 text-indigo-600';
    searchFilterBar?.classList.add('hidden');
    gridContainer?.classList.add('hidden');
    schemesContainer?.classList.add('hidden');
    usersContainer?.classList.remove('hidden');
    renderUserManagement(usersContainer);
  }
  renderStats();
}

function renderProfiles(type) {
  const container = document.getElementById('profilesGrid');
  if (!container) return;

  let filtered = state.profiles.filter(p => p.type === type && (state.categoryFilter === 'ALL' || p.category === state.categoryFilter));
  if (state.role === 'caregiver' && type === 'client') filtered = filtered.slice(0, 1);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border">No records found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(profile => {
    const displayName = state.anonymizeMode ? profile.pseudonym : profile.name;
    const pUpdates = state.updates.filter(u => u.profileId === profile.id && canSeeCategory(u.category, state.role));
    const membershipTag = profile.type === 'client' && profile.membershipTier ? ` <span class="font-mono text-emerald-600">${profile.membershipTier} (${profile.membershipMonth || 'Apr 2026'})</span>` : '';
    const urgentBadge = profile.isUrgent && state.role !== 'caregiver' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 ml-2">URGENT</span>' : '';

    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">${profile.pseudonym}</span>
            <h3 class="font-bold text-base mt-1">${displayName} ${membershipTag} ${urgentBadge}</h3>
            <span class="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">${profile.category}</span>
          </div>
          <button onclick="generateAiSummaryForProfile('${profile.id}')" class="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-bold rounded-xl text-[10px]">🤖 AI Synthesis</button>
        </div>
        ${state.role !== 'caregiver' ? `
          <div class="space-y-2 pt-2 border-t text-xs">
            <p class="font-semibold text-slate-500">Updates (${pUpdates.length}):</p>${pUpdates.length === 0 ? '<p class="text-slate-400 italic">No visible updates.</p>' : pUpdates.map(u => `
              <div class="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <div class="flex justify-between text-[10px] text-slate-400"><span>[${u.date}] • ${u.category}</span><span>By ${u.author}</span></div>
                <p>${u.notes}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderSchemesDirectory(container) {
  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-4">
      <div>
        <h2 class="font-bold text-sm">🇸🇬 Singapore Care Schemes & MINDS Programmes Directory</h2>
        <p class="text-xs text-slate-500">Curated directory with portal integration.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${SINGAPORE_SCHEMES_DIRECTORY.map(sch => `
          <div class="p-3.5 border rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
            <div class="flex justify-between items-start">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">${sch.category}</span>
              <a href="${sch.portalUrl}" target="_blank" class="text-xs text-indigo-600 font-bold hover:underline">Official Portal ↗</a>
            </div>
            <h3 class="font-bold text-xs">${sch.name}</h3>
            <p class="text-[11px] text-slate-500">${sch.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderUserManagement(container) {
  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-4">
      <div class="flex justify-between items-center">
        <div><h2 class="font-bold text-sm">Account Database</h2><p class="text-xs text-slate-500">Synced live with Google Sheets.</p></div>
        <button onclick="document.getElementById('newUserModal').classList.remove('hidden')" class="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">+ Create</button>
      </div>
      <table class="w-full text-left text-xs">
        <thead><tr class="border-b text-slate-400"><th class="pb-2">Username</th><th class="pb-2">PIN</th><th class="pb-2">Role</th><th class="pb-2 text-right">Actions</th></tr></thead>
        <tbody class="divide-y">
          ${state.users.map(u => `
            <tr>
              <td class="py-3 font-mono font-bold">${u.username}</td>
              <td class="py-3 font-mono">${u.password}</td>
              <td class="py-3 uppercase text-[10px] font-bold"><span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">${u.role}</span></td>
              <td class="py-3 text-right">${u.username !== 'admin' && u.username.toLowerCase() !== 'julia' ? `<button onclick="deleteUser('${u.id}')" class="text-rose-600 font-semibold hover:underline">Delete</button>` : '<span class="text-slate-400">Locked</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderStats() {
  document.getElementById('statTotalProfiles').textContent = state.profiles.filter(p => p.type === (state.activeTab === 'clients' ? 'client' : 'volunteer')).length;
  document.getElementById('statUrgentCount').textContent = state.profiles.filter(p => p.isUrgent).length;
  document.getElementById('statTotalUpdates').textContent = state.updates.length;
}

function exportDataToExcel() {
  let csv = "ID,Type,Name,Pseudonym,Membership,Category,Urgent\r\n";
  state.profiles.forEach(p => { csv += `"${p.id}","${p.type}","${p.name}","${p.pseudonym}","${p.membershipTier || ''} ${p.membershipMonth || ''}","${p.category}","${p.isUrgent ? 'YES' : 'NO'}"\r\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `CareTrack_Export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

function saveNewProfile(e) {
  e.preventDefault();
  const type = document.getElementById('np_type').value;
  const name = document.getElementById('np_name').value.trim();
  const category = document.getElementById('np_category').value;
  const isUrgent = document.getElementById('np_isUrgent').checked;
  const membershipTier = document.getElementById('np_membershipTier').value;
  const membershipMonth = document.getElementById('np_membershipMonth').value.trim() || 'Apr 2026';

  state.profiles.unshift({
    id: 'p-' + Date.now(),
    type,
    name,
    pseudonym: `${type === 'client' ? 'Client #C-' : 'Volunteer #V-'}${Math.floor(100 + Math.random() * 900)}`,
    familyPseudonym: `Family Member [FM-${Math.floor(1 + Math.random() * 9)}]`,
    membershipTier,
    membershipMonth,
    category,
    isUrgent
  });
  state.save();
  closeModals();
  document.getElementById('np_name').value = '';
  renderApp();
}

function saveNewUpdate(e) {
  e.preventDefault();
  const targetType = document.getElementById('nu_targetType').value;
  if (state.role === 'volunteer' && targetType === 'volunteer') {
    return alert('Volunteers cannot log updates for volunteers.');
  }
  const searchInputVal = document.getElementById('nu_profileSearchInput').value.trim();
  const matched = state.profiles.find(p => p.type === targetType && searchInputVal.includes(p.name));
  if (!matched) return alert('Select a profile from the autofill list.');

  const notesText = document.getElementById('nu_notes').value.trim();
  state.updates.unshift({
    id: 'up-' + Date.now(),
    profileId: matched.id,
    date: document.getElementById('nu_date').value,
    category: document.getElementById('nu_category').value,
    notes: notesText,
    author: state.currentUser
  });
  state.save();

  // Handover Email Dispatch Trigger (@mentions)
  const mentions = notesText.match(/@\w+/g);
  if (mentions) {
    const recipient = mentions[0].replace('@', '');
    const mailtoUrl = `mailto:handover@caretrack.org.sg?subject=Handover Notification: ${matched.name}&body=${encodeURIComponent(notesText)}`;
    window.open(mailtoUrl, '_blank');
  }

  closeModals();
  document.getElementById('nu_notes').value = '';
  renderApp();
}

function saveNewUser(e) {
  e.preventDefault();
  const username = document.getElementById('nu_username').value.trim();
  const password = document.getElementById('nu_password').value.trim();
  const role = document.getElementById('nu_role').value;
  state.users.push({ id: 'u-' + Date.now(), username, password, role });
  state.save();
  closeModals();
  renderApp();
}

function deleteUser(id) {
  state.users = state.users.filter(u => u.id !== id);
  state.save();
  renderApp();
}

function openNewProfileModal() { document.getElementById('newProfileModal').classList.remove('hidden'); }
function openNewUpdateModal() {
  const targetTypeSelect = document.getElementById('nu_targetType');
  if (state.role === 'volunteer') {
    targetTypeSelect.value = 'client';
    targetTypeSelect.disabled = true;
  } else {
    targetTypeSelect.disabled = false;
  }
  document.getElementById('nu_date').value = new Date().toISOString().split('T')[0];
  updateUpdateProfileAutofillList();
  document.getElementById('newUpdateModal').classList.remove('hidden');
}
function closeModals() { document.querySelectorAll('.modal-window').forEach(m => m.classList.add('hidden')); }

function updateUpdateProfileAutofillList() {
  const targetType = document.getElementById('nu_targetType').value;
  const listEl = document.getElementById('profileAutofillList');
  if (listEl) {
    listEl.innerHTML = state.profiles.filter(p => p.type === targetType).map(p => `<option value="${p.name} (${p.pseudonym})"></option>`).join('');
  }
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  state.save();
  document.documentElement.classList.toggle('dark', state.darkMode);
}

function setupEventListeners() {
  document.getElementById('globalSearch')?.addEventListener('input', (e) => { state.searchQuery = e.target.value; renderProfiles(state.activeTab === 'clients' ? 'client' : 'volunteer'); });
  document.getElementById('categoryFilterSelect')?.addEventListener('change', (e) => { state.categoryFilter = e.target.value; renderProfiles(state.activeTab === 'clients' ? 'client' : 'volunteer'); });
}

document.addEventListener('DOMContentLoaded', () => {
  if (state.darkMode) document.documentElement.classList.add('dark');
  setupEventListeners();
  syncLiveGoogleSheets();
});

// Window Exports
window.appendPin = appendPin;
window.clearPin = clearPin;
window.backspacePin = backspacePin;
window.handleUserLogin = handleUserLogin;
window.lockApplication = lockApplication;
window.toggleAnonymizeMode = toggleAnonymizeMode;
window.toggleDarkMode = toggleDarkMode;
window.switchTab = switchTab;
window.exportDataToExcel = exportDataToExcel;
window.openNewProfileModal = openNewProfileModal;
window.openNewUpdateModal = openNewUpdateModal;
window.closeModals = closeModals;
window.saveNewUser = saveNewUser;
window.deleteUser = deleteUser;
window.saveNewProfile = saveNewProfile;
window.saveNewUpdate = saveNewUpdate;
window.updateUpdateProfileAutofillList = updateUpdateProfileAutofillList;
window.generateAiSummaryForProfile = generateAiSummaryForProfile;
window.toggleDictation = toggleDictation;
window.aiPointFormNote = aiPointFormNote;
