# CareTrack Secure — Client, Family & Volunteer Update Tracker

A secure, privacy-first web application designed for social care, healthcare, and community support organizations to track, coordinate, and summarize cumulative updates for clients, their families, and volunteers with Google Gemini 2.5 Flash AI synthesis.

---

## 🌟 Key Features

### 1. Modern, Compassionate UI/UX
- **Design System:** Soft slate, indigo, and emerald palette tailored for healthcare and social services.
- **Two Distinct Hubs:**
  - **Client & Family Profiles Component:** Track medical, financial, legal, and welfare updates alongside family caregiver networks.
  - **Volunteer Profiles Component:** Track service hours, companionship visits, meal runs, and availability.
- **Profile-Centric Cumulative Grouping:** All updates are chronologically linked to specific profiles so AI models can review full case history.
- **Urgent / High Priority Flags:** Prominent visual badges and filter states to highlight critical cases needing immediate intervention.

### 2. Security, Privacy & Compliance Safeguards
- **Password Protection Gate:** PIN entry required before granting access to sensitive records (Default demo PIN: `1234`).
- **15-Minute Inactivity Auto-Lock:** Automatically locks the interface and returns to the PIN screen if the user is inactive for 15 minutes.
- **Identity Masking / Pseudonymization ("Anonymize Mode"):** One-click toggle that masks real names with deterministic pseudonyms (e.g. `Client #C-102`, `Volunteer #V-405`) and pseudonyms for family members (`Family Member [FM-1]`) for confidential presentations or shared screens.

### 3. Full Log & Profile Editing Lifecycle
- **Edit & Delete Previously Filled Logs:** Staff can click **Edit Log** directly on any profile card or timeline entry to modify dates, categories, staff tags, or text notes (with full access to speech dictation and AI formatting on edits), or click **Delete Log** to permanently remove inaccurate entries.
- **Collapsible Log History on Profile Cards:** Profile cards feature a direct toggle to inspect, edit, or delete any earlier update notes without needing to open the full drawer.
- **Edit & Delete Profiles:** Update profile categories, caregiver details, availability, and urgency flags anytime, or delete entire profiles along with their history.

### 4. Bulk CSV Onboarding (Rapid Agency Database Import)
- **Bulk Upload Client Profiles:** Rapidly import existing agency registries, spreadsheets, EHR exports, or intake tables.
- **Drag-and-Drop or Paste:** Upload `.csv` files via drag-and-drop or paste raw CSV text directly into the modal.
- **Expected Columns:** `Name, Category, FamilyMembers, Urgent, Notes` (with smart header detection supporting common variations).
- **Preview & Validation:** Live preview table displays parsed records, urgency tags, detected caregivers, and initial case notes before committing.
- **Sample Template Download:** Download a pre-formatted sample CSV file (`caretrack_client_import_template.csv`) directly from the import window.
- **Duplicate Handling:** Choose between skipping existing client names or auto-generating unique pseudonyms.

