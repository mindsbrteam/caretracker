/**
 * CareTrack Secure - Main Controller
 * Implements Role Access Control, Dark Mode, Autofill Logging, Excel Export, and User Account Management.
 */

const DEFAULT_PIN = '1234';

const DEFAULT_USERS = [
  { id: 'u-admin', username: 'admin', password: DEFAULT_PIN, role: 'admin' },
  { id: 'u-caregiver', username: 'caregiver', password: 'password', role: 'caregiver' },
  { id: 'u-volunteer', username: 'volunteer', password: 'password', role: 'volunteer' },
];

const DEFAULT_PROFILES = [
  {
    id: 'p-1',
    type: 'client',
    name: 'Eleanor Vance',
    pseudonym: 'Client #C-102',
    membershipTier: '$',     membershipMonth: 'Apr 2026',     category: 'befriending',     isUrgent: true,     familyMembers: ['Sarah (Daughter)'],   },   {     id: 'p-2',     type: 'client',     name: 'Robert Henderson',     pseudonym: 'Client #C-215',     membershipTier: '$$',
    membershipMonth: 'Jan 2026',
    category: 'caregiver',
    isUrgent: false,
    familyMembers: ['David (Son)'],
  },
  {
    id: 'p-4',
    type: 'volunteer',
    name: 'Marcus Chen',
    pseudonym: 'Volunteer #V-405',
    category: 'befriending',
    availability: 'Tuesdays & Thursdays',
    isUrgent: false,
  },
];

const DEFAULT_UPDATES = [
  {
    id: 'up-1',
    profileId: 'p-1',
    profileType: 'client',
    date: '2026-10-02',
    category: 'befriending',
    notes: 'Companionship visit completed successfully.',
    author: 'Staff Admin',
  },
];

class AppState {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.role = 'admin'; // 'admin' | 'caregiver' | 'volunteer'
    this.darkMode = localStorage.getItem('caretrack_dark') === 'true';
    this.anonymizeMode = localStorage.getItem('caretrack_anon') !== 'false';
    this.activeTab = 'clients'; // 'clients' | 'volunteers' | 'users'

    this.users = JSON.parse(localStorage.getItem('caretrack_users') || 'null') || DEFAULT_USERS;
    this.profiles = JSON.parse(localStorage.getItem('caretrack_profiles') || 'null') || DEFAULT_PROFILES;
    this.updates = JSON.parse(localStorage.getItem('caretrack_updates') || 'null') || DEFAULT_UPDATES;
    
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
  }

  save() {
    localStorage.setItem('caretrack_users', JSON.stringify(this.users));
    localStorage.setItem('caretrack_dark', this.darkMode);
    localStorage.setItem('caretrack_anon', this.anonymizeMode);
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

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  setupEventListeners();
});

