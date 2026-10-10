/**
 * CareTrack Secure - Main Application Controller
 * Modular, clean, production-grade vanilla JavaScript
 */

import { generateProfileSummary, getSavedGeminiKey, saveGeminiKey, formatDictationIntoCaseNotes, sendChatMessage } from './geminiService.js';
import { ENABLING_GUIDE_SCHEMES } from './enablingGuideData.js';

// ================= CONSTANTS & DEFAULT DATA =================
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes auto-lock
const DEFAULT_PIN = '1234';

const DEFAULT_STAFF = [
  { id: 'st-1', name: 'Julia', email: 'julia.ng@minds.org.sg'},
  { id: 'st-2', name: 'Qiu Rong', email: 'qiurong.lim@minds.org.sg'},
  { id: 'st-3', name: 'Elena Diaz', email: 'elena.diaz@careorg.org', role: 'Volunteer Coordinator' },
  { id: 'st-4', name: 'Dr. Albright', email: 'albright.md@careorg.org', role: 'Clinical Liaison' },
];

const DEFAULT_PROFILES = [
  {
    id: 'p-1',
    type: 'client',
    name: 'Eleanor Vance',
    pseudonym: 'Client #C-102',
    category: 'Medical & Mobility',
    isUrgent: true,
    familyMembers: ['Sarah (Daughter)', 'Robert (Spouse - Deceased)'],
    createdAt: '2026-09-15',
  },
  {
    id: 'p-2',
    type: 'client',
    name: 'Robert Henderson',
    pseudonym: 'Client #C-215',
    category: 'Financial & Utilities',
    isUrgent: false,
    familyMembers: ['David (Son)', 'Clara (Sister)'],
    createdAt: '2026-09-20',
  },
  {
    id: 'p-3',
    type: 'client',
    name: 'Maria Delgado',
    pseudonym: 'Client #C-340',
    category: 'Legal & Advocacy',
    isUrgent: false,
    familyMembers: ['Elena (Granddaughter)'],
    createdAt: '2026-10-01',
  },
  {
    id: 'p-4',
    type: 'volunteer',
    name: 'Marcus Chen',
    pseudonym: 'Volunteer #V-405',
    category: 'Home Visit & Transportation',
    primaryRole: 'Home Visit',
    isUrgent: false,
    availability: 'Tuesdays & Thursdays (13:00 - 17:00)',
    createdAt: '2026-09-01',
  },
  {
    id: 'p-5',
    type: 'volunteer',
    name: 'Samantha Miller',
    pseudonym: 'Volunteer #V-112',
    category: 'Meal Delivery & Outreach',
    primaryRole: 'Meal Delivery',
    isUrgent: false,
    availability: 'Wednesday mornings, Weekend standby',
    createdAt: '2026-09-10',
  },
];

const DEFAULT_UPDATES = [
  {
    id: 'u-1',
    profileId: 'p-1',
    profileType: 'client',
    date: '2026-10-02',
    category: 'Medical',
    notes: 'Home health nurse completed weekly physical therapy assessment. Mobility improved ~15% post-hip surgery. Prescribed medication reconciliation completed. Daughter requested assistance coordinating wheelchair-accessible transportation.',
    authorTag: 'Elena Diaz',
    authorEmail: 'elena.diaz@careorg.org',
    mentions: [],
    createdAt: Date.now() - 7 * 86400000,
  },
  {
    id: 'u-2',
    profileId: 'p-1',
    profileType: 'client',
    date: '2026-10-07',
    category: 'Medical',
    notes: 'URGENT: St. Jude Clinic appointment scheduled for Tuesday. Eleanor requires wheelchair transit service. @Sarah please confirm county transit voucher approval by Monday noon.',
    authorTag: 'Marcus Washington',
    authorEmail: 'marcus.w@careorg.org',
    mentions: ['Sarah Jenkins'],
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'u-3',
    profileId: 'p-2',
    profileType: 'client',
    date: '2026-10-06',
    category: 'Financial',
    notes: 'Received pending electric utility shut-off notice. Heating grant application was submitted with sister Clara. Emergency relief voucher of $350 approved through Community Assistance Fund.',
    authorTag: 'Marcus Washington',
    authorEmail: 'marcus.w@careorg.org',
    mentions: [],
    createdAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'u-4',
    profileId: 'p-3',
    profileType: 'client',
    date: '2026-10-08',
    category: 'Legal',
    notes: 'Consultation conducted with pro-bono elder law attorney regarding Power of Attorney. Notarization session scheduled for next Friday with granddaughter Elena translating.',
    authorTag: 'Sarah Jenkins',
    authorEmail: 'sarah.jenkins@careorg.org',
    mentions: [],
    createdAt: Date.now() - 1 * 86400000,
  },
  {
    id: 'u-5',
    profileId: 'p-4',
    profileType: 'volunteer',
    date: '2026-10-05',
    category: 'Home Visit',
    notes: 'Completed 3.5 hour friendly companionship visit. Played chess with client and assisted in organizing personal mail. Client was alert, communicative, and engaged.',
    authorTag: 'Elena Diaz',
    authorEmail: 'elena.diaz@careorg.org',
    mentions: [],
    createdAt: Date.now() - 4 * 86400000,
  },
  {
    id: 'u-6',
    profileId: 'p-5',
    profileType: 'volunteer',
    date: '2026-10-07',
    category: 'Meal Delivery',
    notes: 'Successfully delivered 14 hot diabetic meal packages across the North District route. Conducted doorstep visual safety checks for all 14 recipients with zero emergencies. @Dr. Albright nutritional feedback received positively.',
    authorTag: 'Samantha Miller',
    authorEmail: 'samantha.volunteer@careorg.org',
    mentions: ['Dr. Albright'],
    createdAt: Date.now() - 2 * 86400000,
  },
];

// ================= STATE MANAGEMENT =================
class AppState {
  constructor() {
    this.isAuthenticated = false;
    this.currentPin = localStorage.getItem('caretrack_pin') || DEFAULT_PIN;
    this.anonymizeMode = localStorage.getItem('caretrack_anon') === 'false' ? false : true;
    this.activeTab = 'clients'; // 'clients' | 'volunteers'
    this.selectedProfileId = null;

    // Data load from localStorage with fallback
    this.profiles = JSON.parse(localStorage.getItem('caretrack_profiles') || 'null') || DEFAULT_PROFILES;
    this.updates = JSON.parse(localStorage.getItem('caretrack_updates') || 'null') || DEFAULT_UPDATES;
    this.staffList = JSON.parse(localStorage.getItem('caretrack_staff') || 'null') || DEFAULT_STAFF;
    
    // EmailJS settings
    this.emailJsConfig = JSON.parse(localStorage.getItem('caretrack_emailjs') || '{}');

    // Filtering state
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.categoryFilter = 'ALL';
    this.urgentFilter = 'ALL'; // 'ALL' | 'URGENT' | 'ROUTINE'

    // Inactivity timer
    this.lastActivityTime = Date.now();
    this.inactivityInterval = null;
  }

  save() {
    localStorage.setItem('caretrack_pin', this.currentPin);
    localStorage.setItem('caretrack_anon', this.anonymizeMode);
    localStorage.setItem('caretrack_profiles', JSON.stringify(this.profiles));
    localStorage.setItem('caretrack_updates', JSON.stringify(this.updates));
    localStorage.setItem('caretrack_staff', JSON.stringify(this.staffList));
    localStorage.setItem('caretrack_emailjs', JSON.stringify(this.emailJsConfig));
  }

  resetToDemo() {
    this.profiles = [...DEFAULT_PROFILES];
    this.updates = [...DEFAULT_UPDATES];
    this.staffList = [...DEFAULT_STAFF];
    this.currentPin = DEFAULT_PIN;
    this.save();
  }
}

const state = new AppState();

// ================= INACTIVITY AUTO-LOCK =================
function resetInactivityTimer() {
  state.lastActivityTime = Date.now();
  updateInactivityBadge();
}

function initInactivityListeners() {
  const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
  events.forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  // Check every 10 seconds
  if (state.inactivityInterval) clearInterval(state.inactivityInterval);
  state.inactivityInterval = setInterval(() => {
    if (!state.isAuthenticated) return;
    
    const idleTime = Date.now() - state.lastActivityTime;
    if (idleTime >= INACTIVITY_TIMEOUT_MS) {
      lockApplication(true);
    } else {
      updateInactivityBadge();
    }
  }, 10000);
}

function updateInactivityBadge() {
  const badge = document.getElementById('inactivityBadge');
  if (!badge) return;
  const idleTime = Date.now() - state.lastActivityTime;
  const remainingMinutes = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - idleTime) / 60000));
  badge.textContent = `Auto-Lock: ${remainingMinutes}m`;
}

function lockApplication(dueToInactivity = false) {
  state.isAuthenticated = false;
  document.getElementById('authGate').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
  const pinInput = document.getElementById('pinInput');
  if (pinInput) pinInput.value = '';
  
  const alertEl = document.getElementById('pinAutoLockAlert');
  if (alertEl) {
    if (dueToInactivity) {
      alertEl.classList.remove('hidden');
      alertEl.textContent = 'Session locked due to 15 minutes of inactivity for data privacy.';
    } else {
      alertEl.classList.add('hidden');
    }
  }
}

// ================= PSEUDONYMIZATION HELPERS =================
function getClientDisplay(profile) {
  if (state.anonymizeMode) {
    return profile.pseudonym;
  }
  return `${profile.name} <span class="text-xs font-mono font-normal text-slate-400">(${profile.pseudonym})</span>`;
}

function getMaskedFamilyMembers(profile) {
  if (!profile.familyMembers || profile.familyMembers.length === 0) return [];
  if (!state.anonymizeMode) return profile.familyMembers;

  return profile.familyMembers.map((fam, i) => {
    const role = fam.split('(')[1]?.replace(')', '') || 'Family Contact';
    return `${role} [FM-${i + 1}]`;
  });
}

// ================= EMAIL & @MENTION DISPATCH =================
/**
 * Detects mentions like @Sarah or @Marcus Washington in notes
 */
