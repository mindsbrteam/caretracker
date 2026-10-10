/**
 * CareTrack Secure - Gemini AI Service
 * Powered by Google Gemini 2.5 Flash (`gemini-2.5-flash`)
 * Integrated with Enabling Guide Singapore (https://www.enablingguide.sg/)
 */

import { ENABLING_GUIDE_SCHEMES, matchEnablingGuideSchemes } from './enablingGuideData.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Retrieve saved Gemini API Key from localStorage or environment
 */
export function getSavedGeminiKey() {
  return localStorage.getItem('caretrack_gemini_key') || '';
}

/**
 * Save Gemini API Key into localStorage
 */
export function saveGeminiKey(key) {
  const clean = key ? key.trim() : '';
  localStorage.setItem('caretrack_gemini_key', clean);
  return clean;
}

/**
 * Generates an executive AI summary of a profile's cumulative update history.
 * Calls `gemini-2.5-flash` via REST API if an API key is available,
 * or runs a local heuristic synthesis engine if no key is configured.
 *
 * @param {Object} profile - The client or volunteer profile object
 * @param {Array} updates - Chronological list of updates logged for this profile
 * @param {Boolean} isAnonymized - Whether names/identifiers are masked
 * @returns {Promise<Object>} Formatted summary result
 */
export async function generateProfileSummary(profile, updates, isAnonymized = false) {
  const apiKey = getSavedGeminiKey();

  if (!updates || updates.length === 0) {
    return {
      success: true,
      mode: 'offline',
      modelUsed: 'Local Rules Engine',
      milestones: ['Profile initialized in secure registry.'],
      currentStatus: profile.isUrgent ? 'Marked URGENT - Intake pending first update.' : 'Active record with zero logged updates.',
      nextSteps: ['Conduct initial intake assessment and record first welfare update.'],
      narrative: `No updates have been recorded yet for ${isAnonymized ? profile.pseudonym : profile.name}. Please document baseline needs.`,
      sentiment: 'Neutral / Initial',
      generatedAt: new Date().toLocaleString(),
    };
  }

  // If live Gemini API key is present, invoke gemini-2.5-flash
  if (apiKey) {
    try {
      return await callGeminiFlashLive(profile, updates, isAnonymized, apiKey);
    } catch (err) {
      console.warn('Gemini live call error, falling back to local synthesis engine:', err);
      // Fallback with warning message
      const localResult = generateLocalHeuristicSummary(profile, updates, isAnonymized);
      localResult.apiWarning = `Live Gemini call failed (${err.message || 'Check API Key or Network'}). Displaying local rule-based synthesis instead.`;
      return localResult;
    }
  }

  // Otherwise, use local heuristic summarizer
  return generateLocalHeuristicSummary(profile, updates, isAnonymized);
}

/**
 * Calls gemini-2.5-flash using the official REST API endpoint
 */
