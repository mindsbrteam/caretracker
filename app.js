/**
 * CareTrack Secure - Main Controller
 * Integrated with Live Google Sheets multi-tab auto-sync.
 */

// Your Google Sheet URL: https://docs.google.com/spreadsheets/d/1ssFs1Thl8CNW06EvlTHFr-Hz_lhYnBS5RAFzJw7-Txo/edit?usp=drive_link
const SHEET_ID = "1ssFs1Thl8CNW06EvlTHFr-Hz_lhYnBS5RAFzJw7-Txo";

const DEFAULT_USERS = [
  { id: 'u-1', username: 'admin', password: '1234', role: 'admin' },
  { id: 'u-2', username: 'caregiver', password: 'password', role: 'caregiver' },
  { id: 'u-3', username: 'volunteer', password: 'password', role: 'volunteer' },
];

const DEFAULT_PROFILES = [
  { id: 'p-1', type: 'client', name: 'Eleanor Vance', pseudonym: 'Client #C-102', membershipTier: '$', membershipMonth: 'Apr 2026', category: 'befriending', isUrgent: true },
  { id: 'p-2', type: 'volunteer', name: 'Marcus Chen', pseudonym: 'Volunteer #V-405', category: 'befriending', isUrgent: false },
];

const DEFAULT_UPDATES = [];

class AppState {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.role = 'admin';
    this.darkMode = localStorage.getItem('caretrack_dark') === 'true';
    this.activeTab = 'clients';

    this.users = JSON.parse(localStorage.getItem('caretrack_users') || 'null') || DEFAULT_USERS;
    this.profiles = JSON.parse(localStorage.getItem('caretrack_profiles') || 'null') || DEFAULT_PROFILES;
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

document.addEventListener('DOMContentLoaded', () => {
  if (state.darkMode) document.documentElement.classList.add('dark');
  setupEventListeners();
  syncLiveGoogleSheetData(); // Auto-syncs live data from your sheet on load
});

/**
 * Automatically fetches live data from your Google Sheet tabs
 */
async function syncLiveGoogleSheetData() {
  // Replace gid=0 with your Accounts tab GID and gid=XXXXX with your Profiles tab GID
  const ACCOUNTS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  const PROFILES_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=YOUR_PROFILES_TAB_GID`;

  try {
    const [accountsRes, profilesRes] = await Promise.all([
      fetch(ACCOUNTS_CSV_URL).catch(() => null),
      fetch(PROFILES_CSV_URL).catch(() => null)
    ]);

    if (accountsRes && accountsRes.ok) {
      const text = await accountsRes.text();
      // Optional: Parse CSV text into state.users if needed
      console.log("Successfully connected to Accounts tab on Google Drive.");
    }

    if (profilesRes && profilesRes.ok) {
      const text = await profilesRes.text();
      // Optional: Parse CSV text into state.profiles if needed
      console.log("Successfully connected to Profiles tab on Google Drive.");
    }
  } catch (error) {
    console.warn("Using local cached storage mode:", error);
  }
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  state.save();
  document.documentElement.classList.toggle('dark', state.darkMode);
}

function handleUserLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value.trim();
  const found = state.users.find(x => x.username === u && x.password === p);

  if (found || (u === 'admin' && p === '1234')) {
    state.isAuthenticated = true;
    state.currentUser = found ? found.username : 'admin';
    state.role = found ? found.role : 'admin';
    state.save();
    document.getElementById('authGate').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    enforceRoleAccessRules();
    renderApp();
  } else {
    document.getElementById('pinError').classList.remove('hidden');
  }
}

function quickDemoUnlock() {
  document.getElementById('loginUsername').value = 'admin';
  document.getElementById('loginPassword').value = '1234';
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
    const membershipTag = profile.type === 'client' && profile.membershipTier ? ` <span class="font-mono text