function extractMentions(text) {
  const mentions = [];
  state.staffList.forEach(staff => {
    // Match @FullName or @FirstName
    const firstName = staff.name.split(' ')[0];
    const regexFull = new RegExp(`@${escapeRegex(staff.name)}\\b`, 'i');
    const regexFirst = new RegExp(`@${escapeRegex(firstName)}\\b`, 'i');
    if (regexFull.test(text) || regexFirst.test(text)) {
      mentions.push(staff.name);
    }
  });
  return Array.from(new Set(mentions));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Dispatches email notifications for tagged staff members
 */
async function dispatchMentionNotifications(profile, updateNote, taggedNames, author) {
  if (!taggedNames || taggedNames.length === 0) return;

  const targetStaff = state.staffList.filter(s => taggedNames.includes(s.name));
  if (targetStaff.length === 0) return;

  const profileLabel = state.anonymizeMode ? profile.pseudonym : profile.name;
  const emailList = targetStaff.map(s => s.email).filter(Boolean);

  // 1. If EmailJS is configured, trigger client-side dispatch
  const cfg = state.emailJsConfig;
  if (window.emailjs && cfg.serviceId && cfg.templateId && cfg.publicKey) {
    try {
      window.emailjs.init(cfg.publicKey);
      for (const staff of targetStaff) {
        await window.emailjs.send(cfg.serviceId, cfg.templateId, {
          to_name: staff.name,
          to_email: staff.email,
          from_name: author || 'CareTrack Staff',
          profile_id: profileLabel,
          note_excerpt: updateNote,
          action_link: window.location.href,
        });
      }
      showToast(`Notification sent to: ${emailList.join(', ')}`, 'success');
      return;
    } catch (e) {
      console.warn('EmailJS dispatch error, using mailto fallback:', e);
    }
  }

  // 2. Fallback: Prompt user with mailto link or notification banner
  const subject = encodeURIComponent(`[CareTrack Task Notification] Update regarding ${profileLabel}`);
  const body = encodeURIComponent(
    `Hello Team,\n\nYou were mentioned in a CareTrack update by ${author || 'Staff'}:\n\n` +
    `Profile: ${profileLabel} (${profile.type.toUpperCase()})\n` +
    `Note Excerpt:\n"${updateNote}"\n\n` +
    `Please review this task in the CareTrack Secure Portal: ${window.location.href}\n\n` +
    `-- CareTrack Confidential Health & Volunteer System`
  );

  const mailtoUrl = `mailto:${emailList.join(',')}?subject=${subject}&body=${body}`;
  showMentionAlert(targetStaff, mailtoUrl, updateNote);
}

function showMentionAlert(staffList, mailtoUrl, note) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const names = staffList.map(s => s.name).join(', ');
  const toast = document.createElement('div');
  toast.className = 'bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col space-y-2 max-w-md animate-fade-in text-xs';
  toast.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="font-bold text-amber-400 flex items-center">
        <svg class="w-4 h-4 mr-1 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
        Staff Mentioned: ${names}
      </span>
      <button onclick="this.parentElement.parentElement.remove()" class="text-slate-400 hover:text-white">&times;</button>
    </div>
    <p class="text-slate-300">Staff members were tagged. Click below to launch your email client with a pre-filled task handover.</p>
    <div class="flex space-x-2 pt-1">
      <a href="${mailtoUrl}" target="_blank" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold inline-block">
        Open Email Dispatch
      </a>
      <button onclick="this.parentElement.parentElement.remove()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
        Dismiss
      </button>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 12000);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `p-3 px-4 rounded-xl shadow-lg text-xs font-semibold text-white animate-fade-in ${
    type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
  }`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ================= RENDERING LOGIC =================
function renderApp() {
  renderHeader();
  renderProfiles();
  if (state.selectedProfileId) {
    renderProfileDetail(state.selectedProfileId);
  } else {
    hideProfileDetail();
  }
}

function renderHeader() {
  const anonToggle = document.getElementById('anonymizeToggle');
  const anonSlider = document.getElementById('anonymizeSlider');
  const anonLabel = document.getElementById('anonymizeLabel');
  
  if (state.anonymizeMode) {
    anonToggle.className = 'w-11 h-6 bg-emerald-600 rounded-full relative transition p-0.5 cursor-pointer';
    anonSlider.className = 'w-5 h-5 bg-white rounded-full transition transform translate-x-5 shadow-sm';
    if (anonLabel) anonLabel.textContent = 'Masked View (Protected)';
  } else {
    anonToggle.className = 'w-11 h-6 bg-slate-300 rounded-full relative transition p-0.5 cursor-pointer';
    anonSlider.className = 'w-5 h-5 bg-white rounded-full transition transform translate-x-0 shadow-sm';
    if (anonLabel) anonLabel.textContent = 'Staff Admin View';
  }

  // Active tab styling
  const tabClients = document.getElementById('tabBtnClients');
  const tabVolunteers = document.getElementById('tabBtnVolunteers');
  if (state.activeTab === 'clients') {
    tabClients.className = 'py-3.5 px-4 font-bold text-sm border-b-2 border-indigo-600 text-indigo-600 flex items-center space-x-2';
    tabVolunteers.className = 'py-3.5 px-4 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center space-x-2';
  } else {
    tabClients.className = 'py-3.5 px-4 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center space-x-2';
    tabVolunteers.className = 'py-3.5 px-4 font-bold text-sm border-b-2 border-emerald-600 text-emerald-600 flex items-center space-x-2';
  }

  // Gemini key status indicator
  const geminiIndicator = document.getElementById('geminiKeyIndicator');
  if (geminiIndicator) {
    const hasKey = !!getSavedGeminiKey();
    if (hasKey) {
      geminiIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500';
      geminiIndicator.title = 'Gemini 2.5 Flash API Key Configured';
    } else {
      geminiIndicator.className = 'w-2 h-2 rounded-full bg-amber-400';
      geminiIndicator.title = 'Offline Heuristics Active (Click to add Gemini Key)';
    }
  }
}