async function callGeminiFlashLive(profile, updates, isAnonymized, apiKey) {
  const url = `${GEMINI_ENDPOINT_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const profileLabel = isAnonymized ? profile.pseudonym : profile.name;
  const profileType = profile.type === 'volunteer' ? 'Volunteer' : 'Client / Family';

  // Format updates chronologically for context
  const updatesText = updates.map((u, i) => {
    return `[Update #${i + 1} | Date: ${u.date} | Category: ${u.category} | Logged By: ${u.authorTag || 'Staff'} ${u.authorEmail ? `(${u.authorEmail})` : ''}]
Notes: ${u.notes}
${u.mentions && u.mentions.length > 0 ? `Tagged Staff: ${u.mentions.join(', ')}` : ''}`;
  }).join('\n\n');

  const systemInstruction = `You are an expert social care coordinator and healthcare caseworker assistant analyzing cumulative case updates for a ${profileType}.
Your task is to analyze the complete chronological history of updates and provide a structured, professional, compassionate executive summary.
You are equipped with comprehensive domain knowledge of Singapore's social support, disability, healthcare financing, and transition ecosystem:
1. Enabling Guide Singapore (https://www.enablingguide.sg/ by SG Enable)
2. Community Health Assist Scheme - CHAS Cards (https://www.chas.sg/ by MOH):
   - CHAS Blue Card (PCHI ≤ $1,500 / AV ≤ $21,000): Highest subsidies. Up to $26/visit common illnesses, up to $160/visit ($540/yr cap) complex chronic (e.g. diabetes, hypertension), up to $256.50 for dental.
   - CHAS Orange Card (PCHI $1,501–$2,300): Up to $10/visit common illnesses, up to $125/visit ($400/yr cap) complex chronic.
   - CHAS Green Card (All Singapore Citizens regardless of income): Up to $100/visit ($320/yr cap) for 23 chronic conditions under CDMP.
   - Pioneer & Merdeka Generation: Enhanced subsidies at CHAS GP clinics, polyclinics, and specialist outpatient clinics, plus 25–50% off subsidized medications.
3. Agency for Integrated Care - AIC Caregiver Grants & Eldercare Support (https://www.aic.sg/):
   - AIC Home Caregiving Grant (HCG): $250 to $400 monthly cash grant for families caring for persons needing permanent help with ≥3 Activities of Daily Living (ADLs: washing, dressing, feeding, toileting, mobility, transferring). Means-tested (PCHI ≤ $1,500 = $400/mo; PCHI $1,501–$3,300 = $250/mo). Requires Functional Assessment Report (FAR) applied via AIC eFASS.
   - Caregiver Training Grant (CTG): $200 annual subsidy per care recipient for caregivers and domestic helpers (MDWs) to attend approved eldercare/disability skills training.
   - MDW / FDW Helper Levy Concession: Reduces domestic worker levy from $300 to $60/month (saves $240/mo) for caring for seniors aged 67+ or persons with disabilities.
   - Seniors' Mobility and Enabling Fund (SMF): Up to 90% subsidy for mobility devices (wheelchairs, beds) and up to 80% (capped at $2,400/yr) for healthcare consumables (adult diapers, milk feeds, dressings).
   - Assistive Technology Fund (ATF): Up to 90% subsidy (lifetime cap $40,000) for assistive devices.
4. MINDS (Movement for the Intellectually Disabled of Singapore) Programmes & Future Care Planning:
   - MINDS STEP (Supported Transition and Engagement Programme) (https://canva.link/whatisstep, PDF: https://www.minds.org.sg/wp-content/uploads/2026/04/Supported-Transition-and-Engagement-Programme.pdf): Transitional engagement and life skills for recent Special Education (SPED) school graduates awaiting adult disability services (Day Activity Centres, Sheltered Workshops, or open employment) to prevent post-18 skill regression and social isolation. Engages at least 2x/week with community navigation, socio-emotional coaching, outings, and caregiver sessions.
   - MINDS Future Care Planning (FutureReady Portal) (https://futureready.minds.org.sg): Empowering caregivers of persons with intellectual and developmental disabilities to establish lifetime care roadmaps covering legal safeguards (Will-making, Assisted Deputyship Application Programme ADAP), financial security (Special Needs Trust Company SNTC Letter of Intent, Special Needs Savings Scheme SNSS, CPF nominations), healthcare (Advance Care Planning ACP), and residential options (Adult Disability Homes).
   - MINDS MYG (MINDS Youth Group / Volunteer & Befriending Wing) (https://canva.link/whatismindsmyg): Weekly Saturday/Sunday educational, recreational, and social projects run by volunteers to equip PWIDs with essential life and social skills for community inclusion.

When evaluating clients or family support, you MUST recommend 1-3 appropriate Singapore schemes, CHAS card tiers, AIC caregiver grants, or MINDS programmes with specific rationale based on the client's clinical, developmental, and social needs.

Respond in valid JSON only, following this exact schema:
{
  "milestones": ["string: milestone 1", "string: milestone 2", ...],
  "currentStatus": "string: clear synthesis of current well-being, primary needs or volunteer output",
  "nextSteps": ["string: actionable recommendation 1", "string: actionable recommendation 2", ...],
  "narrative": "string: a concise, compassionate 2-4 sentence executive overview of trajectory and care coordination",
  "sentiment": "Improving" | "Stable" | "Needs Attention" | "Critical Urgent",
  "enablingGuideSchemes": [
    {
      "name": "string (Scheme/Card name, e.g. MINDS STEP (Supported Transition and Engagement Programme), MINDS Future Care Planning (FutureReady), CHAS Blue Card, AIC Home Caregiving Grant (HCG), Caregiver Training Grant (CTG), Assistive Technology Fund (ATF))",
      "category": "string (Transition & Youth | Future Planning & Legal | Healthcare & Medical Subsidies | Caregiver Support & Grants | Social Engagement & Befriending | Assistive Tech & Mobility | Adult Care | Transport)",
      "recommendationReason": "string (why this specific Singapore scheme/programme assists this client based on their updates)",
      "url": "string (official URL starting with https://canva.link/whatisstep, https://futureready.minds.org.sg, https://www.chas.sg/, https://www.aic.sg/, or https://www.enablingguide.sg/...)",
      "keyAction": "string (concrete next step for caseworker or caregiver to apply or explore)"
    }
  ]
}`;

  const prompt = `Profile Information:
- Type: ${profileType}
- Identifier: ${profileLabel}
- Priority: ${profile.isUrgent ? 'HIGH PRIORITY / URGENT FLAG ACTIVE' : 'Standard Routine'}
- General Category/Role: ${profile.category || profile.primaryRole || 'General'}
${profile.familyMembers ? `- Registered Family/Caregiver Contacts: ${profile.familyMembers.join(', ')}` : ''}

Cumulative History (${updates.length} Updates):
${updatesText}

Please synthesize this cumulative history into actionable insights for the team, including relevant Enabling Guide Singapore (https://www.enablingguide.sg/) schemes if applicable. Return ONLY valid JSON matching the specified schema.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 1024,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API HTTP ${response.status}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Empty response received from Gemini.');
  }

  let parsed;
  try {
    parsed = JSON.parse(textOutput);
  } catch (e) {
    // If markdown backticks were returned despite mime type
    const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  // Fallback to matched Enabling Guide schemes if model did not supply any
  const fallbackSchemes = matchEnablingGuideSchemes(profile, updates).map(s => ({
    name: s.name,
    category: s.category,
    recommendationReason: s.summary,
    url: s.url,
    keyAction: s.nextSteps
  }));

  const enablingSchemes = (Array.isArray(parsed.enablingGuideSchemes) && parsed.enablingGuideSchemes.length > 0)
    ? parsed.enablingGuideSchemes
    : fallbackSchemes;

  return {
    success: true,
    mode: 'live-gemini',
    modelUsed: GEMINI_MODEL,
    milestones: Array.isArray(parsed.milestones) ? parsed.milestones : ['History tracked consistently.'],
    currentStatus: parsed.currentStatus || 'Status evaluated by Gemini.',
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : ['Follow up with care team.'],
    narrative: parsed.narrative || 'Summary completed.',
    sentiment: parsed.sentiment || (profile.isUrgent ? 'Needs Attention' : 'Stable'),
    enablingGuideSchemes: enablingSchemes,
    generatedAt: new Date().toLocaleString(),
  };
}

/**
 * High-precision offline rule-based heuristic summarizer
 */
function generateLocalHeuristicSummary(profile, updates, isAnonymized) {
  const profileLabel = isAnonymized ? profile.pseudonym : profile.name;
  const isVolunteer = profile.type === 'volunteer';

  // Sort updates by date ascending
  const sorted = [...updates].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const oldest = sorted[0];

  // Category counts
  const categoryFreq = {};
  updates.forEach(u => {
    categoryFreq[u.category] = (categoryFreq[u.category] || 0) + 1;
  });
  const dominantCategory = Object.entries(categoryFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

  // Urgent checks
  const hasUrgentUpdates = updates.some(u => 
    u.notes.toLowerCase().includes('urgent') || 
    u.notes.toLowerCase().includes('emergency') || 
    u.notes.toLowerCase().includes('shut-off') ||
    u.notes.toLowerCase().includes('crisis')
  );

  let sentiment = 'Stable';
  if (profile.isUrgent || hasUrgentUpdates) {
    sentiment = 'Needs Attention';
  } else if (updates.some(u => u.notes.toLowerCase().includes('resolved') || u.notes.toLowerCase().includes('improved'))) {
    sentiment = 'Improving';
  }

  // Milestones extraction
  const milestones = [];
  milestones.push(`Cumulative ${updates.length} case updates logged across ${Object.keys(categoryFreq).join(', ')}.`);
  
  if (profile.familyMembers && profile.familyMembers.length > 0) {
    milestones.push(`Caregiver network engaged: ${profile.familyMembers.length} active family contacts documented.`);
  }

  // Look for positive milestone sentences
  sorted.forEach(u => {
    const textLower = u.notes.toLowerCase();
    if (textLower.includes('completed') || textLower.includes('approved') || textLower.includes('improved') || textLower.includes('installed')) {
      const firstSentence = u.notes.split('.')[0];
      if (firstSentence && milestones.length < 4) {
        milestones.push(`[${u.date}] ${firstSentence.trim()}.`);
      }
    }
  });

  // Recommended next steps
  const nextSteps = [];
  if (profile.isUrgent) {
    nextSteps.push(`Priority Action: Address urgent case flag with assigned caseworker today.`);
  }
  if (latest && latest.notes.includes('@')) {
    const tagged = latest.mentions ? latest.mentions.join(', ') : 'staff';
    nextSteps.push(`Verify response from tagged team member(s): ${tagged}.`);
  }
  if (isVolunteer) {
    nextSteps.push(`Confirm upcoming availability for ${dominantCategory} shifts.`);
    nextSteps.push(`Conduct quarterly volunteer feedback and recognition review.`);
  } else {
    nextSteps.push(`Schedule routine welfare check for primary need area: ${dominantCategory}.`);
    nextSteps.push(`Confirm caregiver support coordination with point of contact.`);
  }

  const narrative = isVolunteer
    ? `${profileLabel} has logged ${updates.length} service updates, primarily focusing on ${dominantCategory}. Overall contribution trajectory is ${sentiment.toUpperCase()}. Latest activity noted on ${latest?.date || 'recent'} reflects solid reliability. Recommended next focus: "${nextSteps[0]}".`
    : `${profileLabel} has a cumulative history of ${updates.length} case updates spanning from ${oldest?.date || 'intake'} to ${latest?.date || 'present'}. Primary focus is centered around ${dominantCategory}. Profile is currently classified as ${sentiment.toUpperCase()}. Immediate priority remains: "${nextSteps[0]}".`;

  const matchedEnablingSchemes = matchEnablingGuideSchemes(profile, updates).map(s => ({
    name: s.name,
    category: s.category,
    recommendationReason: s.summary,
    url: s.url,
    keyAction: s.nextSteps
  }));

  return {
    success: true,
    mode: 'offline',
    modelUsed: 'Heuristic Rule-Based Engine (Add Gemini API key in Settings for Live Gemini 2.5 Flash)',
    milestones: milestones.slice(0, 3),
    currentStatus: profile.isUrgent ? 'Action Required (Urgent Flag Active)' : `Active Case (${dominantCategory} Focus)`,
    nextSteps: nextSteps.slice(0, 3),
    narrative,
    sentiment,
    enablingGuideSchemes: matchedEnablingSchemes,
    generatedAt: new Date().toLocaleString(),
  };
}

/**
 * Transforms messy verbal dictation into professional point-form case notes.
 * Uses gemini-2.5-flash if API key is present, or a smart local structuring engine if offline.
 *
 * @param {string} rawTranscript - Spoken dictation from speech recognition
 * @param {string} category - Update category (e.g. Medical, Financial)
 * @param {string} profileContext - Client or volunteer identifier
 * @returns {Promise<string>} Structured point-form case notes
 */
export async function formatDictationIntoCaseNotes(rawTranscript, category = 'General', profileContext = '') {
  if (!rawTranscript || !rawTranscript.trim()) return '';

  const apiKey = getSavedGeminiKey();

  if (apiKey) {
    try {
      return await callGeminiDictationFormatter(rawTranscript, category, profileContext, apiKey);
    } catch (err) {
      console.warn('Gemini dictation formatting failed, using local structuring fallback:', err);
      return formatLocalDictation(rawTranscript, category);
    }
  }

  return formatLocalDictation(rawTranscript, category);
}

/**
 * Call gemini-2.5-flash to format dictation into professional clinical/social care bullet points
 */
async function callGeminiDictationFormatter(rawTranscript, category, profileContext, apiKey) {
  const url = `${GEMINI_ENDPOINT_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemInstruction = `You are an expert clinical documentation and social care caseworker assistant.
Your task is to convert raw, spoken speech dictation recorded during home visits into concise, well-structured, professional case notes in point form.

Rules:
1. Output ONLY the formatted bullet points (no conversational preamble, no "Here is your note:").
2. Group the notes into clear, capitalized bold bullet categories where applicable:
   - • **Status & Observations**: Key physical, emotional, or environmental findings.
   - • **Caregiver / Family Updates**: Any communications or updates involving family members.
   - • **Service & Interventions**: Actions performed during the visit.
   - • **Action Items & Follow-up**: Immediate next steps, errands, or pending tasks.
3. Preserve all names, dates, medication details, numbers, and any staff tags with '@' (e.g., '@Sarah').
4. Write in objective, professional, compassionate casework language. Correct grammar, remove verbal filler words (like "um", "uh", "you know"), but never hallucinate or alter clinical facts.`;

  const prompt = `Context: ${profileContext ? `Profile: ${profileContext}` : ''} | Category: ${category}
Raw Voice Dictation Transcript:
"${rawTranscript}"

Please rewrite this dictation into professional case notes in point form now.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 800,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP ${response.status}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Empty response from Gemini.');
  }

  return textOutput.trim();
}

/**
 * Intelligent local fallback to structure verbal sentences into bulleted point form
 */
function formatLocalDictation(rawTranscript, category) {
  // Clean fillers
  let cleaned = rawTranscript
    .replace(/\b(um|uh|you know|like|basically|sort of|kind of|i guess)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Split into sentences
  const sentences = cleaned
    .split(/(?<=[.?!])\s+|(?<=\band\b)\s+|(?<=\balso\b)\s+/i)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  if (sentences.length === 0) return `• ${cleaned}`;

  const bullets = [];
  const actions = [];
  const general = [];

  sentences.forEach(s => {
    // Capitalize first letter
    const formatted = s.charAt(0).toUpperCase() + s.slice(1);
    const withPeriod = formatted.endsWith('.') ? formatted : `${formatted}.`;

    if (withPeriod.toLowerCase().includes('need') || withPeriod.toLowerCase().includes('please') || withPeriod.toLowerCase().includes('follow up') || withPeriod.includes('@') || withPeriod.toLowerCase().includes('schedule')) {
      actions.push(withPeriod);
    } else {
      general.push(withPeriod);
    }
  });

  if (general.length > 0) {
    bullets.push(`• **Observations & Status**: ${general.join(' ')}`);
  }
  if (actions.length > 0) {
    bullets.push(`• **Action Items & Next Steps**: ${actions.join(' ')}`);
  }

  if (bullets.length === 0) {
    return sentences.map(s => `• ${s.charAt(0).toUpperCase() + s.slice(1)}.`).join('\n');
  }

  return bullets.join('\n\n');
}

/**
 * Multi-turn Chatbot service using Gemini
 * Supported models:
 * - gemini-3.5-flash (General casework & conversational tasks)
 * - gemini-3.1-pro-preview (Complex care planning & deep clinical reasoning)
 * - gemini-3.1-flash-lite (Fast triage & rapid Q&A)
 */
export async function sendChatMessage(arg1, arg2 = 'gemini-3.5-flash', arg3 = null, arg4 = []) {
  let message = '';
  let history = [];
  let model = 'gemini-3.5-flash';
  let caseloadContext = null;

  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && 'message' in arg1) {
    message = arg1.message;
    history = arg1.history || [];
    model = arg1.model || 'gemini-3.5-flash';
    caseloadContext = arg1.caseloadContext || null;
  } else {
    message = arg1 || '';
    model = arg2 || 'gemini-3.5-flash';
    caseloadContext = arg3 || null;
    history = arg4 || [];
  }

  const apiKey = getSavedGeminiKey();

  const systemInstruction = `You are the CareTrack Casework & Care Coordination AI Assistant.
Your primary role is to assist healthcare professionals, social workers, caseworkers, and volunteer coordinators with:
- Managing and triaging client & family caseloads.
- Designing compassionate, evidence-based care plans and interventions.
- Formulating empathetic communications for family caregivers.
- Assessing safety and vulnerability risk factors.
- Advising on community resources, official disability schemes, CHAS healthcare cards, and AIC caregiver grants.
- Recommending concrete next steps for casework handovers.

Singapore Official Social & Healthcare Financing Knowledge:
1. Community Health Assist Scheme (CHAS Cards) - https://www.chas.sg/ (MOH):
   - CHAS Blue Card: Subsidies for acute illnesses (up to $26/visit), Selected Chronic conditions under CDMP (up to $160/visit, $540/year cap for Complex; $110/visit, $360/year for Simple), and Dental services (selected procedures up to $170.50–$256.50). For households with PCHI ≤ $1,500 or AV ≤ $21,000.
   - CHAS Orange Card: Subsidies for acute illnesses (up to $10/visit) and Selected Chronic conditions (up to $125/visit, $400/year cap Complex; $75/visit, $250/year Simple). For PCHI $1,501–$2,300.
   - CHAS Green Card: Covers all Singapore Citizens regardless of income for 23 chronic conditions (diabetes, hypertension, asthma, depression, dementia, etc.) with up to $100/visit ($320/year cap Complex) and up to $50/visit ($160/year Simple).
   - Pioneer & Merdeka Generation Cards: Enhanced subsidies at CHAS GP clinics, polyclinics, and specialist outpatient clinics (SOCs), plus 25%–50% off subsidized medications.

2. Agency for Integrated Care (AIC) Caregiver Grants & Subsidies - https://www.aic.sg/:
   - AIC Home Caregiving Grant (HCG): Monthly cash payout ($250 or $400/month) to help families care for loved ones with moderate to severe disabilities in the community. Requires certified assistance with ≥3 out of 6 Activities of Daily Living (ADLs: washing, dressing, feeding, toileting, walking, transferring). Means-tested: PCHI ≤ $1,500 = $400/mo; PCHI $1,501–$3,300 = $250/mo. Requires Functional Assessment Report (FAR) submitted via AIC eFASS.
   - Caregiver Training Grant (CTG): $200 annual subsidy per care recipient for caregivers and domestic helpers (MDWs) to attend certified eldercare or disability skills courses.
   - MDW / FDW Helper Levy Concession: Reduces monthly helper levy from $300 to $60/month (saves $240/mo or $2,880/year) when caring for an elderly family member (67+) or person with disability.
   - Seniors' Mobility and Enabling Fund (SMF): Subsidies for seniors aged 60+ for mobility assistive devices (up to 90%) and care consumables like adult diapers, milk feeds, dressings (up to 80%, capped at $2,400/year).
   - Interim Disability Assistance Programme for the Elderly (IDAPE): $150–$250/month cash payout for seniors unable to do ≥3 ADLs not eligible for ElderShield.

3. Enabling Guide Singapore (SG Enable) - https://www.enablingguide.sg/:
   - Assistive Technology Fund (ATF): Up to 90% subsidy (capped at $40,000 lifetime) for mobility, sensory, and communication equipment.
   - Enabling Transport Subsidy (ETS): Up to 80% subsidy for dedicated transport to Day Activity Centres (DAC) and SPED schools.
   - Public Transport Concession Scheme: 25% discount on bus/MRT fares for persons with disabilities.
   - Day Activity Centres (DAC) & Home-Based Care Services (HBCS).
   - Respite Care: Short-term residential accommodation to prevent caregiver burnout.
   - Future Planning: Special Needs Trust Company (SNTC) and Special Needs Savings Scheme (SNSS).

4. MINDS (Movement for the Intellectually Disabled of Singapore) Programmes & Future Care Planning:
   - MINDS STEP (Supported Transition and Engagement Programme) - https://canva.link/whatisstep (PDF: https://www.minds.org.sg/wp-content/uploads/2026/04/Supported-Transition-and-Engagement-Programme.pdf):
     • Targeted at recent Special Education (SPED) school graduates (graduated within last 5 years, age 18+) awaiting placement in adult disability services (DAC, Sheltered Workshops, or open employment).
     • Bridging the post-18 cliff effect with at least twice-weekly engagement (independent living workshops, community navigation, social outings, emotional regulation, caregiver support sessions).
   - MINDS Future Care Planning (FutureReady Portal) - https://futureready.minds.org.sg:
     • Dedicated platform empowering caregivers of persons with intellectual and developmental disabilities to plan lifetime care across legal, financial, healthcare, and residential domains.
     • Covers Will-making, Assisted Deputyship Application Programme (ADAP), CPF nominations, SNTC Trust Letter of Intent, Special Needs Savings Scheme (SNSS), Advance Care Planning (ACP), health screenings, residential care roadmaps, and life coaching.
   - MINDS MYG (MINDS Youth Group / Volunteer & Befriending Wing) - https://canva.link/whatismindsmyg (https://myg.org.sg/):
     • Voluntary wing organizing weekly Saturday/Sunday recreational, educational, and social activities to equip PWIDs with essential life and social skills for community inclusion and employment readiness.

Guidelines:
- Maintain an empathetic, professional, objective, and privacy-conscious tone.
- When given context about clients or urgent cases, reference them respectfully.
- Use clear bullet points and bold headings when structuring recommendations.
- Provide direct URLs and actionable next steps for caseworkers.
${caseloadContext ? `\nActive CareTrack Caseload Snapshot:\n${typeof caseloadContext === 'string' ? caseloadContext : JSON.stringify(caseloadContext)}` : ''}`;

  if (apiKey) {
    try {
      const url = `${GEMINI_ENDPOINT_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      // Build contents array with conversation history
      const contents = history.map(turn => ({
        role: turn.role === 'assistant' ? 'model' : turn.role,
        parts: [{ text: turn.text || turn.content || '' }],
      }));

      // Append current message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const requestBody = {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API HTTP ${response.status}`);
      }

      const data = await response.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error('Empty response received from Gemini.');
      }

      return {
        text: textOutput.trim(),
        modelUsed: model,
        mode: 'live-gemini',
      };
    } catch (err) {
      console.warn('Gemini chat error, using local casework fallback:', err);
      return generateLocalChatFallback(message, model, caseloadContext, err.message);
    }
  }

  // Offline / Local fallback response
  return generateLocalChatFallback(message, model, caseloadContext);
}

/**
 * High-quality local casework assistant response when offline or before API key is provided
 */
function generateLocalChatFallback(message, model, caseloadContext, errorMsg = '') {
  const q = message.toLowerCase();
  let responseText = '';

  // Dedicated match for CHAS card queries
  if (q.includes('chas') || q.includes('card') || q.includes('blue card') || q.includes('orange card') || q.includes('green card') || q.includes('pioneer') || q.includes('merdeka') || q.includes('clinic subsidy') || q.includes('gp subsidy') || q.includes('dental subsidy')) {
    responseText = `**💳 Singapore Community Health Assist Scheme (CHAS) Subsidies Guide:**

CHAS enables Singapore Citizens to receive medical and dental subsidies at participating private General Practitioner (GP) and dental clinics.

1. **CHAS Blue Card (Highest Subsidies)**
   • **Eligibility:** Monthly Per-Capita Household Income (PCHI) ≤ $1,500, or home Annual Value (AV) ≤ $21,000 for households with no income.
   • **Subsidies:**
     - **Common Illnesses (Cough, Cold, Flu):** Up to **$26.00** subsidy per visit.
     - **Complex Chronic Conditions (CDMP):** Up to **$160.00** per visit (capped at **$540.00/year**).
     - **Simple Chronic Conditions:** Up to **$110.00** per visit (capped at **$360.00/year**).
     - **Dental Services:** Selected procedures (scaling, polishing, extractions, root canals) subsidized up to **$170.50 – $256.50**.
   • **Application:** Apply online via [www.chas.sg](https://www.chas.sg/) using Singpass.

2. **CHAS Orange Card (Mid Tier)**
   • **Eligibility:** PCHI between $1,501 and $2,300, or AV $21,001 – $25,000.
   • **Subsidies:**
     - **Common Illnesses:** Up to **$10.00** per visit.
     - **Complex Chronic:** Up to **$125.00** per visit (capped at **$400.00/year**).
     - **Simple Chronic:** Up to **$75.00** per visit (capped at **$250.00/year**).

3. **CHAS Green Card (All Citizens Regardless of Income)**
   • **Eligibility:** All Singapore Citizens with PCHI > $2,300 or AV > $25,000. No income ceiling!
   • **Subsidies:** Up to **$100.00** per visit ($320.00/yr cap) for complex chronic conditions; up to **$50.00** per visit ($160.00/yr cap) for simple chronic conditions (e.g. diabetes, hypertension, asthma, depression).

4. **Pioneer Generation (PG) & Merdeka Generation (MG)**
   • Special cards granting higher subsidies (Pioneers: up to $30.50 acute / $175 complex chronic + 50% off subsidized drugs at polyclinics & public SOCs; Merdeka: up to $23.50 acute / $145 complex chronic + 25% off subsidized drugs).

• **Casework Action Tip:** Verify client's CHAS status at [chas.sg](https://www.chas.sg/). If family income drops or a member loses employment, assist them to re-apply for a higher-tier card (e.g. Orange to Blue).`;
  } else if (q.includes('aic') || q.includes('caregiver grant') || q.includes('home caregiving grant') || q.includes('hcg') || q.includes('maid levy') || q.includes('helper levy') || q.includes('fdw levy') || q.includes('mdw levy') || q.includes('smf') || q.includes('seniors mobility')) {
    responseText = `**🤝 Agency for Integrated Care (AIC) Caregiver Grants & Financial Assistance:**

AIC administers key financial assistance schemes to ease caregiving burdens for families in Singapore:

1. **AIC Home Caregiving Grant (HCG) — Monthly Cash Assistance**
   • **What it is:** Monthly cash payout disbursed directly to the caregiver/recipient to defray home care, diapers, food, or helper expenses.
   • **Payout Amount:**
     - **$400 / month:** Per-capita household income (PCHI) ≤ $1,500, or Annual Value ≤ $21,000.
     - **$250 / month:** PCHI between $1,501 and $3,300.
   • **Eligibility:** Singapore Citizen care recipient living in the community who requires permanent assistance with **at least 3 out of 6 Activities of Daily Living (ADLs)**: washing, dressing, feeding, toileting, walking/moving, transferring.
   • **How to Apply:** Have an accredited doctor or community nurse complete a **Functional Assessment Report (FAR)**, then submit via [AIC eFASS (efass.aic.sg)](https://www.aic.sg/financial-assistance/home-caregiving-grant-hcg/).

2. **Caregiver Training Grant (CTG)**
   • **Benefit:** **$200 annual subsidy** per care recipient to offset training fees for approved eldercare and disability courses for family members or Migrant Domestic Workers (helpers).
   • **Topics:** Safe transfer techniques, dementia behavioral management, tube feeding, and stroke recovery care.
   • **Official Link:** [AIC CTG Info](https://www.aic.sg/financial-assistance/caregiver-training-grant-ctg/)

3. **MDW / FDW Levy Concession for Caregivers**
   • **Benefit:** Lowers the monthly foreign domestic worker levy from **$300 down to $60/month** (immediate cash savings of **$240/month** or **$2,880/year**).
   • **Eligibility:** Employer living with a Singapore Citizen care recipient aged 67+, or a person certified with a permanent disability (needing help with ≥1 ADL).
   • **Official Link:** [AIC FDW Concession](https://www.aic.sg/financial-assistance/foreign-domestic-worker-levy-concession/)

4. **Seniors' Mobility and Enabling Fund (SMF)**
   • **Benefit:** Up to 90% subsidy for assistive devices (wheelchairs, motorized beds) and up to 80% subsidy (up to $2,400/year) for consumables like adult diapers, milk feeds, and wound dressings for seniors aged 60+.
   • **Official Link:** [AIC SMF Info](https://www.aic.sg/financial-assistance/seniors-mobility-and-enabling-fund-smf/)`;
  } else if (q.includes('step') || q.includes('whatisstep') || q.includes('transition') || q.includes('post-18') || q.includes('post 18') || (q.includes('sped') && (q.includes('graduate') || q.includes('school leaver') || q.includes('waitlist')))) {
    responseText = `**🎓 MINDS STEP (Supported Transition and Engagement Programme):**

MINDS STEP is a dedicated transitional support initiative designed to bridge the **"post-18 cliff"** for recent Special Education (SPED) school graduates awaiting placement in government-funded adult disability services (such as Day Activity Centres, Sheltered Workshops, or open employment).

• **Objective:** Prevent skill regression, maintain social connectedness, and reduce caregiver burnout during the gap between graduating from SPED and enrolling into adult disability services.
• **Programme Format:**
  - **Engagement Frequency:** At least twice a week.
  - **Venue:** Typically hosted across SPED school campuses or community hubs (e.g. MINDS Kembangan-Chai Chee Community Hub).
  - **Core Modules:**
    1. **Independent Living Skills:** Public transport navigation, money handling, personal hygiene, and meal preparation.
    2. **Socio-Emotional & Behavioural Regulation:** Peer communication, managing emotions, and stress relief.
    3. **Social & Community Outings:** Supervised outings to public amenities, parks, and retail centres.
    4. **Caregiver Support & Workshops:** Peer networking and coaching for parents/caregivers.
• **Eligibility:**
  - Singapore Citizens or Permanent Residents.
  - Graduated from a SPED school within the last 5 years (typically aged 18–25).
  - Awaiting placement and **not** currently enrolled in any other government-funded adult disability services.
  - Diagnosis of intellectual disability, autism, physical, or sensory disabilities.
  - Free from infectious diseases or serious psychotic/behavioural challenges requiring 1-to-1 nursing care.
  - Parental or guardian consent provided.
• **Official Resources:**
  - [Canva STEP Guide (whatisstep)](https://canva.link/whatisstep)
  - [MINDS STEP Official PDF Document](https://www.minds.org.sg/wp-content/uploads/2026/04/Supported-Transition-and-Engagement-Programme.pdf)
  - [SG Enable / Enabling Guide Transition Touchpoints](https://www.enablingguide.sg/)

• **Casework Recommendation:** If a youth client has graduated from SPED and is waiting on a DAC or Sheltered Workshop waitlist, refer them immediately to MINDS STEP to keep them active and engaged.`;
  } else if (q.includes('futureready') || q.includes('future ready') || q.includes('future care') || q.includes('deputy') || q.includes('adap') || (q.includes('minds') && q.includes('planning')) || q.includes('caregiver succession') || q.includes('aging parent')) {
    responseText = `**📑 MINDS Future Care Planning & FutureReady Portal:**

The **MINDS FutureReady** initiative ([futureready.minds.org.sg](https://futureready.minds.org.sg)) is a specialized platform empowering caregivers of persons with intellectual and developmental disabilities to formulate comprehensive lifetime care roadmaps.

1. **Assisted Deputyship Application Programme (ADAP):**
   • Enables parents to apply to the Family Justice Courts to be appointed as legal Deputies for children turning 21 who lack mental capacity to make key decisions.
   • Heavily subsidised application process with guided legal clinics.

2. **Testamentary & Will-Making:**
   • Formulating a legal Will specifying trusted testamentary guardians and executors.
   • Linking estate distribution with special needs trusts rather than direct cash bequests.

3. **Financial Security (SNTC Trust & CPF SNSS):**
   • **Special Needs Trust Company (SNTC):** Setting up a subsidized Trust with a personalized Letter of Intent (LOI) dictating child's monthly disbursement roadmap.
   • **Special Needs Savings Scheme (SNSS):** CPF nominations to disburse monthly payouts from parents' CPF accounts upon demise.

4. **Healthcare & Advance Care Planning (ACP):**
   • Documenting medical history, care nuances, sensory triggers, and preferences.
   • Ensuring seamless handovers with general hospitals, polyclinics, and community doctors.

5. **Residential Options & Care Succession:**
   • Assessing long-term residential options: Adult Disability Homes (ADH), community group homes, or home-based assisted living.
   • Appointing secondary caregivers and successor decision-makers.

• **Official Portal:** Register and build your roadmap at **[https://futureready.minds.org.sg](https://futureready.minds.org.sg)**.`;
  } else if (q.includes('myg') || q.includes('whatismindsmyg') || q.includes('minds myg') || (q.includes('minds') && (q.includes('youth') || q.includes('volunteer') || q.includes('befriend')))) {
    responseText = `**🤝 MINDS MYG (MINDS Youth Group / Volunteer & Befriending Wing):**

**MINDS MYG** ([canva.link/whatismindsmyg](https://canva.link/whatismindsmyg) / [myg.org.sg](https://myg.org.sg/)) is the subsidiary voluntary wing of the Movement for the Intellectually Disabled of Singapore (MINDS).

• **Mission:** Run by dedicated volunteers to enrich the lives of Persons with Intellectual Disability (PWIDs), building essential life and social skills to foster community integration and support open employment pathways.
• **Core Projects & Activities:**
  - **Weekend Befriending Clubs:** Saturday and Sunday clubs offering arts & crafts, singing, sports, cooking, and board games.
  - **Community Outings:** Supervised social outings to cafes, museums, shopping centres, and public events to build confidence in public spaces.
  - **Children's Wing (CW) Project:** Social, recreational, and educational engagement for children aged 6 to 18 at MINDSville@Napiri.
  - **Independent Living Skills:** Functional literacy, counting money, taking public buses/MRT, and dining out etiquette.
  - **Caregiver Respite:** Weekend sessions provide family caregivers with much-needed personal rest time.
• **How to Join:**
  - **Beneficiaries / Trainees:** Persons with intellectual disabilities of all age groups can register for weekend projects.
  - **Volunteers:** Welcomes regular befrienders, event facilitators, and committee members.
• **Official Resource:** [Canva MINDS MYG Guide](https://canva.link/whatismindsmyg) & [MINDS MYG Website](https://myg.org.sg/).`;
  } else if (q.includes('enabling') || q.includes('guide') || q.includes('singapore') || q.includes('sg enable') || q.includes('scheme') || q.includes('subsidy') || q.includes('grant') || q.includes('atf') || q.includes('ctg') || q.includes('dac')) {
    responseText = `**🇸🇬 Enabling Guide Singapore (SG Enable) Scheme Recommendations:**

Based on official resources from **[Enabling Guide](https://www.enablingguide.sg/)**, here are key schemes matched for disability care and caregiver support in Singapore:

1. **Assistive Technology Fund (ATF)**
   • **Benefit:** Subsidises up to 90% (capped at $40,000 lifetime) for assistive equipment (motorized wheelchairs, hearing aids, communication aids).
   • **Action:** Obtain a clinical assessment from a therapist/hospital and submit via SG Enable.
   • **Official Guide:** [Enabling Guide ATF](https://www.enablingguide.sg/schemes-subsidies/assistive-technology-fund)

2. **Caregiver Training Grant (CTG)**
   • **Benefit:** $200 annual subsidy per care recipient for caregivers/helpers to attend certified eldercare or disability skills courses.
   • **Action:** Browse approved course list on Enabling Guide / AIC and enroll.
   • **Official Guide:** [Enabling Guide CTG](https://www.enablingguide.sg/schemes-subsidies/caregiver-training-grant)

3. **Enabling Transport Subsidy (ETS)**
   • **Benefit:** Up to 80% subsidy for dedicated van/transport fees to Day Activity Centres (DAC) and SPED schools.
   • **Action:** Apply through the enrolled Day Activity Centre administrative social worker.
   • **Official Guide:** [Enabling Guide ETS](https://www.enablingguide.sg/schemes-subsidies/enabling-transport-subsidy)

4. **Day Activity Centres (DAC) & Home-Based Care Services (HBCS)**
   • **Benefit:** Community living skills and daytime care (ages 18–55) to grant respite for working caregivers.
   • **Action:** Submit referral via Medical Social Worker (MSW) or SG Enable touchpoints.
   • **Official Guide:** [Enabling Guide Adult Care](https://www.enablingguide.sg/adult-care/day-activity-centres)

5. **Future Planning: Special Needs Trust Company (SNTC) & Special Needs Savings Scheme (SNSS)**
   • **Benefit:** Safeguards financial security and regular monthly payouts for persons with special needs after parents pass on.
   • **Official Guide:** [Enabling Guide Future Planning](https://www.enablingguide.sg/future-planning/special-needs-trust-company-sntc)

*(For live deep multi-turn analysis powered by ${model}, configure your Gemini API key in API Config).*`;
  } else if (q.includes('urgent') || q.includes('priority') || q.includes('triage') || q.includes('risk')) {
    responseText = `**Urgent Caseload Triage Recommendations:**

• **Immediate Protocol:** Verify that all active urgent cases have had a caseworker contact within the last 24–48 hours.
• **Environmental Safety:** Review utility shut-off alerts, medical transport deadlines, or post-operative mobility restrictions.
• **Caregiver Burnout Check:** Contact the primary family caregiver to gauge stress levels and offer temporary respite care vouchers or volunteer companionship.
• **Team Coordination:** Ensure primary caseworkers are tagged with \`@staff\` on the latest case notes to trigger automated notifications.
• **Enabling Guide Escalation:** For urgent caregiver crisis or physical decline, explore [SG Enable Respite Care](https://www.enablingguide.sg/schemes-subsidies/respite-care) and Home-Based Care Services.

*(Note: Live ${model} model response available once you add your Gemini API key in API Config).*`;
  } else if (q.includes('caregiver') || q.includes('family') || q.includes('burnout')) {
    responseText = `**Family Caregiver Support & Wellness Strategy:**

• **Identify Primary Point of Contact:** Validate who handles daily medication management and mobility assistance.
• **Respite Interventions:** Connect the family with [Caregiver Training Grant (CTG)](https://www.enablingguide.sg/schemes-subsidies/caregiver-training-grant) ($200/year) or schedule trained volunteer home visits (2–4 hours weekly) to grant the primary caregiver dedicated rest.
• **Short-Term Respite Care:** For acute burnout, apply for temporary respite stay via [Enabling Guide Respite Care](https://www.enablingguide.sg/schemes-subsidies/respite-care).
• **Documentation:** Log family emotional wellness in the CareTrack "Emotional & Social" category so trend trajectory is captured by the AI summarizer.`;
  } else if (q.includes('checklist') || q.includes('home visit') || q.includes('visit') || q.includes('intake')) {
    responseText = `**Standard Casework Home Visit Checklist:**

1. **Physical Well-being & Mobility:** Observe posture, transfer capability (chair to bed/standing), and check for fall hazards (loose rugs, bathroom grab bars).
2. **Assistive Equipment Review:** Check if wheelchair, walker, or commode require maintenance or upgrades via the [Assistive Technology Fund (ATF)](https://www.enablingguide.sg/schemes-subsidies/assistive-technology-fund).
3. **Nutritional & Pantry Audit:** Inspect refrigerator and pantry for adequate balanced food and medication supplies.
4. **Medication Adherence:** Check medication organizers and verify refill schedules.
5. **Caregiver Inquiries:** Listen to family caregiver concerns, assess burnout, and recommend caregiver courses under the [Caregiver Training Grant](https://www.enablingguide.sg/schemes-subsidies/caregiver-training-grant).`;
  } else {
    responseText = `**Casework Coordination Guidance:**

Thank you for your inquiry regarding: *" ${message} "*

• **Holistic Assessment:** Ensure observations encompass clinical, financial, housing, and social-emotional domains.
• **Enabling Guide Singapore Support:** Refer clients to official subsidies like the Assistive Technology Fund (ATF), Caregiver Training Grant (CTG), or Public Transport Concession via [Enabling Guide (www.enablingguide.sg)](https://www.enablingguide.sg/).
• **Interdisciplinary Communication:** Use \`@mention\` tags in your case updates to alert specific specialists (e.g. Lead Social Worker or Clinical Liaison).
• **Documentation Best Practices:** Dictate notes during or immediately following home visits, then use the **⚡ Format to Point Form (AI)** button to generate structured clinical bullet points.

*Tip: For live conversational analysis powered by **${model}**, verify your Gemini API key is configured in the API Config panel.*`;
  }

  if (errorMsg) {
    responseText += `\n\n*(Notice: Live Gemini call returned "${errorMsg}". Provided local rule-based response).*`;
  }

  return {
    text: responseText,
    modelUsed: `${model} (Local Fallback)`,
    mode: 'offline',
  };
}


