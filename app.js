/**
 * CareTrack Secure - Main Controller
 * Integrated with Live Google Sheets multi-tab CSV parser & auto-sync.
 */

const SPREADSHEET_ID = "1ssFs1Thl8CNW06EvlTHFr-Hz_lhYnBS5RAFzJw7-Txo";

const DEFAULT_USERS = [
  { id: 'U-001', username: 'admin', password: '1234', role: 'admin' },
  { id: 'U-002', username: 'Julia', password: '8502', role: 'admin' },
  { id: 'U-003', username: 'caregiver_david', password: '1111', role: 'caregiver' },
  { id: 'U-004', username: 'volunteer_marcus', password: '2222', role: 'volunteer' },
  { id: 'U-005', username: 'volunteer_elena', password: '3333', role: 'volunteer' },
];

const DEFAULT_PROFILES = [
  { id: 'P-1', type: 'client', name: 'Eleanor Vance', pseudonym: 'Client #C-102', membershipTier: '$', membershipMonth: 'Apr 2026', category: 'befriending', isUrgent: true },   { id: 'P-2', type: 'client', name: 'Robert Henderson', pseudonym: 'Client #C-215', membershipTier: '$$', membershipMonth: 'Jan 2026', category: 'caregiver', isUrgent: false },
  { id: 'P-3', type: 'volunteer', name: 'Marcus Chen', pseudonym: 'Volunteer #V-405', category: 'befriending', isUrgent: false },
  { id: 'P-4', type: 'volunteer', name: 'Elena Vance', pseudonym: 'Volunteer #V-406', category: 'general', isUrgent: false },
];

const DEFAULT_UPDATES = [];

class AppState {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.role = 'admin';
    this.darkMode = localStorage.getItem('caretrack_dark') === 'true';
    this.activeTab = 'clients';

    this.users = DEFAULT_USERS;
    this.profiles = DEFAULT_PROFILES;
    this.updates = JSON.parse(localStorage.getItem('caretrack_updates') || 'null') || DEFAULT_UPDATES;
    
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
  }

  save() {
    localStorage.setItem('caretrack_users', JSON.stringify(this.users));
    localStorage.setItem('caretrack_dark', this.darkMode);
    localStorage.setItem('caretrack_profiles', JSON.stringify(this.profiles));
    localStorage.setItem('caretrack_updates', JSON.stringify(this.updates));
  }
}

const state = new AppState();
const PUBLIC_CATEGORIES = ['befriending', 'behaviour support', 'preferences', 'achievement'];

function canSeeCategory(category, role) {
  if (role === 'admin') return true;
  if (PUBLIC_CATEGORIES.includes(category)) return true;
  return role === 'volunteer' || role === 'caregiver';
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    const row = [];
    let inQuotes = false;
    let currentToken = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    row.push(currentToken.trim());
    result.push(row);
  }
  return result;
}

async function syncLiveGoogleSheetData() {
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    const rows = parseCSV(csvText);

    const accountsHeaderIdx = rows.findIndex(r => r[0] === 'User ID');
    const profilesHeaderIdx = rows.findIndex(r => r[0] === 'Profile ID');

    if (accountsHeaderIdx !== -1) {
      const parsedUsers = [];
      const endIdx = profilesHeaderIdx !== -1 ? profilesHeaderIdx : rows.length;
      
      for (let i = accountsHeaderIdx + 1; i < endIdx; i++) {
        const row = rows[i];
        if (row.length >= 4 && row[1] && row[2]) {
          parsedUsers.push({
            id: row[0] || `u-${i}`,
            username: row[1],
            password: String(row[2]).trim(),
            role: row[3].toLowerCase(),
            assignedProfile: row[4] || '',
            membershipTier: row[5] || '',
            membershipMonth: row[6] || ''
          });
        }
      }
      if (parsedUsers.length > 0) {
        state.users = parsedUsers;
        localStorage.setItem('caretrack_users', JSON.stringify(parsedUsers));
      }
    }

    if (profilesHeaderIdx !== -1) {
      const parsedProfiles = [];
      for (let i = profilesHeaderIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 7 && row[2] && row[3]) {
          parsedProfiles.push({
            id: row[0] || `p-${i}`,
            type: (row[1] || 'client').toLowerCase(),
            name: row[2],
            pseudonym: row[3],
            membershipTier: row[4] || '$',
            membershipMonth: row[5] || 'Apr 2026',
            category: (row[6] || 'general').toLowerCase(),
            isUrgent: (row[7] || '').toUpperCase() === 'YES'
          });
        }
      }
      if (parsedProfiles.length > 0) {
        state.profiles = parsedProfiles;
        localStorage.setItem('caretrack_profiles', JSON.stringify(parsedProfiles));
      }
    }

    state.save();
    renderApp();
  } catch (error) {
    console.warn("Using cached data fallback:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (state.darkMode) document.documentElement.classList.add('dark');
  setupEventListeners();
  syncLiveGoogleSheetData();
});

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  state.save();
  document.documentElement.classList.toggle('dark', state.darkMode);
}