function renderProfiles() {
  const container = document.getElementById('profilesGrid');
  if (!container) return;

  const currentType = state.activeTab === 'clients' ? 'client' : 'volunteer';
  const query = state.searchQuery.toLowerCase();

  // Filter profiles based on type, search query, urgent flag, date, category
  const filtered = state.profiles.filter(p => {
    if (p.type !== currentType) return false;

    // Urgent filter
    if (state.urgentFilter === 'URGENT' && !p.isUrgent) return false;
    if (state.urgentFilter === 'ROUTINE' && p.isUrgent) return false;

    // Category filter
    if (state.categoryFilter !== 'ALL' && p.category !== state.categoryFilter) return false;

    // Updates search & date range
    const profileUpdates = state.updates.filter(u => u.profileId === p.id);
    
    // Date range filter
    if (state.dateFrom || state.dateTo) {
      const hasUpdateInRange = profileUpdates.some(u => {
        if (state.dateFrom && u.date < state.dateFrom) return false;
        if (state.dateTo && u.date > state.dateTo) return false;
        return true;
      });
      if (!hasUpdateInRange && profileUpdates.length > 0) return false;
    }

    // Text search query across name, pseudonym, notes, and authors
    if (query) {
      const matchName = p.name.toLowerCase().includes(query) || p.pseudonym.toLowerCase().includes(query);
      const matchCat = (p.category || '').toLowerCase().includes(query);
      const matchNotes = profileUpdates.some(u => 
        u.notes.toLowerCase().includes(query) || 
        (u.authorTag && u.authorTag.toLowerCase().includes(query))
      );
      return matchName || matchCat || matchNotes;
    }

    return true;
  });

  // Render stats
  renderStats(currentType);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
        <div class="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h4 class="text-sm font-bold text-slate-700">No profiles match your filter criteria</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try clearing search terms or reset the urgency and category dropdowns.</p>
        <button onclick="clearFilters()" class="mt-4 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition">
          Clear Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(profile => {
    const profileUpdates = state.updates.filter(u => u.profileId === profile.id);
    const latestUpdate = profileUpdates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const isSelected = state.selectedProfileId === profile.id;

    const displayTitle = getClientDisplay(profile);
    const maskedFamily = getMaskedFamilyMembers(profile);

    return `
      <div 
        onclick="selectProfile('${profile.id}')"
        class="bg-white rounded-2xl border transition-all duration-200 p-5 cursor-pointer relative hover:shadow-md flex flex-col justify-between ${
          isSelected 
            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' 
            : 'border-slate-200/90 shadow-xs'
        } ${profile.isUrgent ? 'border-l-4 border-l-rose-500' : ''}"
      >
        <div>
          <!-- Header Line -->
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <div class="flex items-center space-x-1.5 mb-1">
                <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  ${profile.pseudonym}
                </span>
                ${profile.isUrgent ? `
                  <span class="pulse-urgent inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1"></span> URGENT
                  </span>
                ` : `
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Routine
                  </span>
                `}
              </div>
              <h3 class="text-base font-bold text-slate-800 tracking-tight leading-snug">
                ${displayTitle}
              </h3>
            </div>

            <span class="text-xs px-2.5 py-1 rounded-lg font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              ${profile.category || profile.primaryRole || 'General'}
            </span>
          </div>

          <!-- Family or Availability details -->
          ${maskedFamily.length > 0 ? `
            <div class="text-xs text-slate-500 mb-2 flex items-center space-x-1">
              <span class="font-medium text-slate-400">Caregivers:</span>
              <span class="truncate">${maskedFamily.join(', ')}</span>
            </div>
          ` : ''}

          ${profile.availability ? `
            <div class="text-xs text-emerald-700 bg-emerald-50/60 border border-emerald-100 px-2.5 py-1 rounded-lg mb-2 flex items-center">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>Availability: ${profile.availability}</span>
            </div>
          ` : ''}

          <!-- Latest Note Excerpt with Direct Edit & Delete Controls -->
          <div class="mt-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
            ${latestUpdate ? `
              <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span class="font-medium text-slate-500">Latest update: ${latestUpdate.date}</span>
                <span>By ${latestUpdate.authorTag || 'Staff'}</span>
              </div>
              <p class="line-clamp-2 text-slate-700">${latestUpdate.notes}</p>
              
              <!-- Direct Edit & Delete Buttons for previously filled log -->
              <div class="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/70 text-[11px]">
                <span class="px-2 py-0.5 rounded font-semibold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                  ${latestUpdate.category}
                </span>
                <div class="flex items-center space-x-1.5">
                  <button 
                    type="button"
                    onclick="event.stopPropagation(); openEditUpdateModal('${latestUpdate.id}')"
                    class="inline-flex items-center px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 font-semibold transition text-[11px] shadow-2xs"
                    title="Edit this update log"
                  >
                    <svg class="w-3 h-3 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Edit Log
                  </button>
                  <button 
                    type="button"
                    onclick="event.stopPropagation(); deleteUpdate('${latestUpdate.id}')"
                    class="inline-flex items-center px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-semibold transition text-[11px] shadow-2xs"
                    title="Delete this update log"
                  >
                    <svg class="w-3 h-3 mr-1 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    Delete Log
                  </button>
                </div>
              </div>

              ${profileUpdates.length > 1 ? `
                <div class="mt-2 pt-1 text-right">
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); toggleProfileMiniLogs('${profile.id}')" 
                    class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center"
                    title="Show previous update logs"
                  >
                    <span>View & Manage ${profileUpdates.length - 1} earlier log${profileUpdates.length - 1 > 1 ? 's' : ''}</span>
                    <svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>
                <div id="miniLogs_${profile.id}" class="hidden mt-2 pt-2 border-t border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                  ${profileUpdates.slice(1).map(u => `
                    <div class="p-2 bg-white rounded-lg border border-slate-200/90 text-[11px] flex flex-col space-y-1">
                      <div class="flex items-center justify-between text-slate-500">
                        <span class="font-bold text-slate-700">[${u.date}]</span>
                        <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold">${u.category}</span>
                      </div>
                      <p class="text-slate-600 truncate">${u.notes}</p>
                      <div class="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-100">
                        <button 
                          type="button" 
                          onclick="event.stopPropagation(); openEditUpdateModal('${u.id}')" 
                          class="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold"
                          title="Edit log"
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          onclick="event.stopPropagation(); deleteUpdate('${u.id}')" 
                          class="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[10px] font-semibold"
                          title="Delete log"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

            ` : `
              <p class="text-slate-400 italic">No cumulative updates recorded yet.</p>
            `}
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span class="font-medium text-slate-500">
            <strong>${profileUpdates.length}</strong> updates logged
          </span>

          <div class="flex items-center space-x-1.5">
            <button 
              onclick="event.stopPropagation(); triggerSummaryForProfile('${profile.id}')"
              class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
              title="Generate live AI summary"
            >
              <svg class="w-3.5 h-3.5 mr-1 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              AI Summary
            </button>
            <button
              onclick="event.stopPropagation(); printProfileReport('${profile.id}')"
              class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Print profile report"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            </button>
            <button
              onclick="event.stopPropagation(); openEditProfileModal('${profile.id}')"
              class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
              title="Edit Profile Details"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button
              onclick="event.stopPropagation(); deleteProfile('${profile.id}')"
              class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
              title="Delete Profile"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderStats(type) {
  const countEl = document.getElementById('statTotalProfiles');
  const urgentEl = document.getElementById('statUrgentCount');
  const updatesEl = document.getElementById('statTotalUpdates');

  const relevantProfiles = state.profiles.filter(p => p.type === type);
  const urgentCount = relevantProfiles.filter(p => p.isUrgent).length;
  const relevantUpdates = state.updates.filter(u => u.profileType === type);

  if (countEl) countEl.textContent = relevantProfiles.length;
  if (urgentEl) urgentEl.textContent = urgentCount;
  if (updatesEl) updatesEl.textContent = relevantUpdates.length;
}

// ================= PROFILE DETAIL & TIMELINE VIEW =================
function renderProfileDetail(profileId) {
  const drawer = document.getElementById('profileDetailDrawer');
  const container = document.getElementById('profileDetailContent');
  if (!drawer || !container) return;

  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;

  drawer.classList.remove('hidden');

  const profileUpdates = state.updates
    .filter(u => u.profileId === profile.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const displayTitle = getClientDisplay(profile);
  const maskedFamily = getMaskedFamilyMembers(profile);

  container.innerHTML = `
    <!-- Top Details Banner -->
    <div class="p-6 bg-slate-900 text-white rounded-2xl relative overflow-hidden mb-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 mb-1.5">
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              ${profile.pseudonym}
            </span>
            ${profile.isUrgent ? `
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                HIGH PRIORITY CASE
              </span>
            ` : `
              <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                Routine Case
              </span>
            `}
          </div>

          <h2 class="text-2xl font-bold tracking-tight">${displayTitle}</h2>
          <p class="text-xs text-slate-400 mt-1">
            Category: <span class="text-slate-200 font-medium">${profile.category || profile.primaryRole || 'General'}</span>
            ${profile.availability ? ` • Availability: ${profile.availability}` : ''}
          </p>

          ${maskedFamily.length > 0 ? `
            <p class="text-xs text-slate-400 mt-1">
              Registered Caregivers: <span class="text-slate-200">${maskedFamily.join(', ')}</span>
            </p>
          ` : ''}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button 
            onclick="triggerSummaryForProfile('${profile.id}')"
            class="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Live AI Summary (gemini-2.5-flash)</span>
          </button>

          <button 
            onclick="openNewUpdateModal('${profile.id}')"
            class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Add Update Note</span>
          </button>

          <button 
            onclick="printProfileReport('${profile.id}')"
            class="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Print profile report"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          </button>

          <button 
            onclick="toggleProfileUrgent('${profile.id}')"
            class="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs font-semibold"
            title="Toggle urgent status"
          >
            ${profile.isUrgent ? 'Mark Routine' : 'Mark Urgent'}
          </button>

          <button 
            onclick="openEditProfileModal('${profile.id}')"
            class="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
            title="Edit profile details"
          >
            <svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>Edit Profile</span>
          </button>

          <button 
            onclick="deleteProfile('${profile.id}')"
            class="px-3 py-2.5 bg-slate-800 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
            title="Delete this profile"
          >
            <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span>Delete Profile</span>
          </button>

          <button 
            onclick="closeProfileDetail()"
            class="p-2.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white rounded-xl transition"
            title="Close view"
          >
            &times;
          </button>
        </div>
      </div>
    </div>

    <!-- Cumulative Updates Timeline -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-800">
          Cumulative Progress Timeline (${profileUpdates.length} Updates)
        </h3>
        <span class="text-xs text-slate-400">Organized in reverse chronological order</span>
      </div>

      ${profileUpdates.length === 0 ? `
        <div class="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <p class="text-xs text-slate-400">No updates logged yet for this profile.</p>
          <button onclick="openNewUpdateModal('${profile.id}')" class="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Log First Progress Update
          </button>
        </div>
      ` : profileUpdates.map(update => {
        return `
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition hover:border-slate-300">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div class="flex items-center space-x-2">
                <span class="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  ${update.category}
                </span>
                <span class="text-xs text-slate-400">${update.date}</span>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>By <strong>${update.authorTag || 'Staff'}</strong> ${update.authorEmail ? `(${update.authorEmail})` : ''}</span>
                <div class="flex items-center space-x-1.5 ml-1">
                  <button 
                    onclick="openEditUpdateModal('${update.id}')" 
                    class="inline-flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition" 
                    title="Edit this update log"
                  >
                    <svg class="w-3.5 h-3.5 mr-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Edit Log
                  </button>
                  <button 
                    onclick="deleteUpdate('${update.id}')" 
                    class="inline-flex items-center px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition" 
                    title="Delete this update log"
                  >
                    <svg class="w-3.5 h-3.5 mr-1 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    Delete Log
                  </button>
                </div>
              </div>
            </div>

            <div class="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <p class="whitespace-pre-line">${highlightMentions(update.notes)}</p>
            </div>

            ${update.mentions && update.mentions.length > 0 ? `
              <div class="mt-2 text-[11px] text-indigo-700 flex items-center space-x-1">
                <span class="font-semibold">Tagged Team Members:</span>
                <span>${update.mentions.join(', ')}</span>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function highlightMentions(text) {
  return text.replace(/@([A-Za-z0-9._]+(?:\s[A-Za-z0-9._]+)?)/g, '<span class="bg-indigo-100 text-indigo-800 font-semibold px-1 py-0.5 rounded">@$1</span>');
}

function hideProfileDetail() {
  const drawer = document.getElementById('profileDetailDrawer');
  if (drawer) drawer.classList.add('hidden');
}

// ================= LIVE AI SUMMARY MODAL =================
async function triggerSummaryForProfile(profileId) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;

  const modal = document.getElementById('aiSummaryModal');
  const content = document.getElementById('aiSummaryContent');
  if (!modal || !content) return;

  modal.classList.remove('hidden');
  content.innerHTML = `
    <div class="p-12 text-center space-y-3">
      <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <h3 class="text-base font-bold text-slate-800">Synthesizing Cumulative Updates</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">Analyzing complete case history with Google Gemini 2.5 Flash for milestones, risks, and next steps...</p>
    </div>
  `;

  const profileUpdates = state.updates.filter(u => u.profileId === profile.id);
  const result = await generateProfileSummary(profile, profileUpdates, state.anonymizeMode);

  const displayTitle = getClientDisplay(profile);

  content.innerHTML = `
    <div class="space-y-6">
      
      <!-- Summary Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              ${profile.pseudonym}
            </span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${
              result.sentiment === 'Needs Attention' || result.sentiment === 'Critical Urgent' 
                ? 'bg-rose-100 text-rose-800' 
                : result.sentiment === 'Improving' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-indigo-100 text-indigo-800'
            }">
              Trajectory: ${result.sentiment}
            </span>
          </div>
          <h2 class="text-xl font-bold text-slate-900 mt-1">${displayTitle}</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">Synthesized at ${result.generatedAt} • ${profileUpdates.length} updates analyzed</p>
        </div>

        <div class="flex flex-col items-end">
          <span class="text-[11px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            Engine: ${result.modelUsed}
          </span>
          <span class="text-xs text-slate-500 mt-1">Status: <strong>${result.currentStatus}</strong></span>
        </div>
      </div>

      ${result.apiWarning ? `
        <div class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs">
          <strong>Notice:</strong> ${result.apiWarning}
        </div>
      ` : ''}

      <!-- Executive Narrative -->
      <div class="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl text-sm text-slate-700 leading-relaxed">
        <h4 class="font-bold text-indigo-950 text-xs uppercase tracking-wider mb-1.5 flex items-center">
          <svg class="w-4 h-4 mr-1 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Executive AI Overview
        </h4>
        <p>${result.narrative}</p>
      </div>

      <!-- Two column breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Milestones -->
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          <h4 class="font-bold text-xs uppercase tracking-wider text-slate-600 mb-2.5 flex items-center">
            <svg class="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Key Milestones & Achievements
          </h4>
          <ul class="text-xs text-slate-600 space-y-2">
            ${result.milestones.map(m => `<li class="flex items-start"><span class="text-emerald-500 mr-2">•</span> <span>${m}</span></li>`).join('')}
          </ul>
        </div>

        <!-- Next Actions -->
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          <h4 class="font-bold text-xs uppercase tracking-wider text-slate-600 mb-2.5 flex items-center">
            <svg class="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            Recommended Next Steps
          </h4>
          <ul class="text-xs text-slate-600 space-y-2">
            ${result.nextSteps.map(s => `<li class="flex items-start"><span class="text-indigo-500 mr-2">•</span> <span>${s}</span></li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Singapore Schemes, CHAS Cards & AIC Grants Card -->
      ${result.enablingGuideSchemes && result.enablingGuideSchemes.length > 0 ? `
        <div class="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-emerald-50/70 border border-indigo-200/90 p-4 rounded-2xl">
          <div class="flex items-center justify-between mb-2.5">
            <h4 class="font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center">
              <span class="mr-1.5 text-base leading-none">🇸🇬</span>
              <span>Singapore Schemes, CHAS Cards & AIC Grants</span>
            </h4>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              Matched Resources
            </span>
          </div>

          <div class="space-y-2.5">
            ${result.enablingGuideSchemes.map(scheme => {
              const url = scheme.url || 'https://www.enablingguide.sg/';
              let domainLabel = 'enablingguide.sg';
              if (url.includes('futureready.minds.org.sg')) domainLabel = 'futureready.minds.org.sg';
              else if (url.includes('whatisstep') || url.includes('minds.org.sg')) domainLabel = 'minds.org.sg (STEP)';
              else if (url.includes('whatismindsmyg') || url.includes('myg.org.sg')) domainLabel = 'myg.org.sg';
              else if (url.includes('chas.sg')) domainLabel = 'chas.sg';
              else if (url.includes('aic.sg')) domainLabel = 'aic.sg';

              let badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
              if (scheme.category.includes('Transition')) badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
              else if (scheme.category.includes('Future Planning')) badgeClass = 'bg-purple-50 text-purple-800 border border-purple-200';
              else if (scheme.category.includes('Social Engagement')) badgeClass = 'bg-pink-50 text-pink-800 border border-pink-200';
              else if (url.includes('chas.sg')) badgeClass = 'bg-blue-50 text-blue-800 border border-blue-200';
              else if (url.includes('aic.sg')) badgeClass = 'bg-indigo-50 text-indigo-800 border border-indigo-200';

              return `
              <div class="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition">
                <div class="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <span class="font-bold text-xs text-slate-800">${escapeHtml(scheme.name)}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}">
                    ${escapeHtml(scheme.category || 'Disability & Healthcare Support')}
                  </span>
                </div>
                <p class="text-xs text-slate-600 mb-1.5 leading-relaxed">${escapeHtml(scheme.recommendationReason)}</p>
                ${scheme.keyAction ? `
                  <p class="text-[11px] text-slate-500 mb-2"><strong>Recommended Action:</strong> ${escapeHtml(scheme.keyAction)}</p>
                ` : ''}
                <div class="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                  <a 
                    href="${url}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center"
                  >
                    <span>View Official ${domainLabel} Guide</span>
                    <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </a>
                  <button 
                    type="button" 
                    onclick="event.stopPropagation(); askAiAboutScheme('${escapeHtml(scheme.name)}')" 
                    class="text-[10px] px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold"
                  >
                    💬 Ask AI Caseworker
                  </button>
                </div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Action buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
        <button 
          onclick="copySummaryToClipboard()"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
        >
          Copy Summary Text
        </button>

        <div class="space-x-2">
          <button 
            onclick="printProfileReport('${profile.id}')"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
          >
            Print Executive Brief
          </button>
        </div>
      </div>

    </div>
  `;
}

// ================= PRINT TO PDF HANDLER =================
function printProfileReport(profileId) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;

  const profileUpdates = state.updates
    .filter(u => u.profileId === profile.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const printContainer = document.getElementById('printReportContainer');
  if (!printContainer) return;

  const displayTitle = state.anonymizeMode ? profile.pseudonym : `${profile.name} (${profile.pseudonym})`;
  const maskedFamily = getMaskedFamilyMembers(profile);

  printContainer.innerHTML = `
    <div class="p-6 bg-white max-w-4xl mx-auto">
      <div class="border-b-2 border-indigo-600 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">CareTrack Secure - Case Summary Sheet</h1>
          <p class="text-xs text-slate-500 mt-1">Confidential Healthcare & Social Support Case Record • HIPAA Compliant</p>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold text-slate-800">Generated: ${new Date().toLocaleDateString()}</p>
          <p class="text-xs font-mono text-slate-500">${profile.pseudonym}</p>
        </div>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div><strong>Profile Name:</strong> ${displayTitle}</div>
          <div><strong>Priority Level:</strong> ${profile.isUrgent ? 'URGENT / IMMEDIATE ACTION' : 'Routine'}</div>
          <div><strong>Category/Role:</strong> ${profile.category || profile.primaryRole || 'General'}</div>
          <div><strong>Total Updates:</strong> ${profileUpdates.length} logs</div>
          ${maskedFamily.length > 0 ? `<div class="col-span-2"><strong>Caregivers:</strong> ${maskedFamily.join(', ')}</div>` : ''}
        </div>
      </div>

      <h3 class="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Chronological Case Notes</h3>
      <div class="space-y-4">
        ${profileUpdates.map(u => `
          <div class="print-card border border-slate-300 p-3 rounded-lg text-xs">
            <div class="flex justify-between font-bold text-slate-700 mb-1">
              <span>[${u.date}] Category: ${u.category}</span>
              <span>Logged by ${u.authorTag || 'Staff'}</span>
            </div>
            <p class="text-slate-800 whitespace-pre-line leading-relaxed">${u.notes}</p>
            ${u.mentions && u.mentions.length > 0 ? `<p class="text-slate-500 mt-1">Tagged: ${u.mentions.join(', ')}</p>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
        CareTrack Secure Portal • Confidential Record • Handle with strict privacy safeguards.
      </div>
    </div>
  `;

  // Trigger print
  window.print();
}

// ================= DATA EXPORT & IMPORT =================
function exportCSV() {
  const currentType = state.activeTab === 'clients' ? 'client' : 'volunteer';
  const relevantUpdates = state.updates.filter(u => u.profileType === currentType);

  if (relevantUpdates.length === 0) {
    showToast('No update records available for export.', 'error');
    return;
  }

  const headers = ['UpdateID', 'ProfilePseudonym', 'ProfileName', 'Date', 'Category', 'Author', 'AuthorEmail', 'TaggedStaff', 'Notes'];
  const rows = relevantUpdates.map(u => {
    const profile = state.profiles.find(p => p.id === u.profileId);
    const pseudo = profile ? profile.pseudonym : 'Unknown';
    const name = state.anonymizeMode ? pseudo : (profile ? profile.name : 'Unknown');
    const mentions = u.mentions ? u.mentions.join(';') : '';
    const cleanNotes = `"${(u.notes || '').replace(/"/g, '""')}"`;
    return [u.id, pseudo, `"${name}"`, u.date, u.category, `"${u.authorTag || ''}"`, u.authorEmail || '', `"${mentions}"`, cleanNotes];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `caretrack_${currentType}_updates_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV export successfully downloaded.', 'success');
}

function exportJSONBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    profiles: state.profiles,
    updates: state.updates,
    staffList: state.staffList,
    anonymizeMode: state.anonymizeMode,
    emailJsConfig: state.emailJsConfig,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `caretrack_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('JSON backup exported successfully.', 'success');
}

function importJSONBackup(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.profiles && data.updates) {
        state.profiles = data.profiles;
        state.updates = data.updates;
        if (data.staffList) state.staffList = data.staffList;
        state.save();
        renderApp();
        showToast('Backup restored successfully!', 'success');
        closeModals();
      } else {
        showToast('Invalid backup format.', 'error');
      }
    } catch (err) {
      showToast('Error parsing JSON backup file.', 'error');
    }
  };
  reader.readAsText(file);
}

// ================= CSV BULK IMPORT CONTROLLER =================
let parsedCsvRecords = [];

function openCsvImportModal() {
  parsedCsvRecords = [];
  const modal = document.getElementById('csvImportModal');
  const fileInput = document.getElementById('csvFileInput');
  const pasteArea = document.getElementById('csvPasteTextarea');
  const previewSection = document.getElementById('csvPreviewSection');
  const commitBtn = document.getElementById('csvCommitBtn');
  const tbody = document.getElementById('csvPreviewTableBody');

  if (fileInput) fileInput.value = '';
  if (pasteArea) pasteArea.value = '';
  if (tbody) tbody.innerHTML = '';
  if (previewSection) previewSection.classList.add('hidden');
  if (commitBtn) {
    commitBtn.disabled = true;
    commitBtn.textContent = 'Import 0 Clients into CareTrack';
  }

  setupCsvDropzone();
  if (modal) modal.classList.remove('hidden');
}

function setupCsvDropzone() {
  const dropzone = document.getElementById('csvDropzone');
  if (!dropzone || dropzone.dataset.initialized) return;

  dropzone.dataset.initialized = 'true';
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-active');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleCsvFileSelected(files[0]);
    }
  });
}

function downloadCsvTemplate() {
  const templateHeaders = 'Name,Category,FamilyMembers,Urgent,Notes\n';
  const sampleRows = [
    'Arthur Pendelton,Medical & Mobility,"Brenda (Niece); David (Son)",No,"Bi-weekly nutrition and diabetic check-in established."',
    'Clara Oswald,Financial & Housing,"Son (Danny)",Yes,"Urgent utility shut-off relief voucher required immediately."',
    'David Livingstone,General Support,"Daughter (Hannah)",No,"Routine telephone welfare check scheduled."'
  ].join('\n');

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(templateHeaders + sampleRows);
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', 'caretrack_client_import_template.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Sample CSV template downloaded.', 'info');
}

function handleCsvFileSelected(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    parseCsvString(e.target.result);
  };
  reader.readAsText(file);
}