### 5. Live Google Gemini AI Summaries & Singapore Schemes Integration
- **Model:** Powered by Google's `gemini-2.5-flash` (and compatible with `gemini-3.5-flash` / `gemini-3.1-pro-preview`).
- **Cumulative Synthesis:** Analyzes the complete historical trajectory of all notes, priorities, author tags, and dates.
- **Singapore Care Schemes Integration (Enabling Guide, CHAS, AIC & MINDS):** The AI automatically evaluates client needs against official Singapore schemes, grants, and programmes:
  - **MINDS Programmes & Transition Services:**
    - **MINDS STEP (Supported Transition and Engagement Programme - https://canva.link/whatisstep):** Transitional support for recent Special Education (SPED) school graduates (within 5 years of graduation, age 18+) awaiting adult disability services (Day Activity Centres, Sheltered Workshops, or open employment) to bridge the post-18 cliff. At least 2x/week engagement focusing on independent living, socio-emotional coaching, community outings, and caregiver sessions.
    - **MINDS Future Care Planning (FutureReady Portal - https://futureready.minds.org.sg):** Specialized platform empowering caregivers of persons with intellectual and developmental disabilities to establish lifetime care roadmaps covering Will-making, Assisted Deputyship Application Programme (ADAP), Special Needs Trust Company (SNTC) Letter of Intent, CPF Special Needs Savings Scheme (SNSS), Advance Care Planning (ACP), residential options, and life coaching.
    - **MINDS MYG (MINDS Youth Group / Volunteer & Befriending Wing - https://canva.link/whatismindsmyg):** Voluntary wing organizing weekly weekend social, recreational, and educational projects to build life skills, independence, and employment readiness for PWIDs.
  - **Enabling Guide Singapore (SG Enable - https://www.enablingguide.sg/):** Assistive Technology Fund (ATF up to $40k), Enabling Transport Subsidy (ETS up to 80%), Day Activity Centres (DAC), Home-Based Care Services (HBCS), Respite Care, and Special Needs Trust Company (SNTC).
  - **Community Health Assist Scheme (CHAS Cards - https://www.chas.sg/):**
    - **CHAS Blue Card:** Subsidies for common illnesses (up to $26/visit), complex chronic conditions under CDMP (up to $160/visit, $540/yr cap), and dental procedures (up to $256.50). For PCHI ≤ $1,500.
    - **CHAS Orange Card:** Subsidies for acute illnesses (up to $10/visit) and complex chronic conditions (up to $125/visit, $400/yr cap) for PCHI $1,501–$2,300.
    - **CHAS Green Card:** Subsidies for all Singapore Citizens regardless of income for 23 chronic conditions (diabetes, hypertension, asthma, depression, dementia) up to $100/visit ($320/yr cap).
    - **Pioneer & Merdeka Generation:** Enhanced subsidies at CHAS GP clinics, polyclinics, public SOCs, and 25–50% off subsidized medications.
  - **Agency for Integrated Care Grants (AIC - https://www.aic.sg/):**
    - **Home Caregiving Grant (HCG):** Monthly cash assistance ($250 to $400/month) for care recipients needing permanent help with ≥3 Activities of Daily Living (ADLs).
    - **Caregiver Training Grant (CTG):** $200 annual subsidy per care recipient for family caregivers and domestic workers (helpers) to attend certified care courses.
    - **MDW / FDW Helper Levy Concession:** Reduces monthly helper levy from $300 to $60/month (saves $240/month or $2,880/year) when caring for an elderly relative (67+) or person with disability.
    - **Seniors' Mobility and Enabling Fund (SMF):** Up to 90% subsidy for mobility devices and up to 80% (capped at $2,400/yr) for consumables (adult diapers, catheter bags, milk supplements).
- **Executive Output:** Formulates key milestones, current well-being & risks, matched Singapore schemes/cards/grants/programmes, recommended next steps, and an executive narrative.
- **Offline Fallback:** If an API key is not entered, the application runs a local heuristic synthesis engine that maps categories and client notes to matched MINDS, CHAS, AIC, and Enabling Guide schemes.

### 6. Interactive Singapore Care Schemes Directory & AI Chat Assistant
- **Curated Schemes Directory:** Access an in-app directory of Singapore schemes with fast keyword search and filtering by Transition & Youth (MINDS STEP), Future Care Planning & Legal (MINDS FutureReady), Social Engagement & Befriending (MINDS MYG), Healthcare & Medical Subsidies (CHAS & MOH), Caregiver Support & Grants (AIC & SG Enable), Assistive Tech & Mobility, Adult Care, Transport, and Future Planning.
- **Direct Official Portal Links:** One-click navigation to official portals at `canva.link/whatisstep`, `futureready.minds.org.sg`, `canva.link/whatismindsmyg`, `enablingguide.sg`, `chas.sg`, and `aic.sg`.
- **AI Scheme Assistant:** Click **"Ask AI"** on any scheme or card to instantly open the Gemini Chatbot with pre-populated prompts for eligibility criteria, required medical assessments (e.g., Functional Assessment Report for HCG, Assisted Deputyship for FutureReady, or SPED graduation criteria for STEP), and application steps.
- **Copy Scheme Info:** One-click copy scheme benefits and official URLs directly into your case notes.

### 7. Task Mentions (`@`) & Email Notification Dispatch
- **`@mention` Autocomplete:** Type `@` inside note textareas to autocomplete registered staff members (e.g. `@Sarah Jenkins`).
- **Email Notification Dispatch:**
  - Supports **EmailJS** client-side dispatch directly to the tagged staff member's email.
  - Native `mailto:` fallback trigger so staff can dispatch pre-formatted handover tasks directly through their local email client.
  - Staff Directory configuration to manage caseworker names, emails, and roles.

### 5. Web Speech API Dictation & AI Point-Form Structuring
- **Microphone Dictation:** Integrated browser Web Speech API allows field staff to dictate notes hands-free during home visits or on mobile/tablet devices.
- **AI Point-Form Note Conversion (`gemini-2.5-flash`):** Click **⚡ Format to Point Form (AI)** to transform unstructured spoken stream-of-consciousness into structured, professional clinical/casework bullet points (Status & Observations, Caregiver Updates, Interventions, Action Items & Follow-up), while preserving all `@mentions` and critical facts.

### 6. Data Portability & Reporting
- **CSV Export:** Download complete case update logs in clean spreadsheet format.
- **JSON Backup & Restore:** Full state backup and restore with zero external database requirements (`localStorage`).
- **Print-to-PDF Handover Sheets:** Dedicated print stylesheet for clean physical handovers or saving PDF summaries.

---

## 📁 Project Structure

```text
├── index.html          # Core single-page layout, navigation, and accessible modals
├── styles.css          # Custom styling, fonts, urgent animations, and print media rules
├── app.js              # Main application controller, state management, auto-lock, and UI
├── geminiService.js    # Gemini 2.5 Flash REST client and offline heuristic fallback
└── README.md           # Documentation, setup, and deployment guides
```

---

## 🚀 Quick Start / Running Locally

Because CareTrack Secure is built with vanilla ES Modules and Tailwind CSS via CDN, you can run it in multiple ways:

### Option A: Using any local static server (Recommended)
```bash
# Using npx serve
npx serve .

# Or using Python 3
python3 -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B: Using Vite (Included in this repository)
```bash
npm install
npm run dev
```

### Initial Login
- Enter the default security PIN: **`1234`**
- Or click the **Quick Demo Unlock (Default: 1234)** link on the gate screen.

---

## 🔑 API & Email Configuration

### 1. Google Gemini 2.5 Flash API Key
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. In CareTrack, click **API Config** in the top navigation bar.
3. Paste your key into the **Google Gemini API Key** field and click **Save Configuration**.
4. The key is securely stored in your browser's `localStorage` and never transmitted to third-party servers.

### 2. EmailJS Notification Dispatch (Optional)
To send automatic emails when `@staff` are tagged in notes:
1. Create a free account at [EmailJS](https://www.emailjs.com/).
2. Add an Email Service (e.g., Gmail or Outlook) and copy your **Service ID**.
3. Create an Email Template with variables:
   - `{{to_name}}`: Staff member name
   - `{{to_email}}`: Staff member email
   - `{{from_name}}`: Tagging caseworker
   - `{{profile_id}}`: Client or volunteer identifier
   - `{{note_excerpt}}`: Update note excerpt
   - `{{action_link}}`: App URL
4. In CareTrack, open **API Config** and paste your:
   - **Service ID**
   - **Template ID**
   - **Public Key**
5. Save the configuration. *Note: If EmailJS is left blank, the app uses native `mailto:` links with pre-filled content!*

---

## 🌐 Deployment Instructions

### GitHub Pages
1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CareTrack Secure"
   git remote add origin https://github.com/YOUR_USER/caretrack-secure.git
   git push -u origin main
   ```
2. Navigate to **Settings > Pages** in your GitHub repository.
3. Under **Branch**, select `main` and root `/`, then click **Save**.
4. Your application will be live at `https://YOUR_USER.github.io/caretrack-secure/`.

### Vercel / Netlify
1. Connect your GitHub repository to Vercel or Netlify.
2. Build Command: Leave blank (or `npm run build` if using Vite).
3. Output Directory: `.` (or `dist` if building with Vite).
4. Deploy!

---

## 🔒 Security & Privacy Notice
- CareTrack Secure processes records locally in browser storage (`localStorage`).
- Sensitive data is never sent to external servers unless an authorized Google Gemini API key or EmailJS configuration is provided.
- Always use **Anonymize Mode** when screen-sharing or presenting case metrics.