function handleUserLogin() {
  const usernameInput = (document.getElementById('loginUsername')?.value || '').trim().toLowerCase();
  const passwordInput = (document.getElementById('loginPassword')?.value || '').trim();
  const errorEl = document.getElementById('pinError');

  let matchedUser = null;

  // 1. Direct PIN lookup against state.users (e.g., "1111" for David or "8502" for Julia)
  if (passwordInput) {
    matchedUser = state.users.find(x => String(x.password).trim() === passwordInput);
  }

  // 2. Check Username + PIN combination if typed
  if (!matchedUser && usernameInput && passwordInput) {
    matchedUser = state.users.find(x => x.username.trim().toLowerCase() === usernameInput && String(x.password).trim() === passwordInput);
  }

  // 3. Fallback for Master Admin PIN "1234"
  if (!matchedUser && (passwordInput === '1234' || (usernameInput === 'admin' && passwordInput === '1234'))) {
    matchedUser = { username: 'admin', role: 'admin' };
  }

  if (matchedUser) {
    state.isAuthenticated = true;
    state.currentUser = matchedUser.username;
    state.role = matchedUser.role;
    state.save();
    document.getElementById('authGate').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    enforceRoleAccessRules();
    renderApp();
  } else {
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

function quickDemoUnlock() {
  document.getElementById('loginPassword').value = '8502';
  handleUserLogin();
}

function lockApplication() {
  state.isAuthenticated = false;
  state.currentUser = null;
  document.getElementById('authGate').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
}

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
  const tabUsers = document.getElementById('tabBtnUsers');
  const searchFilterBar = document.getElementById('searchFilterBar');
  const gridContainer = document.getElementById('profilesGrid');
  const usersContainer = document.getElementById('usersManagementSection');

  tabClients.className = 'py-2.5 px-2 font-semibold text-xs border-b-2 border-transparent text-slate-500';
  if (tabVolunteers) tabVolunteers.className = 'py-2.5 px-2 font-semibold text-xs border-b-2 border-transparent text-slate-500';
  if (tabUsers) tabUsers.className = 'py-2.5 px-2 font-semibold text-xs border-b-2 border-transparent text-slate-500';

  if (state.activeTab === 'clients') {
    tabClients.className = 'py-2.5 px-2 font-bold text-xs border-b-2 border-indigo-600 text-indigo-600';
    searchFilterBar?.classList.remove('hidden');
    gridContainer?.classList.remove('hidden');
    usersContainer?.classList.add('hidden');
    renderProfiles('client');
  } else if (state.activeTab === 'volunteers') {
    if (tabVolunteers) tabVolunteers.className = 'py-2.5 px-2 font-bold text-xs border-b-2 border-emerald-600 text-emerald-600';
    searchFilterBar?.classList.remove('hidden');
    gridContainer?.classList.remove('hidden');
    usersContainer?.classList.add('hidden');
    renderProfiles('volunteer');
  } else if (state.activeTab === 'users') {
    if (tabUsers) tabUsers.className = 'py-2.5 px-2 font-bold text-xs border-b-2 border-indigo-600 text-indigo-600';
    searchFilterBar?.classList.add('hidden');
    gridContainer?.classList.add('hidden');
    usersContainer?.classList.remove('hidden');
    renderUserManagement(usersContainer);
  }
  renderStats();
}

function renderProfiles(type) {
  const container = document.getElementById('profilesGrid');
  if (!container) return;

  let filtered = state.profiles.filter(p => p.type === type && (state.categoryFilter === 'ALL' || p.category === state.categoryFilter));
  
  if (state.role === 'caregiver' && type === 'client') {
    filtered = filtered.slice(0, 1);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border">No records found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(profile => {
    const pUpdates = state.updates.filter(u => u.profileId === profile.id && canSeeCategory(u.category, state.role));
    const membershipTag = profile.type === 'client' && profile.membershipTier ? ` <span class="font-mono text-emerald-600">${profile.membershipTier} (${profile.membershipMonth || 'Apr 2026'})</span>` : '';
    const urgentBadge = profile.isUrgent && state.role !== 'caregiver' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 ml-2">URGENT</span>' : '';

    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">${profile.pseudonym}</span>
            <h3 class="font-bold text-base mt-1">${profile.name} ${membershipTag} ${urgentBadge}</h3>
            <span class="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">${profile.category}</span>
          </div>
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

function renderUserManagement(container) {
  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-4">
      <div class="flex justify-between items-center">
        <div><h2 class="font-bold text-sm">Account Database</h2><p class="text-xs text-slate-500">Synced with Google Drive Master Sheet.</p></div>
        <button onclick="document.getElementById('newUserModal').classList.remove('hidden')" class="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">+ Create</button>
      </div>
      <table class="w-full text-left text-xs">
        <thead><tr class="border-b text-slate-400"><th class="pb-2">Username</th><th class="pb-2">PIN / Password</th><th class="pb-2">Role</th><th class="pb-2 text-right">Actions</th></tr></thead>
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

function saveNewUser(e) {
  e.preventDefault();
  const username = document.getElementById('nu_username').value.trim();
  const password = document.getElementById('nu_password').value.trim();
  const role = document.getElementById('nu_role').value;
  state.users.push({ id: 'u-' + Date.now(), username, password, role });
  state.save();
  closeModals();
  document.getElementById('newUserForm').reset();
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
  listEl.innerHTML = state.profiles.filter(p => p.type === targetType).map(p => `<option value="${p.name} (${p.pseudonym})"></option>`).join('');
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
    alert('Volunteers cannot log updates for volunteers.');
    return;
  }
  const searchInputVal = document.getElementById('nu_profileSearchInput').value.trim();
  const matched = state.profiles.find(p => p.type === targetType && searchInputVal.includes(p.name));
  if (!matched) return alert('Select a profile from the autofill list.');

  state.updates.unshift({
    id: 'up-' + Date.now(),
    profileId: matched.id,
    date: document.getElementById('nu_date').value,
    category: document.getElementById('nu_category').value,
    notes: document.getElementById('nu_notes').value.trim(),
    author: state.currentUser
  });
  state.save();
  closeModals();
  document.getElementById('nu_notes').value = '';
  renderApp();
}

function setupEventListeners() {
  document.getElementById('globalSearch')?.addEventListener('input', (e) => { state.searchQuery = e.target.value; renderProfiles(state.activeTab === 'clients' ? 'client' : 'volunteer'); });
  document.getElementById('categoryFilterSelect')?.addEventListener('change', (e) => { state.categoryFilter = e.target.value; renderProfiles(state.activeTab === 'clients' ? 'client' : 'volunteer'); });
}

window.handleUserLogin = handleUserLogin;
window.quickDemoUnlock = quickDemoUnlock;
window.lockApplication = lockApplication;
window.switchTab = switchTab;
window.toggleDarkMode = toggleDarkMode;
window.exportDataToExcel = exportDataToExcel;
window.openNewProfileModal = openNewProfileModal;
window.openNewUpdateModal = openNewUpdateModal;
window.closeModals = closeModals;
window.saveNewUser = saveNewUser;
window.deleteUser = deleteUser;
window.saveNewProfile = saveNewProfile;
window.saveNewUpdate = saveNewUpdate;
window.updateUpdateProfileAutofillList = updateUpdateProfileAutofillList;