function parsePastedCsv() {
  const text = document.getElementById('csvPasteTextarea')?.value;
  if (!text || !text.trim()) {
    showToast('Please paste CSV text first.', 'error');
    return;
  }
  parseCsvString(text);
}

// Split CSV text into rows and columns handling quotes and newlines
function parseCsvRows(text) {
  const rows = [];
  let row = [''];
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      rows.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
    i++;
  }
  if (row.length > 1 || row[0] !== '') {
    rows.push(row);
  }
  return rows.filter(r => r.some(cell => cell.trim().length > 0));
}

function parseCsvString(csvText) {
  const rows = parseCsvRows(csvText.trim());
  if (rows.length === 0) {
    showToast('The CSV file or text was empty.', 'error');
    return;
  }

  // Detect header row
  let headerRow = rows[0].map(h => h.trim().toLowerCase());
  let dataRows = rows.slice(1);

  // Column index detection
  let nameIdx = headerRow.findIndex(h => h.includes('name') || h.includes('client'));
  let catIdx = headerRow.findIndex(h => h.includes('category') || h.includes('need') || h.includes('area'));
  let familyIdx = headerRow.findIndex(h => h.includes('family') || h.includes('caregiver'));
  let urgentIdx = headerRow.findIndex(h => h.includes('urgent') || h.includes('priority'));
  let notesIdx = headerRow.findIndex(h => h.includes('note') || h.includes('intake') || h.includes('comment'));

  // If no matching headers found, treat row 0 as data with default column order
  if (nameIdx === -1) {
    nameIdx = 0;
    catIdx = 1;
    familyIdx = 2;
    urgentIdx = 3;
    notesIdx = 4;
    dataRows = rows;
  }

  parsedCsvRecords = [];

  dataRows.forEach((r, idx) => {
    const name = (r[nameIdx] || '').trim();
    if (!name) return; // Skip blank names

    const category = (catIdx !== -1 && r[catIdx] ? r[catIdx].trim() : '') || 'General Support';
    
    // Caregivers
    let familyMembers = [];
    if (familyIdx !== -1 && r[familyIdx]) {
      familyMembers = r[familyIdx]
        .split(/[;,]/)
        .map(f => f.trim())
        .filter(f => f.length > 0);
    }

    // Urgency
    let isUrgent = false;
    if (urgentIdx !== -1 && r[urgentIdx]) {
      const uVal = r[urgentIdx].trim().toLowerCase();
      isUrgent = uVal === 'yes' || uVal === 'true' || uVal === '1' || uVal === 'urgent' || uVal === 'high';
    }

    const notes = notesIdx !== -1 && r[notesIdx] ? r[notesIdx].trim() : '';

    parsedCsvRecords.push({
      name,
      category,
      familyMembers,
      isUrgent,
      notes,
    });
  });

  renderCsvPreview();
}