function applyTheme() {
  if (state.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  state.save();
  applyTheme();
  showToast(state.darkMode ? 'Dark Mode Enabled' : 'Light Mode Enabled', 'info');
}

function handleUserLogin() {
  const usernameInput = document.getElementById('loginUsername').value.trim();
  const passwordInput = document.getElementById('loginPassword').value.trim();
  const errorEl = document.getElementById('pinError');

  // Master quick override for 1234
  if (usernameInput === 'admin' && passwordInput === DEFAULT_PIN) {
    state.isAuthenticated = true;
    state.role = 'admin';
    state.currentUser = 'admin';
    finalizeLogin();
    return;
  }

  const foundUser = state.users.find(u => u.username === usernameInput && u.password === passwordInput);
  if (foundUser) {
    state.isAuthenticated = true;
    state.role = foundUser.role;
    state.currentUser = foundUser.username;
    finalizeLogin();
  } else {
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

function quickDemoUnlock() {
  document.getElementById('loginUsername').value = 'admin';
  document.getElementById('loginPassword').value = DEFAULT_PIN;
  handleUserLogin();
}

function finalizeLogin() {
  state.save();
  document.getElementById('authGate').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  enforceRoleAccessRules();
  renderApp();
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

  if (badge) badge.textContent = `${state.role.toUpperCase()} (${state.currentUser || 'User'})`;

  if (state.role === 'volunteer') {
    if (tabVolunteers) tabVolunteers.classList.add('hidden');
    if (tabUsers) tabUsers.classList.add('hidden');
    if (statUrgentBox) statUrgentBox.classList.add('hidden');
    if (createProfileBtn) createProfileBtn.classList.add('hidden');
  } else if (state.role === 'caregiver') {
    if (tabUsers) tabUsers.classList.add('hidden');
    if (statUrgentBox) statUrgentBox.classList.add('hidden');
    if (createProfileBtn) createProfileBtn.classList.add('hidden');
  } else {
    if (tabVolunteers) tabVolunteers.classList.remove('hidden');
    if (tabUsers) tabUsers.classList.remove('hidden');
    if (statUrgentBox) statUrgentBox.classList.remove('hidden');
    if (createProfileBtn) createProfileBtn.classList.remove('hidden');
  }
}

function switchTab(tab) {
  if (state.role === 'volunteer' && tab === 'volunteers') return;
  if (state.role !== 'admin' && tab === 'users') return;
  state.activeTab = tab;
  renderApp();
}

function toggleAnonymizeMode() {
  state.anonymizeMode = !state.anonymizeMode;
  state.save();
  renderApp();
}

function renderApp() {
  renderHeaderNav();
  renderContent();
  renderStats();
}

function renderHeaderNav() {
  const tabClients = document.getElementById('tabBtnClients');
  const tabVolunteers = document.getElementById('tabBtnVolunteers');
  const tabUsers = document.getElementById('tabBtnUsers');
  const anonLabel = document.getElementById('anonymizeLabel');
  const searchFilterBar = document.getElementById('searchFilterBar');

  if (anonLabel) anonLabel.textContent = state.anonymizeMode ? 'Masked View' : 'Admin View';

  // Highlight active tab
  tabClients.className = 'py-3 px-3 font-semibold text-xs sm:text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1.5 shrink-0';
  if (tabVolunteers) tabVolunteers.className = 'py-3 px-3 font-semibold text-xs sm:text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1.5 shrink-0';
  if (tabUsers) tabUsers.className = 'py-3 px-3 font-semibold text-xs sm:text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1.5 shrink-0';

  if (state.activeTab === 'clients') {
    tabClients.className = 'py-3 px-3 font-bold text-xs sm:text-sm border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5 shrink-0';
    searchFilterBar?.classList.remove('hidden');
  } else if (state.activeTab === 'volunteers') {
    if (tabVolunteers) tabVolunteers.className = 'py-3 px-3 font-bold text-xs sm:text-sm border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 shrink-0';
    searchFilterBar?.classList.remove('hidden');
  } else if (state.activeTab === 'users') {
    if (tabUsers) tabUsers.className = 'py-3 px-3 font-bold text-xs sm:text-sm border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5 shrink-0';
    searchFilterBar?.classList.add('hidden');
  }
}

function renderContent() {
  const gridContainer = document.getElementById('profilesGrid');
  const usersContainer = document.getElementById('usersManagementSection');

  if (state.activeTab === 'users') {
    gridContainer.classList.add('hidden');
    usersContainer.classList.remove('hidden');
    renderUserManagement(usersContainer);
  } else {
    usersContainer.classList.add('hidden');
    gridContainer.classList.remove('hidden');
    renderProfiles();
  }
}

function renderUserManagement(container) {
  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-base font-bold">Staff, Caregiver & Volunteer User Accounts</h2>
          <p class="text-xs text-slate-500">Create and manage account login credentials and assigned roles.</p>
        </div>
        <button onclick="openNewUserModal()" class="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs">
          + Create Account
        </button>
      </div>

      <div class="overflow-x-auto pt-2">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b dark:border-slate-800 text-slate-400 font-semibold">
              <th class="pb-3">Username / ID</th>
              <th class="pb-3">Role</th>
              <th class="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-slate-800">
            ${state.users.map(u => `
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="py-3 font-mono font-bold">${u.username}</td>
                <td class="py-3"><span class="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold uppercase text-[10px]">${u.role}</span></td>
                <td class="py-3 text-right">
                  ${u.username !== 'admin' ? `<button onclick="deleteUser('${u.id}')" class="text-rose-600 hover:underline font-semibold">Delete</button>` : '<span class="text-slate-400 italic">Protected</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderProfiles() {
  const container = document.getElementById('profilesGrid');
  if (!container) return;

  const currentType = state.activeTab === 'clients' ? 'client' : 'volunteer';
  const query = state.searchQuery.toLowerCase();

  const filtered = state.profiles.filter(p => {
    if (p.type !== currentType) return false;
    if (state.categoryFilter !== 'ALL' && p.category !== state.categoryFilter) return false;
    if (query) {
      return p.name.toLowerCase().includes(query) || p.pseudonym.toLowerCase().includes(query);
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800">No records found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(profile => {
    const profileUpdates = state.updates.filter(u => u.profileId === profile.id && canSeeCategory(u.category, state.role));
    const displayName = state.anonymizeMode ? profile.pseudonym : profile.name;
    const membershipTag = profile.type === 'client' && profile.membershipTier ? ` <span class="font-mono text-emerald-600">${profile.membershipTier} (${profile.membershipMonth || 'Apr 2026'})</span>` : '';

    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">${profile.pseudonym}</span>
              ${profile.isUrgent && state.role !== 'caregiver' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">URGENT</span>' : ''}
            </div>
            <h3 class="font-bold text-base sm:text-lg">${displayName} ${membershipTag}</h3>
            <span class="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">${profile.category}</span>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t dark:border-slate-800 text-xs">
          <p class="font-semibold text-slate-500">Updates History (${profileUpdates.length}):</p>
          ${profileUpdates.length === 0 ? '<p class="text-slate-400 italic">No visible updates.</p>' : profileUpdates.map(u => `
            <div class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <div class="flex justify-between text-[10px] text-slate-400">
                <span>[${u.date}] •${u.category}</span>
                <span>By ${u.author}</span>
              </div>
              <p class="text-slate-700 dark:text-slate-300">${u.notes}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderStats() {
  const totalEl = document.getElementById('statTotalProfiles');
  const urgentEl = document.getElementById('statUrgentCount');
  const updatesEl = document.getElementById('statTotalUpdates');

  const currentType = state.activeTab === 'clients' ? 'client' : 'volunteer';
  const relevant = state.profiles.filter(p => p.type === currentType);

  if (totalEl) totalEl.textContent = relevant.length;
  if (urgentEl) urgentEl.textContent = relevant.filter(p => p.isUrgent).length;
  if (updatesEl) updatesEl.textContent = state.updates.length;
}

// Export to Excel / CSV generator
function exportDataToExcel() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID,Type,Name,Pseudonym,Membership,Category,Urgent,Details\r\n";

  state.profiles.forEach(p => {
    const row = [
      p.id,
      p.type,
      `"${p.name}"`,
      `"${p.pseudonym}"`,
      `"${p.membershipTier || ''} ${p.membershipMonth || ''}"`,
      p.category,
      p.isUrgent ? 'YES' : 'NO',
      `"${(p.familyMembers || []).join(', ')}"`
    ];
    csvContent += row.join(",") + "\r\n";
  });

  csvContent += "\r\n-- UPDATES LOG --\r\n";
  csvContent += "UpdateID,ProfileID,Date,Category,Author,Notes\r\n";
  state.updates.forEach(u => {
    const row = [
      u.id,
      u.profileId,
      u.date,
      u.category,
      `"${u.author}"`,
      `"${u.notes.replace(/"/g, '""')}"`
    ];
    csvContent += row.join(",") + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `CareTrack_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Excel/CSV export downloaded successfully!', 'success');
}

// User accounts management
function openNewUserModal() {
  document.getElementById('newUserModal').classList.remove('hidden');
}

function saveNewUser(e) {
  e.preventDefault();
  const username = document.getElementById('nu_username').value.trim();
  const password = document.getElementById('nu_password').value.trim();
  const role = document.getElementById('nu_role').value;

  if (state.users.some(u => u.username === username)) {
    showToast('Username already exists.', 'error');
    return;
  }

  state.users.push({ id: 'u-' + Date.now(), username, password, role });
  state.save();
  closeModals();
  document.getElementById('newUserForm').reset();
  showToast('User account created successfully!', 'success');
  renderApp();
}

function deleteUser(id) {
  state.users = state.users.filter(u => u.id !== id);
  state.save();
  showToast('User account deleted.', 'info');
  renderApp();
}

// Autofill for logging updates
function updateUpdateProfileAutofillList() {
  const targetType = document.getElementById('nu_targetType')?.value || 'client';
  const listEl = document.getElementById('profileAutofillList');
  if (!listEl) return;

  const validProfiles = state.profiles.filter(p => p.type === targetType);
  listEl.innerHTML = validProfiles.map(p => `<option value="${p.name} (${p.pseudonym})"></option>`).join('');
}

function openNewUpdateModal() {
  const modal = document.getElementById('newUpdateModal');
  const targetTypeSelect = document.getElementById('nu_targetType');

  if (state.role === 'volunteer') {
    if (targetTypeSelect) {
      targetTypeSelect.value = 'client';
      targetTypeSelect.disabled = true;
    }
  } else {
    if (targetTypeSelect) targetTypeSelect.disabled = false;
  }

  document.getElementById('nu_date').value = new Date().toISOString().split('T')[0];
  updateUpdateProfileAutofillList();
  if (modal) modal.classList.remove('hidden');
}

function saveNewUpdate(e) {
  e.preventDefault();
  const targetType = document.getElementById('nu_targetType').value;
  const searchInputVal = document.getElementById('nu_profileSearchInput').value.trim();
  const date = document.getElementById('nu_date').value;
  const category = document.getElementById('nu_category').value;
  const notes = document.getElementById('nu_notes').value.trim();

  const matchedProfile = state.profiles.find(p => 
    p.type === targetType && (searchInputVal.includes(p.name) || searchInputVal.includes(p.pseudonym))
  );

  if (!matchedProfile) {
    showToast('Please select a valid profile from the autofill list.', 'error');
    return;
  }

  if (!canSeeCategory(category, state.role)) {
    showToast('Your role does not have permission to log updates in this category.', 'error');
    return;
  }

  const newUpdate = {
    id: 'u-' + Date.now(),
    profileId: matchedProfile.id,
    profileType: targetType,
    date,
    category,
    notes,
    author: state.currentUser || state.role,
  };

  state.updates.unshift(newUpdate);
  state.save();
  closeModals();
  document.getElementById('newUpdateForm').reset();
  showToast('Update logged successfully!', 'success');
  renderApp();
}

function openNewProfileModal() {
  document.getElementById('newProfileModal').classList.remove('hidden');
}

function toggleProfileFields() {
  const type = document.getElementById('np_type').value;
  const clientDiv = document.getElementById('clientMembershipDiv');
  const clientFields = document.getElementById('np_clientFields');
  const volFields = document.getElementById('np_volFields');

  if (type === 'client') {
    clientDiv?.classList.remove('hidden');
    clientFields?.classList.remove('hidden');
    volFields?.classList.add('hidden');
  } else {
    clientDiv?.classList.add('hidden');
    clientFields?.classList.add('hidden');
    volFields?.classList.remove('hidden');
  }
}

function saveNewProfile(e) {
  e.preventDefault();
  const type = document.getElementById('np_type').value;
  const name = document.getElementById('np_name').value.trim();
  const category = document.getElementById('np_category').value;
  const isUrgent = document.getElementById('np_isUrgent').checked;
  const membershipTier = document.getElementById('np_membershipTier')?.value || '$';
  const membershipMonth = document.getElementById('np_membershipMonth')?.value.trim() || 'Apr 2026';
  const family = document.getElementById('np_family')?.value.trim() || '';
  const availability = document.getElementById('np_availability')?.value.trim() || '';

  const prefix = type === 'client' ? 'C-' : 'V-';
  const code = 100 + Math.floor(Math.random() * 900);

  const newProfile = {
    id: 'p-' + Date.now(),
    type,
    name,
    pseudonym: `${type === 'client' ? 'Client' : 'Volunteer'} #${prefix}${code}`,
    membershipTier,
    membershipMonth,
    category,
    isUrgent,
    familyMembers: family ? [family] : [],
    availability,
  };

  state.profiles.unshift(newProfile);
  state.save();
  closeModals();
  document.getElementById('newProfileForm').reset();
  showToast('Profile created successfully!', 'success');
  renderApp();
}

function closeModals() {
  document.querySelectorAll('.modal-window').forEach(m => m.classList.add('hidden'));
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `p-3 px-4 rounded-xl shadow-lg text-xs font-semibold text-white ${type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function setupEventListeners() {
  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderProfiles();
    });
  }

  const catSelect = document.getElementById('categoryFilterSelect');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      renderProfiles();
    });
  }
}

// Window bindings
window.handleUserLogin = handleUserLogin;
window.quickDemoUnlock = quickDemoUnlock;
window.lockApplication = lockApplication;
window.switchTab = switchTab;
window.toggleDarkMode = toggleDarkMode;
window.toggleAnonymizeMode = toggleAnonymizeMode;
window.exportDataToExcel = exportDataToExcel;
window.openNewUserModal = openNewUserModal;
window.saveNewUser = saveNewUser;
window.deleteUser = deleteUser;
window.openNewProfileModal = openNewProfileModal;
window.openNewUpdateModal = openNewUpdateModal;
window.closeModals = closeModals;
window.saveNewProfile = saveNewProfile;
window.saveNewUpdate = saveNewUpdate;
window.updateUpdateProfileAutofillList = updateUpdateProfileAutofillList;