function renderCsvPreview() {
  const previewSection = document.getElementById('csvPreviewSection');
  const tbody = document.getElementById('csvPreviewTableBody');
  const statsText = document.getElementById('csvStatsText');
  const commitBtn = document.getElementById('csvCommitBtn');

  if (!previewSection || !tbody) return;

  if (parsedCsvRecords.length === 0) {
    showToast('No valid client rows could be parsed. Check column headers.', 'error');
    previewSection.classList.add('hidden');
    if (commitBtn) commitBtn.disabled = true;
    return;
  }

  tbody.innerHTML = parsedCsvRecords.map((r, i) => {
    return `
      <tr class="hover:bg-slate-50">
        <td class="p-2 font-mono text-slate-400">${i + 1}</td>
        <td class="p-2 font-bold text-slate-800">${escapeHtml(r.name)}</td>
        <td class="p-2">
          <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">${escapeHtml(r.category)}</span>
        </td>
        <td class="p-2">
          ${r.isUrgent ? `
            <span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">URGENT</span>
          ` : `
            <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">Routine</span>
          `}
        </td>
        <td class="p-2 text-slate-600 max-w-[140px] truncate">${escapeHtml(r.familyMembers.join(', ') || 'None')}</td>
        <td class="p-2 text-slate-500 max-w-[180px] truncate">${escapeHtml(r.notes || '—')}</td>
      </tr>
    `;
  }).join('');

  if (statsText) {
    statsText.textContent = `Parsed Records: ${parsedCsvRecords.length} client profiles`;
  }

  if (commitBtn) {
    commitBtn.disabled = false;
    commitBtn.textContent = `Import ${parsedCsvRecords.length} Clients into CareTrack`;
  }

  previewSection.classList.remove('hidden');
  showToast(`Parsed ${parsedCsvRecords.length} client records. Review preview below.`, 'success');
}

function commitCsvImport() {
  if (parsedCsvRecords.length === 0) return;

  const mode = document.getElementById('csvDuplicateMode')?.value || 'skip';
  let importedCount = 0;
  let skippedCount = 0;
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  parsedCsvRecords.forEach((r, idx) => {
    // Check duplicates
    const alreadyExists = state.profiles.some(p => p.type === 'client' && p.name.toLowerCase() === r.name.toLowerCase());

    if (alreadyExists && mode === 'skip') {
      skippedCount++;
      return;
    }

    const code = 100 + Math.floor(Math.random() * 900);
    const pseudonym = `Client #C-${code}`;

    const newProfile = {
      id: `p-${now}-${idx}`,
      type: 'client',
      name: r.name,
      pseudonym,
      category: r.category || 'General Support',
      isUrgent: r.isUrgent,
      familyMembers: r.familyMembers,
      availability: '',
      createdAt: today,
    };

    state.profiles.unshift(newProfile);
    importedCount++;

    // If initial notes are provided in the CSV, create an initial case note log automatically
    if (r.notes && r.notes.trim().length > 0) {
      const initialUpdate = {
        id: `u-${now}-${idx}`,
        profileId: newProfile.id,
        profileType: 'client',
        date: today,
        category: r.category || 'General Support',
        notes: r.notes.trim(),
        authorTag: 'CSV Intake Onboarding',
        authorEmail: '',
        mentions: extractMentions(r.notes),
        createdAt: now + idx,
      };
      state.updates.unshift(initialUpdate);
    }
  });

  state.save();
  closeModals();
  switchTab('clients');

  let msg = `Successfully onboarded ${importedCount} client profiles from CSV!`;
  if (skippedCount > 0) {
    msg += ` (${skippedCount} duplicates skipped)`;
  }
  showToast(msg, 'success');
  renderApp();
}

// ================= MODALS & USER ACTIONS =================
function openNewProfileModal() {
  const modal = document.getElementById('newProfileModal');
  const typeSelect = document.getElementById('np_type');
  const editId = document.getElementById('editingProfileId');
  const title = document.getElementById('profileModalTitle');

  if (editId) editId.value = '';
  if (title) title.textContent = 'Create New Profile';
  const form = document.getElementById('newProfileForm');
  if (form) form.reset();

  if (typeSelect) typeSelect.value = state.activeTab === 'clients' ? 'client' : 'volunteer';
  toggleProfileFields();
  if (modal) modal.classList.remove('hidden');
}

function openEditProfileModal(profileId) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;

  const modal = document.getElementById('newProfileModal');
  const editId = document.getElementById('editingProfileId');
  const title = document.getElementById('profileModalTitle');
  const typeSelect = document.getElementById('np_type');
  const nameInput = document.getElementById('np_name');
  const categoryInput = document.getElementById('np_category');
  const urgentCheck = document.getElementById('np_isUrgent');
  const familyInput = document.getElementById('np_family');
  const availInput = document.getElementById('np_availability');

  if (editId) editId.value = profile.id;
  if (title) title.textContent = `Edit Profile Details (${profile.pseudonym})`;
  if (typeSelect) typeSelect.value = profile.type;
  if (nameInput) nameInput.value = profile.name;
  if (categoryInput) categoryInput.value = profile.category || profile.primaryRole || '';
  if (urgentCheck) urgentCheck.checked = !!profile.isUrgent;
  if (familyInput) familyInput.value = (profile.familyMembers || []).join(', ');
  if (availInput) availInput.value = profile.availability || '';

  toggleProfileFields();
  if (modal) modal.classList.remove('hidden');
}

function deleteProfile(profileId) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;

  const label = state.anonymizeMode ? profile.pseudonym : `${profile.name} (${profile.pseudonym})`;
  if (confirm(`Are you sure you want to permanently delete profile "${label}" and all its cumulative updates? This action cannot be undone.`)) {
    state.profiles = state.profiles.filter(p => p.id !== profileId);
    state.updates = state.updates.filter(u => u.profileId !== profileId);
    if (state.selectedProfileId === profileId) {
      state.selectedProfileId = null;
    }
    state.save();
    showToast(`Profile ${profile.pseudonym} and associated logs deleted.`, 'info');
    renderApp();
  }
}

function toggleProfileFields() {
  const type = document.getElementById('np_type').value;
  const clientFields = document.getElementById('np_clientFields');
  const volFields = document.getElementById('np_volFields');
  if (type === 'client') {
    clientFields?.classList.remove('hidden');
    volFields?.classList.add('hidden');
  } else {
    clientFields?.classList.add('hidden');
    volFields?.classList.remove('hidden');
  }
}

function saveNewProfile(e) {
  e.preventDefault();
  const editingId = document.getElementById('editingProfileId')?.value;
  const type = document.getElementById('np_type').value;
  const name = document.getElementById('np_name').value.trim();
  const category = document.getElementById('np_category').value.trim();
  const isUrgent = document.getElementById('np_isUrgent').checked;
  const familyStr = document.getElementById('np_family').value.trim();
  const availability = document.getElementById('np_availability').value.trim();

  if (editingId) {
    // Edit existing profile
    const existing = state.profiles.find(p => p.id === editingId);
    if (existing) {
      existing.name = name;
      existing.type = type;
      existing.category = category || (type === 'client' ? 'General Support' : 'Home Visit');
      existing.isUrgent = isUrgent;
      existing.familyMembers = familyStr ? familyStr.split(',').map(s => s.trim()) : [];
      existing.availability = availability || '';

      state.save();
      closeModals();
      showToast(`Updated profile for ${existing.pseudonym}`, 'success');
      renderApp();
      return;
    }
  }

  // Create new profile
  const code = 100 + Math.floor(Math.random() * 900);
  const pseudonym = type === 'client' ? `Client #C-${code}` : `Volunteer #V-${code}`;

  const newProfile = {
    id: `p-${Date.now()}`,
    type,
    name,
    pseudonym,
    category: category || (type === 'client' ? 'General Support' : 'Home Visit'),
    isUrgent,
    familyMembers: familyStr ? familyStr.split(',').map(s => s.trim()) : [],
    availability: availability || '',
    createdAt: new Date().toISOString().split('T')[0],
  };

  state.profiles.unshift(newProfile);
  state.save();
  closeModals();
  document.getElementById('newProfileForm').reset();
  showToast(`Created profile for ${pseudonym}`, 'success');
  renderApp();
  selectProfile(newProfile.id);
}

function openNewUpdateModal(profileId) {
  const modal = document.getElementById('newUpdateModal');
  const editId = document.getElementById('editingUpdateId');
  const title = document.getElementById('updateModalTitle');
  const submitBtn = document.getElementById('updateModalSubmitBtn');
  const notesTextarea = document.getElementById('nu_notes');

  if (editId) editId.value = '';
  if (title) title.textContent = 'Log Case Update';
  if (submitBtn) submitBtn.textContent = 'Save Update Note';
  if (notesTextarea) notesTextarea.value = '';

  const select = document.getElementById('nu_profileId');
  if (select) {
    select.innerHTML = state.profiles
      .filter(p => p.type === (state.activeTab === 'clients' ? 'client' : 'volunteer'))
      .map(p => `<option value="${p.id}" ${p.id === profileId ? 'selected' : ''}>${state.anonymizeMode ? p.pseudonym : `${p.name} (${p.pseudonym})`}</option>`)
      .join('');
  }

  // Set default date to today
  const dateInput = document.getElementById('nu_date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Populate author select from staff directory
  const authorSelect = document.getElementById('nu_author');
  if (authorSelect) {
    authorSelect.innerHTML = state.staffList
      .map(s => `<option value="${s.name}" data-email="${s.email}">${s.name} (${s.role})</option>`)
      .join('');
  }

  if (modal) modal.classList.remove('hidden');
}

function openEditUpdateModal(updateId) {
  const update = state.updates.find(u => u.id === updateId);
  if (!update) return;

  const modal = document.getElementById('newUpdateModal');
  const editId = document.getElementById('editingUpdateId');
  const title = document.getElementById('updateModalTitle');
  const submitBtn = document.getElementById('updateModalSubmitBtn');
  const select = document.getElementById('nu_profileId');
  const dateInput = document.getElementById('nu_date');
  const categorySelect = document.getElementById('nu_category');
  const authorSelect = document.getElementById('nu_author');
  const notesTextarea = document.getElementById('nu_notes');

  if (editId) editId.value = update.id;
  if (title) title.textContent = 'Edit Case Update Log';
  if (submitBtn) submitBtn.textContent = 'Save Changes to Log';

  if (select) {
    select.innerHTML = state.profiles
      .map(p => `<option value="${p.id}" ${p.id === update.profileId ? 'selected' : ''}>${state.anonymizeMode ? p.pseudonym : `${p.name} (${p.pseudonym})`}</option>`)
      .join('');
  }

  if (dateInput) dateInput.value = update.date;
  if (categorySelect) categorySelect.value = update.category;

  if (authorSelect) {
    authorSelect.innerHTML = state.staffList
      .map(s => `<option value="${s.name}" data-email="${s.email}" ${s.name === update.authorTag ? 'selected' : ''}>${s.name} (${s.role})</option>`)
      .join('');
  }

  if (notesTextarea) notesTextarea.value = update.notes;

  if (modal) modal.classList.remove('hidden');
}

function saveNewUpdate(e) {
  e.preventDefault();
  const editingUpdateId = document.getElementById('editingUpdateId')?.value;
  const profileId = document.getElementById('nu_profileId').value;
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;

  const date = document.getElementById('nu_date').value;
  const category = document.getElementById('nu_category').value;
  const notes = document.getElementById('nu_notes').value.trim();
  const authorSelect = document.getElementById('nu_author');
  const authorName = authorSelect.value;
  const authorEmail = authorSelect.selectedOptions[0]?.getAttribute('data-email') || '';

  // Extract @mentions
  const taggedNames = extractMentions(notes);

  if (editingUpdateId) {
    // Edit existing update log
    const existing = state.updates.find(u => u.id === editingUpdateId);
    if (existing) {
      existing.profileId = profile.id;
      existing.profileType = profile.type;
      existing.date = date;
      existing.category = category;
      existing.notes = notes;
      existing.authorTag = authorName;
      existing.authorEmail = authorEmail;
      existing.mentions = taggedNames;

      state.save();
      closeModals();
      showToast('Case update log edited successfully.', 'success');

      // Dispatch mentions if newly tagged
      if (taggedNames.length > 0) {
        dispatchMentionNotifications(profile, notes, taggedNames, authorName);
      }

      renderApp();
      return;
    }
  }

  // Create new update log
  const newUpdate = {
    id: `u-${Date.now()}`,
    profileId: profile.id,
    profileType: profile.type,
    date,
    category,
    notes,
    authorTag: authorName,
    authorEmail,
    mentions: taggedNames,
    createdAt: Date.now(),
  };

  state.updates.unshift(newUpdate);
  state.save();
  closeModals();
  document.getElementById('newUpdateForm').reset();
  showToast('Progress update logged successfully.', 'success');

  // Trigger @mention notifications if any staff were tagged
  if (taggedNames.length > 0) {
    dispatchMentionNotifications(profile, notes, taggedNames, authorName);
  }

  renderApp();
}

function deleteUpdate(updateId) {
  const update = state.updates.find(u => u.id === updateId);
  const dateStr = update ? update.date : 'this';
  if (confirm(`Are you sure you want to delete this case update log (${dateStr})? This action cannot be undone.`)) {
    state.updates = state.updates.filter(u => u.id !== updateId);
    state.save();
    renderApp();
    showToast('Case update log deleted successfully.', 'info');
  }
}

function toggleProfileMiniLogs(profileId) {
  const el = document.getElementById(`miniLogs_${profileId}`);
  if (el) el.classList.toggle('hidden');
}

function toggleProfileUrgent(profileId) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;
  profile.isUrgent = !profile.isUrgent;
  state.save();
  renderApp();
  showToast(`${profile.pseudonym} urgency updated to ${profile.isUrgent ? 'URGENT' : 'Routine'}`, 'info');
}

// ================= MENTIONS AUTOCOMPLETE HELPER =================
function setupMentionsAutocomplete() {
  const textarea = document.getElementById('nu_notes');
  const dropdown = document.getElementById('mentionsDropdown');
  if (!textarea || !dropdown) return;

  textarea.addEventListener('input', (e) => {
    const val = textarea.value;
    const cursorPos = textarea.selectionStart;
    const lastAt = val.lastIndexOf('@', cursorPos - 1);

    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(val[lastAt - 1]))) {
      const query = val.slice(lastAt + 1, cursorPos).toLowerCase();
      const matches = state.staffList.filter(s => s.name.toLowerCase().includes(query));

      if (matches.length > 0 && query.length < 15) {
        dropdown.innerHTML = matches.map(s => `
          <div 
            class="mention-item px-3 py-2 text-xs cursor-pointer border-b border-slate-100 last:border-none flex justify-between items-center"
            data-name="${s.name}"
            data-at-pos="${lastAt}"
          >
            <div>
              <span class="font-bold text-slate-800">@${s.name}</span>
              <span class="text-[10px] text-slate-400 block">${s.role}</span>
            </div>
            <span class="text-[10px] text-indigo-600">${s.email}</span>
          </div>
        `).join('');

        dropdown.classList.remove('hidden');

        // Attach clicks
        dropdown.querySelectorAll('.mention-item').forEach(item => {
          item.addEventListener('click', () => {
            const name = item.getAttribute('data-name');
            const atPos = parseInt(item.getAttribute('data-at-pos'));
            const before = val.slice(0, atPos);
            const after = val.slice(cursorPos);
            textarea.value = `${before}@${name} ${after}`;
            dropdown.classList.add('hidden');
            textarea.focus();
          });
        });
        return;
      }
    }

    dropdown.classList.add('hidden');
  });

  // Hide on blur
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== textarea) {
      dropdown.classList.add('hidden');
    }
  });
}

// ================= SETTINGS & STAFF MANAGEMENT =================
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const geminiInput = document.getElementById('settingsGeminiKey');
  const emailJsService = document.getElementById('settingsEmailService');
  const emailJsTemplate = document.getElementById('settingsEmailTemplate');
  const emailJsKey = document.getElementById('settingsEmailKey');

  if (geminiInput) geminiInput.value = getSavedGeminiKey();
  if (emailJsService) emailJsService.value = state.emailJsConfig.serviceId || '';
  if (emailJsTemplate) emailJsTemplate.value = state.emailJsConfig.templateId || '';
  if (emailJsKey) emailJsKey.value = state.emailJsConfig.publicKey || '';

  if (modal) modal.classList.remove('hidden');
}

function saveSettings(e) {
  e.preventDefault();
  const geminiKey = document.getElementById('settingsGeminiKey').value;
  saveGeminiKey(geminiKey);

  state.emailJsConfig = {
    serviceId: document.getElementById('settingsEmailService').value.trim(),
    templateId: document.getElementById('settingsEmailTemplate').value.trim(),
    publicKey: document.getElementById('settingsEmailKey').value.trim(),
  };
  state.save();

  closeModals();
  renderHeader();
  showToast('Settings & API Keys saved successfully.', 'success');
}

function openStaffModal() {
  const modal = document.getElementById('staffModal');
  const listEl = document.getElementById('staffListContainer');
  if (listEl) {
    listEl.innerHTML = state.staffList.map((s, idx) => `
      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div>
          <span class="font-bold text-slate-800">@${s.name}</span>
          <span class="text-slate-500 ml-2">(${s.role})</span>
          <p class="text-slate-400 font-mono text-[11px] mt-0.5">${s.email}</p>
        </div>
        <button onclick="removeStaffMember(${idx})" class="text-rose-500 hover:text-rose-700 text-xs font-semibold">
          Remove
        </button>
      </div>
    `).join('');
  }
  if (modal) modal.classList.remove('hidden');
}

function addStaffMember(e) {
  e.preventDefault();
  const name = document.getElementById('newStaffName').value.trim();
  const email = document.getElementById('newStaffEmail').value.trim();
  const role = document.getElementById('newStaffRole').value.trim();

  if (name && email) {
    state.staffList.push({ id: `st-${Date.now()}`, name, email, role: role || 'Caseworker' });
    state.save();
    document.getElementById('newStaffForm').reset();
    openStaffModal(); // re-render
    showToast(`Staff member @${name} added to directory.`, 'success');
  }
}

function removeStaffMember(index) {
  state.staffList.splice(index, 1);
  state.save();
  openStaffModal();
  showToast('Staff member removed.', 'info');
}

// ================= GLOBAL CONTROLLERS =================
function selectProfile(profileId) {
  state.selectedProfileId = profileId;
  renderProfiles();
  renderProfileDetail(profileId);
}

function closeProfileDetail() {
  state.selectedProfileId = null;
  hideProfileDetail();
  renderProfiles();
}

function switchTab(tab) {
  state.activeTab = tab;
  state.selectedProfileId = null;
  hideProfileDetail();
  renderApp();
}

function toggleAnonymizeMode() {
  state.anonymizeMode = !state.anonymizeMode;
  state.save();
  renderApp();
  showToast(state.anonymizeMode ? 'Anonymize Mode Active: Names masked' : 'Staff Admin View: Real names visible', 'info');
}

function clearFilters() {
  state.searchQuery = '';
  state.dateFrom = '';
  state.dateTo = '';
  state.categoryFilter = 'ALL';
  state.urgentFilter = 'ALL';

  const s = document.getElementById('globalSearch');
  if (s) s.value = '';
  const cf = document.getElementById('categoryFilterSelect');
  if (cf) cf.value = 'ALL';
  const uf = document.getElementById('urgentFilterSelect');
  if (uf) uf.value = 'ALL';
  const df = document.getElementById('dateFrom');
  if (df) df.value = '';
  const dt = document.getElementById('dateTo');
  if (dt) dt.value = '';

  renderProfiles();
}

function closeModals() {
  document.querySelectorAll('.modal-window').forEach(m => m.classList.add('hidden'));
}

function copySummaryToClipboard() {
  const content = document.getElementById('aiSummaryContent');
  if (!content) return;
  navigator.clipboard.writeText(content.innerText).then(() => {
    showToast('AI Executive Summary copied to clipboard.', 'success');
  });
}

function handleUnlock() {
  const pinInput = document.getElementById('pinInput');
  const errorEl = document.getElementById('pinError');
  if (pinInput && pinInput.value === state.currentPin) {
    state.isAuthenticated = true;
    document.getElementById('authGate').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    resetInactivityTimer();
    renderApp();
  } else {
    if (errorEl) errorEl.classList.remove('hidden');
    if (pinInput) {
      pinInput.classList.add('animate-shake');
      setTimeout(() => pinInput.classList.remove('animate-shake'), 400);
      pinInput.value = '';
    }
  }
}

function quickDemoUnlock() {
  const pinInput = document.getElementById('pinInput');
  if (pinInput) pinInput.value = state.currentPin;
  handleUnlock();
}

// ================= WEB SPEECH API & AI POINT-FORM FORMATTING =================
let speechRecognitionInstance = null;
let isDictating = false;

function toggleSpeechDictation() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast('Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or Safari.', 'error');
    return;
  }

  const btn = document.getElementById('dictateBtn');
  const btnText = document.getElementById('dictateBtnText');
  const wave = document.getElementById('dictateWave');
  const banner = document.getElementById('dictationStatusBanner');
  const preview = document.getElementById('dictationLivePreview');
  const notesTextarea = document.getElementById('nu_notes');

  if (isDictating && speechRecognitionInstance) {
    speechRecognitionInstance.stop();
    return;
  }

  try {
    speechRecognitionInstance = new SpeechRecognition();
    speechRecognitionInstance.continuous = true;
    speechRecognitionInstance.interimResults = true;
    speechRecognitionInstance.lang = 'en-US';

    speechRecognitionInstance.onstart = () => {
      isDictating = true;
      if (btn) btn.classList.add('mic-recording-pulse');
      if (btnText) btnText.textContent = 'Listening...';
      if (wave) {
        wave.classList.remove('hidden');
        wave.classList.add('flex');
      }
      if (banner) banner.classList.remove('hidden');
      if (preview) preview.textContent = 'Listening to microphone... speak clearly.';
      showToast('Microphone active. Dictate your observations.', 'info');
    };

    speechRecognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript && notesTextarea) {
        const current = notesTextarea.value.trim();
        notesTextarea.value = current ? `${current} ${finalTranscript.trim()}` : finalTranscript.trim();
      }

      if (preview) {
        preview.textContent = interimTranscript || 'Speech detected...';
      }
    };

    speechRecognitionInstance.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        showToast('Microphone permission denied. Please allow microphone access.', 'error');
      } else if (event.error !== 'no-speech') {
        showToast(`Dictation notice: ${event.error}`, 'error');
      }
      stopDictationUI();
    };

    speechRecognitionInstance.onend = () => {
      stopDictationUI();
    };

    speechRecognitionInstance.start();
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    showToast('Could not initialize microphone.', 'error');
    stopDictationUI();
  }
}

function stopDictationUI() {
  isDictating = false;
  speechRecognitionInstance = null;
  const btn = document.getElementById('dictateBtn');
  const btnText = document.getElementById('dictateBtnText');
  const wave = document.getElementById('dictateWave');
  const banner = document.getElementById('dictationStatusBanner');

  if (btn) btn.classList.remove('mic-recording-pulse');
  if (btnText) btnText.textContent = 'Voice Dictation';
  if (wave) {
    wave.classList.add('hidden');
    wave.classList.remove('flex');
  }
  if (banner) banner.classList.add('hidden');

  const notesTextarea = document.getElementById('nu_notes');
  if (notesTextarea && notesTextarea.value.trim().length > 10) {
    showToast('Dictation captured! Click "⚡ Format to Point Form (AI)" to organize.', 'info');
  }
}

async function formatDictationToPointForm() {
  const notesTextarea = document.getElementById('nu_notes');
  const profileSelect = document.getElementById('nu_profileId');
  const categorySelect = document.getElementById('nu_category');
  const formatBtn = document.getElementById('aiFormatBtn');
  const formatBtnText = document.getElementById('aiFormatBtnText');

  if (!notesTextarea || !notesTextarea.value.trim()) {
    showToast('Please dictate or type notes first before formatting.', 'error');
    return;
  }

  const rawNotes = notesTextarea.value.trim();
  const selectedProfileId = profileSelect ? profileSelect.value : '';
  const profile = state.profiles.find(p => p.id === selectedProfileId);
  const profileLabel = profile ? (state.anonymizeMode ? profile.pseudonym : profile.name) : '';
  const category = categorySelect ? categorySelect.value : 'General';

  // Set loading state
  if (formatBtn) formatBtn.disabled = true;
  if (formatBtnText) formatBtnText.textContent = 'Formatting with AI...';

  try {
    const formatted = await formatDictationIntoCaseNotes(rawNotes, category, profileLabel);
    if (formatted) {
      notesTextarea.value = formatted;
      showToast('Dictation transformed into structured point form!', 'success');
    }
  } catch (err) {
    console.error('Error formatting dictation with AI:', err);
    showToast('Error formatting notes. Preserving raw dictation.', 'error');
  } finally {
    if (formatBtn) formatBtn.disabled = false;
    if (formatBtnText) formatBtnText.textContent = '⚡ Format to Point Form (AI)';
  }
}

// ================= GEMINI CHATBOT ASSISTANT CONTROLLER =================
let chatHistory = [];
let isChatVoiceActive = false;
let chatSpeechInstance = null;

function toggleChatDrawer() {
  const drawer = document.getElementById('chatDrawer');
  if (!drawer) return;
  drawer.classList.toggle('hidden');
  if (!drawer.classList.contains('hidden')) {
    const input = document.getElementById('chatInput');
    if (input) input.focus();
  }
}

function clearChatHistory() {
  chatHistory = [];
  const container = document.getElementById('chatMessagesContainer');
  if (container) {
    container.innerHTML = `
      <div class="chat-bubble-model p-3.5 rounded-2xl rounded-tl-sm shadow-xs leading-relaxed">
        <div class="flex items-center space-x-1.5 mb-1 text-indigo-700 font-bold text-[11px]">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>CareTrack AI Assistant</span>
        </div>
        <p>Hello! I am your AI care coordination assistant. I can help analyze caseload trajectories, formulate caregiver support plans, triage urgent issues, or draft clinical handovers.</p>
        <p class="mt-1.5 text-slate-500 text-[10px]">How can I assist your casework today?</p>
      </div>
    `;
  }
  showToast('Chat conversation reset.', 'info');
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('chatInput');
  if (input) input.value = promptText;
  handleSendChatMessage();
}

async function handleSendChatMessage() {
  const input = document.getElementById('chatInput');
  const container = document.getElementById('chatMessagesContainer');
  const modelSelect = document.getElementById('chatModelSelect');
  const typingIndicator = document.getElementById('chatTypingIndicator');
  const sendBtn = document.getElementById('chatSendBtn');

  if (!input || !container) return;
  const message = input.value.trim();
  if (!message) return;

  const model = modelSelect ? modelSelect.value : 'gemini-3.5-flash';

  // Append user message bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble-user p-3.5 rounded-2xl rounded-tr-sm self-end max-w-[85%] ml-auto shadow-xs text-white';
  userBubble.innerHTML = `<p class="whitespace-pre-wrap">${escapeHtml(message)}</p>`;
  container.appendChild(userBubble);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Track conversation
  chatHistory.push({ role: 'user', content: message });

  // Prepare active context
  const activeClients = state.profiles.filter(p => p.type === 'client');
  const urgentCount = activeClients.filter(p => p.isUrgent).length;
  const recentUpdates = state.updates.slice(0, 10);
  const caseloadContext = {
    totalClients: activeClients.length,
    urgentCases: urgentCount,
    recentUpdateSummaries: recentUpdates.map(u => ({
      profileId: u.profileId,
      date: u.date,
      category: u.category,
      author: u.authorTag,
      notesExcerpt: u.notes ? u.notes.slice(0, 150) : '',
    })),
  };

  if (typingIndicator) typingIndicator.classList.remove('hidden');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const aiResponse = await sendChatMessage(message, model, caseloadContext, chatHistory);

    const modelBubble = document.createElement('div');
    modelBubble.className = 'chat-bubble-model p-3.5 rounded-2xl rounded-tl-sm shadow-xs leading-relaxed max-w-[92%] mr-auto';
    
    let formattedText = escapeHtml(aiResponse.text || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/• /g, '<br>• ')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    modelBubble.innerHTML = `
      <div class="flex items-center justify-between space-x-2 mb-1.5 pb-1 border-b border-slate-100">
        <span class="text-indigo-700 font-bold text-[10px] flex items-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          ${aiResponse.modelUsed || 'AI Caseworker'}
        </span>
        <span class="text-[9px] px-1.5 py-0.5 rounded font-mono ${aiResponse.mode === 'live-gemini' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
          ${aiResponse.mode === 'live-gemini' ? 'Live Gemini' : 'Offline'}
        </span>
      </div>
      <div class="text-slate-700 leading-relaxed text-xs">
        ${formattedText}
      </div>
    `;

    container.appendChild(modelBubble);
    chatHistory.push({ role: 'model', content: aiResponse.text });
  } catch (err) {
    const errorBubble = document.createElement('div');
    errorBubble.className = 'p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs';
    errorBubble.textContent = `Error: ${err.message || 'Could not retrieve response'}`;
    container.appendChild(errorBubble);
  } finally {
    if (typingIndicator) typingIndicator.classList.add('hidden');
    if (sendBtn) sendBtn.disabled = false;
    container.scrollTop = container.scrollHeight;
  }
}

function toggleChatVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Web Speech API is not supported in this browser.', 'error');
    return;
  }

  const btn = document.getElementById('chatVoiceBtn');
  const chatInput = document.getElementById('chatInput');

  if (isChatVoiceActive && chatSpeechInstance) {
    chatSpeechInstance.stop();
    return;
  }

  try {
    chatSpeechInstance = new SpeechRecognition();
    chatSpeechInstance.continuous = false;
    chatSpeechInstance.interimResults = false;
    chatSpeechInstance.lang = 'en-US';

    chatSpeechInstance.onstart = () => {
      isChatVoiceActive = true;
      if (btn) btn.classList.add('bg-rose-100', 'border-rose-400');
      showToast('Listening... speak your question clearly.', 'info');
    };

    chatSpeechInstance.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript && chatInput) {
        chatInput.value = chatInput.value ? `${chatInput.value} ${transcript}` : transcript;
      }
    };

    chatSpeechInstance.onerror = () => {
      if (btn) btn.classList.remove('bg-rose-100', 'border-rose-400');
      isChatVoiceActive = false;
    };

    chatSpeechInstance.onend = () => {
      if (btn) btn.classList.remove('bg-rose-100', 'border-rose-400');
      isChatVoiceActive = false;
    };

    chatSpeechInstance.start();
  } catch (e) {
    console.error('Chat voice error:', e);
    isChatVoiceActive = false;
  }
}

// ================= ENABLING GUIDE SINGAPORE DIRECTORY CONTROLLER =================
function openEnablingGuideModal(category = 'ALL') {
  const modal = document.getElementById('enablingGuideModal');
  const catSelect = document.getElementById('enablingCategorySelect');
  const searchInput = document.getElementById('enablingSearchInput');

  if (catSelect) catSelect.value = category;
  if (searchInput) searchInput.value = '';

  renderEnablingGuideDirectory();
  if (modal) modal.classList.remove('hidden');
}

function renderEnablingGuideDirectory() {
  const container = document.getElementById('enablingSchemesContainer');
  const catSelect = document.getElementById('enablingCategorySelect');
  const searchInput = document.getElementById('enablingSearchInput');
  if (!container) return;

  const category = catSelect ? catSelect.value : 'ALL';
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = ENABLING_GUIDE_SCHEMES.filter(scheme => {
    if (category !== 'ALL' && scheme.category !== category) return false;
    if (query) {
      const matchName = scheme.name.toLowerCase().includes(query);
      const matchAgency = scheme.agency.toLowerCase().includes(query);
      const matchSummary = scheme.summary.toLowerCase().includes(query);
      const matchNeeds = scheme.targetNeeds.some(n => n.toLowerCase().includes(query));
      return matchName || matchAgency || matchSummary || matchNeeds;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-400 text-xs">
        No Singapore schemes found matching "${escapeHtml(query)}". Try searching terms like "CHAS Blue", "HCG grant", "caregiver", "wheelchair", "diapers", or "day care".
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(scheme => {
    const isChas = scheme.url.includes('chas.sg');
    const isAic = scheme.url.includes('aic.sg');
    const isMindsFuture = scheme.url.includes('futureready.minds.org.sg');
    const isMindsStep = scheme.url.includes('whatisstep') || scheme.url.includes('minds.org.sg');
    const isMindsMyg = scheme.url.includes('whatismindsmyg') || scheme.url.includes('myg.org.sg');

    let domainLabel = 'enablingguide.sg';
    if (isMindsFuture) domainLabel = 'futureready.minds.org.sg';
    else if (isMindsStep) domainLabel = 'minds.org.sg (STEP)';
    else if (isMindsMyg) domainLabel = 'myg.org.sg';
    else if (isChas) domainLabel = 'chas.sg';
    else if (isAic) domainLabel = 'aic.sg';
    
    // Distinct visual badge style for category
    let badgeClass = 'bg-emerald-100 text-emerald-800';
    if (scheme.category.includes('Transition')) badgeClass = 'bg-amber-100 text-amber-900 border border-amber-200';
    else if (scheme.category.includes('Future Planning')) badgeClass = 'bg-purple-100 text-purple-900 border border-purple-200';
    else if (scheme.category.includes('Social Engagement')) badgeClass = 'bg-pink-100 text-pink-900 border border-pink-200';
    else if (isChas) badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
    else if (isAic) badgeClass = 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    else if (scheme.category.includes('Assistive')) badgeClass = 'bg-amber-100 text-amber-900 border border-amber-200';

    let linkColor = 'text-emerald-700 hover:text-emerald-900';
    if (isMindsFuture) linkColor = 'text-purple-700 hover:text-purple-900';
    else if (isMindsStep) linkColor = 'text-amber-700 hover:text-amber-900';
    else if (isMindsMyg) linkColor = 'text-pink-700 hover:text-pink-900';
    else if (isChas) linkColor = 'text-blue-700 hover:text-blue-900';
    else if (isAic) linkColor = 'text-indigo-700 hover:text-indigo-900';

    return `
    <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between space-y-2">
      <div>
        <div class="flex items-start justify-between gap-1 mb-1">
          <h4 class="font-bold text-xs text-slate-800 leading-tight">${escapeHtml(scheme.name)}</h4>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass} shrink-0">
            ${escapeHtml(scheme.category)}
          </span>
        </div>
        <p class="text-[10px] text-slate-400 mb-1.5 font-medium">${escapeHtml(scheme.agency)}</p>
        <p class="text-xs text-slate-600 leading-relaxed mb-2">${escapeHtml(scheme.summary)}</p>
        
        <div class="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] space-y-1 mb-1">
          <p class="text-slate-700"><strong>Key Benefit:</strong> ${escapeHtml(scheme.benefit)}</p>
          <p class="text-slate-500"><strong>Eligibility:</strong> ${escapeHtml(scheme.eligibility)}</p>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px]">
        <a 
          href="${scheme.url}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="font-bold ${linkColor} inline-flex items-center"
        >
          <span>${domainLabel}</span>
          <svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>

        <div class="flex items-center space-x-1.5">
          <button 
            type="button" 
            onclick="copySchemeDetails('${escapeHtml(scheme.name)}', '${escapeHtml(scheme.benefit)}', '${scheme.url}')" 
            class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-semibold transition"
            title="Copy details to clipboard for notes"
          >
            📋 Copy Info
          </button>
          <button 
            type="button" 
            onclick="askAiAboutScheme('${escapeHtml(scheme.name)}')" 
            class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold transition"
            title="Ask AI Caseworker about this scheme"
          >
            💬 Ask AI
          </button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function askAiAboutScheme(schemeName) {
  closeModals();
  toggleChatDrawer();
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = `Can you provide comprehensive guidance on "${schemeName}" in Singapore, including eligibility criteria, means-testing requirements, subsidies/benefits, and practical application steps for our client or caregiver?`;
  }
  handleSendChatMessage();
}

function copySchemeDetails(schemeName, benefit, url) {
  const text = `${schemeName}\nKey Benefit: ${benefit}\nOfficial Portal: ${url}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied ${schemeName} info to clipboard.`, 'success');
  });
}

// Window attachments for inline HTML event handlers
window.handleUnlock = handleUnlock;
window.quickDemoUnlock = quickDemoUnlock;
window.lockApplication = lockApplication;
window.switchTab = switchTab;
window.toggleAnonymizeMode = toggleAnonymizeMode;
window.selectProfile = selectProfile;
window.closeProfileDetail = closeProfileDetail;
window.triggerSummaryForProfile = triggerSummaryForProfile;
window.printProfileReport = printProfileReport;
window.openNewProfileModal = openNewProfileModal;
window.openEditProfileModal = openEditProfileModal;
window.deleteProfile = deleteProfile;
window.toggleProfileFields = toggleProfileFields;
window.saveNewProfile = saveNewProfile;
window.openNewUpdateModal = openNewUpdateModal;
window.openEditUpdateModal = openEditUpdateModal;
window.saveNewUpdate = saveNewUpdate;
window.deleteUpdate = deleteUpdate;
window.toggleProfileMiniLogs = toggleProfileMiniLogs;
window.toggleProfileUrgent = toggleProfileUrgent;
window.openSettingsModal = openSettingsModal;
window.saveSettings = saveSettings;
window.openStaffModal = openStaffModal;
window.addStaffMember = addStaffMember;
window.removeStaffMember = removeStaffMember;
window.exportCSV = exportCSV;
window.exportJSONBackup = exportJSONBackup;
window.importJSONBackup = importJSONBackup;
window.clearFilters = clearFilters;
window.closeModals = closeModals;
window.copySummaryToClipboard = copySummaryToClipboard;
window.toggleSpeechDictation = toggleSpeechDictation;
window.formatDictationToPointForm = formatDictationToPointForm;

// CSV Bulk Import window bindings (Requirement 6):
window.openCsvImportModal = openCsvImportModal;
window.commitCsvImport = commitCsvImport;
window.downloadCsvTemplate = downloadCsvTemplate;
window.handleCsvFileSelected = handleCsvFileSelected;
window.parsePastedCsv = parsePastedCsv;

// Chatbot Assistant window bindings:
window.toggleChatDrawer = toggleChatDrawer;
window.handleSendChatMessage = handleSendChatMessage;
window.toggleChatVoiceInput = toggleChatVoiceInput;
window.sendQuickPrompt = sendQuickPrompt;
window.clearChatHistory = clearChatHistory;

// Enabling Guide Singapore window bindings:
window.openEnablingGuideModal = openEnablingGuideModal;
window.renderEnablingGuideDirectory = renderEnablingGuideDirectory;
window.askAiAboutScheme = askAiAboutScheme;
window.copySchemeDetails = copySchemeDetails;

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  initInactivityListeners();
  setupMentionsAutocomplete();

  // Search input listeners
  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderProfiles();
    });
  }

  const catFilter = document.getElementById('categoryFilterSelect');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      renderProfiles();
    });
  }

  const urgentFilter = document.getElementById('urgentFilterSelect');
  if (urgentFilter) {
    urgentFilter.addEventListener('change', (e) => {
      state.urgentFilter = e.target.value;
      renderProfiles();
    });
  }

  const dateFrom = document.getElementById('dateFrom');
  if (dateFrom) {
    dateFrom.addEventListener('change', (e) => {
      state.dateFrom = e.target.value;
      renderProfiles();
    });
  }

  const dateTo = document.getElementById('dateTo');
  if (dateTo) {
    dateTo.addEventListener('change', (e) => {
      state.dateTo = e.target.value;
      renderProfiles();
    });
  }

  // Keypad number keys on PIN gate
  document.querySelectorAll('.pin-key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pinInput = document.getElementById('pinInput');
      const val = btn.getAttribute('data-val');
      if (pinInput && pinInput.value.length < 8) {
        pinInput.value += val;
      }
    });
  });

  const pinDel = document.getElementById('pinDelBtn');
  if (pinDel) {
    pinDel.addEventListener('click', () => {
      const pinInput = document.getElementById('pinInput');
      if (pinInput) pinInput.value = pinInput.value.slice(0, -1);
    });
  }
});
