/**
 * Enabling Guide Singapore (SG Enable), CHAS, AIC & MINDS Knowledge Base
 * Official portals:
 * - Enabling Guide SG: https://www.enablingguide.sg/
 * - Community Health Assist Scheme (CHAS): https://www.chas.sg/
 * - Agency for Integrated Care (AIC): https://www.aic.sg/
 * - MINDS STEP: https://canva.link/whatisstep (PDF: https://www.minds.org.sg/wp-content/uploads/2026/04/Supported-Transition-and-Engagement-Programme.pdf)
 * - MINDS FutureReady (Future Care Planning): https://futureready.minds.org.sg
 * - MINDS MYG: https://canva.link/whatismindsmyg
 *
 * Curated schemes, subsidies, healthcare cards, caregiver grants, transition programmes, and future care planning in Singapore.
 *
 * @typedef {Object} EnablingScheme
 * @property {string} id
 * @property {string} name
 * @property {string} agency
 * @property {string} category
 * @property {string} summary
 * @property {string[]} targetNeeds
 * @property {string} eligibility
 * @property {string} benefit
 * @property {string} nextSteps
 * @property {string} url
 */

export const ENABLING_GUIDE_SCHEMES = [
  // ================= 1. HEALTHCARE & MEDICAL SUBSIDIES (CHAS & MOH) =================
  {
    id: 'chas-blue',
    name: 'CHAS Blue Card (Community Health Assist Scheme)',
    agency: 'Ministry of Health (MOH) / CHAS',
    category: 'Healthcare & Medical Subsidies',
    summary: 'Provides the highest tier of medical and dental subsidies at participating CHAS General Practitioner (GP) and dental clinics across Singapore.',
    targetNeeds: ['medical', 'doctor', 'clinic', 'gp', 'chas', 'chas blue', 'medication', 'dental', 'teeth', 'acute', 'chronic', 'diabetes', 'hypertension', 'low income', 'subsidies'],
    eligibility: 'Singapore Citizens with monthly per-capita household income (PCHI) ≤ $1,500, or Annual Value (AV) of home ≤ $21,000 for households with no income.',
    benefit: 'Up to $26/visit for Common Illnesses; up to $160/visit (capped at $540/year) for Complex Chronic conditions ($110/visit, $360/yr Simple Chronic); up to $170.50–$256.50 per procedure for selected dental treatments (fillings, extractions, root canal).',
    nextSteps: 'Apply or renew online at www.chas.sg via Singpass, or pick up a hardcopy application form at any Community Centre (CC) or Polyclinic.',
    url: 'https://www.chas.sg/'
  },
  {
    id: 'chas-orange',
    name: 'CHAS Orange Card (Community Health Assist Scheme)',
    agency: 'Ministry of Health (MOH) / CHAS',
    category: 'Healthcare & Medical Subsidies',
    summary: 'Subsidies for acute illnesses and chronic disease management at participating private GP clinics for lower-to-middle income households.',
    targetNeeds: ['chas orange', 'chas', 'clinic', 'gp', 'doctor', 'chronic', 'hypertension', 'cholesterol', 'diabetes', 'middle income', 'subsidy'],
    eligibility: 'Singapore Citizens with monthly per-capita household income (PCHI) between $1,501 and $2,300, or Annual Value (AV) between $21,001 and $25,000 for households with no income.',
    benefit: 'Up to $10/visit for Common Illnesses; up to $125/visit (capped at $400/year) for Complex Chronic conditions ($75/visit, $250/yr Simple Chronic conditions under CDMP).',
    nextSteps: 'Apply or renew via www.chas.sg with Singpass.',
    url: 'https://www.chas.sg/'
  },
  {
    id: 'chas-green',
    name: 'CHAS Green Card (Community Health Assist Scheme)',
    agency: 'Ministry of Health (MOH) / CHAS',
    category: 'Healthcare & Medical Subsidies',
    summary: 'Chronic disease management subsidies for all Singapore Citizens regardless of household income, covering 23 chronic conditions under the CDMP.',
    targetNeeds: ['chas green', 'chas', 'chronic', 'diabetes', 'high blood pressure', 'cholesterol', 'asthma', 'depression', 'anxiety', 'all citizens', 'cdmp'],
    eligibility: 'All Singapore Citizens with monthly per-capita household income (PCHI) > $2,300 or home Annual Value (AV) > $25,000. No income ceiling.',
    benefit: 'Up to $100/visit (capped at $320/year) for Complex Chronic conditions ($50/visit, $160/yr Simple Chronic). Covers diabetes, hypertension, lipid disorders, stroke, asthma, COPD, major depression, dementia, and more.',
    nextSteps: 'Check card status online at www.chas.sg or present NRIC at any participating CHAS GP clinic when consulting for chronic management.',
    url: 'https://www.chas.sg/'
  },
  {
    id: 'chas-pg-mg',
    name: 'Pioneer & Merdeka Generation Healthcare Subsidies',
    agency: 'Ministry of Health (MOH) / CHAS',
    category: 'Healthcare & Medical Subsidies',
    summary: 'Enhanced healthcare subsidies for pioneer and senior citizens at private CHAS clinics, polyclinics, and public Specialist Outpatient Clinics (SOCs).',
    targetNeeds: ['pioneer', 'merdeka', 'pg', 'mg', 'elderly', 'senior', 'polyclinic', 'soc', 'chronic', 'specialist', 'medication subsidy'],
    eligibility: 'Singapore Citizens who hold a physical or digital Pioneer Generation card (born 1949 or earlier) or Merdeka Generation card (born 1950–1959).',
    benefit: 'Pioneer: Up to $30.50/visit (common illnesses), up to $175/visit (complex chronic, capped at $600/yr), plus 50% off subsidized medications at polyclinics/SOCs. Merdeka: Up to $23.50/visit (common illnesses), up to $145/visit (complex chronic, capped at $480/yr), 25% off subsidized medications.',
    nextSteps: 'Present physical PG/MG card or digital card on the Singpass / HealthHub app at any CHAS participating GP or dental clinic.',
    url: 'https://www.chas.sg/'
  },

  // ================= 2. AIC CAREGIVER GRANTS & SUPPORT =================
  {
    id: 'aic-hcg',
    name: 'AIC Home Caregiving Grant (HCG)',
    agency: 'Agency for Integrated Care (AIC)',
    category: 'Caregiver Support & Grants',
    summary: 'Monthly cash payout of up to $250 or $400 to support family caregivers caring for loved ones with moderate to severe disabilities in the home.',
    targetNeeds: ['caregiver grant', 'home caregiving grant', 'hcg', 'aic grant', 'cash payout', 'monthly cash', 'allowance', 'caregiver', 'family', 'adl', 'bedbound', 'stroke', 'dementia', 'burnout', 'means test'],
    eligibility: 'Singapore Citizen care recipient living in the community who requires permanent assistance with at least 3 out of 6 Activities of Daily Living (ADLs: washing, dressing, feeding, toileting, walking/moving, transferring). Tier 1 ($400/mo): PCHI ≤ $1,500 or AV ≤ $21,000. Tier 2 ($250/mo): PCHI $1,501–$3,300.',
    benefit: 'Direct monthly cash disbursement ($250 or $400) to defray caregiving costs, hire help, buy adult diapers, or offset medical expenses.',
    nextSteps: 'Arrange a Functional Assessment Report (FAR) with a registered GP or community nurse to certify ADLs, then apply online at AIC eFASS portal (https://efass.aic.sg).',
    url: 'https://www.aic.sg/financial-assistance/home-caregiving-grant-hcg/'
  },
  {
    id: 'ctg',
    name: 'Caregiver Training Grant (CTG)',
    agency: 'Agency for Integrated Care (AIC) & SG Enable',
    category: 'Caregiver Support & Grants',
    summary: 'Annual subsidy for family caregivers and foreign domestic workers (FDWs/helpers) to attend approved eldercare and disability care courses.',
    targetNeeds: ['caregiver', 'training', 'ctg', 'course', 'domestic worker', 'helper', 'maid training', 'skills', 'burnout', 'dementia care', 'stroke care', 'transferring'],
    eligibility: 'Caregivers of Singapore Citizens or PRs aged 65 and above, or persons with disabilities of any age (means-testing required).',
    benefit: '$200 annual subsidy per care recipient to offset course fees for classroom or in-home practical care courses.',
    nextSteps: 'Select an approved course from the AIC or Enabling Guide training directory and register with the course provider with CTG endorsement.',
    url: 'https://www.aic.sg/financial-assistance/caregiver-training-grant-ctg/'
  },
  {
    id: 'aic-fdw-levy',
    name: 'MDW / FDW Levy Concession for Persons with Disabilities & Seniors',
    agency: 'Agency for Integrated Care (AIC) & Ministry of Manpower (MOM)',
    category: 'Caregiver Support & Grants',
    summary: 'Reduces the monthly foreign domestic worker (helper) levy from the standard $300 down to $60 for families caring for an elderly relative or person with disability.',
    targetNeeds: ['maid levy', 'helper levy', 'fdw levy', 'mdw levy', 'concession', 'maid', 'helper', 'domestic worker', 'domestic helper', 'caregiver', 'levy relief'],
    eligibility: 'Singapore Citizen employer living at the same NRIC address with a Singapore Citizen care recipient who is aged 67 or older, or has a permanent disability needing help with at least 1 ADL.',
    benefit: 'Monthly domestic helper levy reduced to $60/month (immediate savings of $240/month or $2,880 annually).',
    nextSteps: 'Apply online via AIC eServices (eFASS) or apply through MOM portal during helper work permit issuance/renewal with medical report.',
    url: 'https://www.aic.sg/financial-assistance/foreign-domestic-worker-levy-concession/'
  },
  {
    id: 'aic-smf',
    name: 'Seniors\' Mobility and Enabling Fund (SMF)',
    agency: 'Agency for Integrated Care (AIC)',
    category: 'Assistive Tech & Mobility',
    summary: 'Subsidies for seniors to purchase assistive devices (wheelchairs, walking frames, hospital beds) and home healthcare consumables (milk feeds, adult diapers, dressings).',
    targetNeeds: ['smf', 'seniors mobility fund', 'diapers', 'adult diapers', 'milk feed', 'nutrition', 'catheter', 'hospital bed', 'wheelchair', 'senior mobility', 'consumables'],
    eligibility: 'Singapore Citizen seniors aged 60 and above undergoing means-testing (PCHI ≤ $2,600 or AV ≤ $21,000 for households with no income) who are receiving home-based care.',
    benefit: 'Up to 90% subsidy for assistive devices; up to 80% subsidy (capped at up to $2,400/year) for essential healthcare consumables.',
    nextSteps: 'Obtain assessment from a registered therapist or community nurse, then submit application via AIC eFASS.',
    url: 'https://www.aic.sg/financial-assistance/seniors-mobility-and-enabling-fund-smf/'
  },
  {
    id: 'aic-idape',
    name: 'Interim Disability Assistance Programme for the Elderly (IDAPE)',
    agency: 'Agency for Integrated Care (AIC)',
    category: 'Caregiver Support & Grants',
    summary: 'Government assistance for older Singaporeans who were not eligible for ElderShield due to age or pre-existing disabilities.',
    targetNeeds: ['idape', 'disability cash', 'eldershield', 'severe disability', 'elderly disability', 'cash assistance', 'aic grant'],
    eligibility: 'Singapore Citizens born on or before 30 Sep 1932 (or born between 1 Oct 1932 and 30 Sep 1962 with pre-existing disability as of 30 Sep 2002) unable to perform ≥3 ADLs.',
    benefit: '$150 or $250 monthly cash payout for up to 72 months.',
    nextSteps: 'Undergo severe disability assessment by an MOH-accredited severe disability assessor and submit through AIC eFASS.',
    url: 'https://www.aic.sg/financial-assistance/idape/'
  },

  // ================= 3. MINDS PROGRAMMES & TRANSITION SERVICES =================
  {
    id: 'minds-step',
    name: 'MINDS STEP (Supported Transition and Engagement Programme)',
    agency: 'MINDS / SG Enable / MSF',
    category: 'Transition & Youth (SPED to Adult)',
    summary: 'Transitional engagement and independent living training for recent Special Education (SPED) school graduates awaiting placement in adult disability services, bridging the post-18 cliff.',
    targetNeeds: ['step', 'transition', 'sped', 'sped graduate', 'post-18', 'graduating', 'school leaver', 'intellectual disability', 'autism', 'pwid', 'minds', 'dac waitlist', 'independent living', 'whatisstep'],
    eligibility: 'Singapore Citizens or PRs who graduated from a SPED school within the last 5 years, aged 18 and above, not currently enrolled in other government-funded adult disability services, with intellectual, autism, physical, or sensory disabilities, and free from serious psychotic/behavioral challenges requiring 1-to-1 nursing care.',
    benefit: 'Structured engagement activities at least twice a week (workshops on independent living skills, social-recreational outings, emotional regulation, community navigation, and caregiver support workshops) to prevent skill regression and social isolation.',
    nextSteps: 'Apply via MINDS touchpoints or SG Enable with SPED school graduation records and parental/guardian consent. Details: https://canva.link/whatisstep (PDF: https://www.minds.org.sg/wp-content/uploads/2026/04/Supported-Transition-and-Engagement-Programme.pdf).',
    url: 'https://canva.link/whatisstep'
  },
  {
    id: 'minds-future-ready',
    name: 'MINDS Future Care Planning (FutureReady Portal)',
    agency: 'MINDS (Movement for the Intellectually Disabled of Singapore)',
    category: 'Future Planning & Legal',
    summary: 'Comprehensive Future Care Planning portal empowering caregivers of persons with intellectual and developmental disabilities to establish long-term legal, financial, healthcare, and residential roadmaps.',
    targetNeeds: ['future care', 'future planning', 'futureready', 'minds', 'deputyship', 'adap', 'assisted deputyship', 'will', 'trust', 'sntc', 'snss', 'cpf nomination', 'caregiver succession', 'advance care planning', 'acp', 'aging caregiver', 'demise', 'letter of intent', 'loi', 'lifetime roadmap'],
    eligibility: 'Parents, family members, and caregivers of persons with intellectual disabilities (PWIDs) or special needs in Singapore, especially aging parents preparing for future care continuity.',
    benefit: 'Structured guidance on Will-making, Assisted Deputyship Application Programme (ADAP), CPF nominations, Special Needs Trust Company (SNTC) Letter of Intent, Special Needs Savings Scheme (SNSS), Advance Care Planning (ACP), health screening, residential options, and 1-on-1 life coaching.',
    nextSteps: 'Register online at https://futureready.minds.org.sg to build a personalized Future Care Plan and access ADAP legal clinic and life coaching support.',
    url: 'https://futureready.minds.org.sg'
  },
  {
    id: 'minds-myg',
    name: 'MINDS MYG (MINDS Youth Group / Volunteer & Befriending Wing)',
    agency: 'MINDS MYG (Voluntary Wing of MINDS)',
    category: 'Social Engagement & Befriending',
    summary: 'Dedicated voluntary wing of MINDS organizing weekly educational, social, and recreational projects to equip PWIDs with essential life and social skills for community inclusion and employment readiness.',
    targetNeeds: ['myg', 'minds myg', 'whatismindsmyg', 'volunteer', 'befriending', 'youth group', 'socialization', 'recreation', 'outing', 'life skills', 'community inclusion', 'weekend activities', 'companionship', 'pwid'],
    eligibility: 'Persons with intellectual disabilities across children, youth, and adult age groups seeking peer befriending and active social participation; also welcomes passionate volunteers.',
    benefit: 'Weekly Saturday/Sunday club activities, befriending, sports, social outings, life skills coaching, and recreational projects fostering independence, self-confidence, and social integration.',
    nextSteps: 'Explore active community projects and enroll as a trainee or volunteer at https://canva.link/whatismindsmyg or visit https://myg.org.sg/.',
    url: 'https://canva.link/whatismindsmyg'
  },

  // ================= 4. ENABLING GUIDE (SG ENABLE) ASSISTIVE TECH & MOBILITY =================
  {
    id: 'atf',
    name: 'Assistive Technology Fund (ATF)',
    agency: 'SG Enable / MSF',
    category: 'Assistive Tech & Mobility',
    summary: 'Subsidises the purchase, replacement, or upgrading of assistive technology devices (e.g., motorized wheelchairs, hearing aids, augmentative and alternative communication AAC devices).',
    targetNeeds: ['mobility', 'wheelchair', 'motorized wheelchair', 'hearing', 'hearing aid', 'vision', 'communication', 'physical', 'assistive tech', 'atf'],
    eligibility: 'Singapore Citizen or PR with permanent disability, undergoing means-testing (per-capita household income ≤ $2,600 or annual value ≤ $21,000).',
    benefit: 'Up to 90% subsidy, capped at a lifetime quantum of $40,000.',
    nextSteps: 'Obtain assessment from a registered therapist/hospital assessor and submit application via SG Enable.',
    url: 'https://www.enablingguide.sg/schemes-subsidies/assistive-technology-fund'
  },
  {
    id: 'ets',
    name: 'Enabling Transport Subsidy (ETS)',
    agency: 'SG Enable',
    category: 'Transport',
    summary: 'Subsidises dedicated transport fees for persons with disabilities attending approved Day Activity Centres (DAC) and Special Education (SPED) schools.',
    targetNeeds: ['transport', 'transit', 'van', 'wheelchair transport', 'commute', 'mobility', 'ets'],
    eligibility: 'Singapore Citizen or PR with permanent disability attending SG Enable-funded day services or SPED schools, per-capita household income ≤ $3,600.',
    benefit: 'Up to 80% subsidy for dedicated transport operator fees.',
    nextSteps: 'Apply directly through the client\'s enrolled Day Activity Centre or SPED school administrative social worker.',
    url: 'https://www.enablingguide.sg/schemes-subsidies/enabling-transport-subsidy'
  },
  {
    id: 'ptcs',
    name: 'Persons with Disabilities Public Transport Concession Scheme',
    agency: 'TransitLink / SG Enable',
    category: 'Transport',
    summary: 'Concession card providing subsidised public bus and MRT fares for persons with disabilities.',
    targetNeeds: ['transport', 'transit', 'mrt', 'bus', 'concession', 'fare', 'concession card'],
    eligibility: 'Singapore Citizen or PR below 60 years old with a permanent disability certified by a registered medical practitioner.',
    benefit: '25% discount off adult standard fares, with no additional charges for travel above 7.2km, or monthly hybrid concession pass.',
    nextSteps: 'Apply online via TransitLink or through SG Enable with certified medical endorsement.',
    url: 'https://www.enablingguide.sg/schemes-subsidies/public-transport-concession-scheme-for-persons-with-disabilities'
  },

  // ================= 5. ADULT CARE, RESPITE & COMMUNITY CENTRES =================
  {
    id: 'dac',
    name: 'Day Activity Centres (DAC)',
    agency: 'SG Enable Funded Social Service Agencies',
    category: 'Adult Care & Day Centres',
    summary: 'Day care and community living skills training for adults with disabilities (ages 18–55) who are unable to enter open or sheltered employment.',
    targetNeeds: ['day care', 'adult', 'socialization', 'skills training', 'occupational', 'routine', 'caregiver respite', 'dac'],
    eligibility: 'Singapore Citizens or PRs aged 18 and above with permanent intellectual, physical, or sensory disabilities; must not have severe medical/behavioural instability.',
    benefit: 'Structured daytime activities, personal care supervision, community outings, and respite for working family caregivers.',
    nextSteps: 'Submit referral through a Medical Social Worker (MSW) or SG Enable touchpoint.',
    url: 'https://www.enablingguide.sg/adult-care/day-activity-centres'
  },
  {
    id: 'hbcs',
    name: 'Home-Based Care Services (HBCS)',
    agency: 'SG Enable / Community Service Providers',
    category: 'Caregiver Support & Grants',
    summary: 'Delivers personalized personal care, hygiene support, therapy exercises, and caregiver respite directly in the client\'s home.',
    targetNeeds: ['home care', 'bedbound', 'home visit', 'personal hygiene', 'caregiver burnout', 'respite', 'hbcs'],
    eligibility: 'Persons with disabilities aged 16 to 55 whose families have limited caregiving capacity or where client has high support needs.',
    benefit: 'Subsidised home-based care attendant visits up to multiple times weekly.',
    nextSteps: 'Referral through SG Enable or community hospital social worker.',
    url: 'https://www.enablingguide.sg/adult-care/home-based-care-services'
  },
  {
    id: 'respite',
    name: 'Short-Term Respite Care for Caregivers',
    agency: 'SG Enable / Adult Disability Homes',
    category: 'Caregiver Support & Grants',
    summary: 'Temporary institutional or community respite accommodation allowing caregivers to take a rest, attend to medical needs, or recover from burnout.',
    targetNeeds: ['respite', 'caregiver burnout', 'exhaustion', 'emergency', 'temporary care', 'stress', 'rest'],
    eligibility: 'Caregivers of persons with permanent disabilities requiring urgent or planned temporary relief (up to 14–30 days per year).',
    benefit: 'Safe, round-the-clock supervised accommodation and meals in licensed Adult Disability Homes.',
    nextSteps: 'Plan in advance with SG Enable or trigger urgent intake through Family Service Centre (FSC) / MSW.',
    url: 'https://www.enablingguide.sg/schemes-subsidies/respite-care'
  },

  // ================= 6. FUTURE PLANNING & SAVINGS =================
  {
    id: 'sntc',
    name: 'Special Needs Trust Company (SNTC)',
    agency: 'Special Needs Trust Company (Supported by MSF & SG Enable)',
    category: 'Future Planning & Legal',
    summary: 'Non-profit trust company in Singapore set up to safeguard financial security and long-term care plans for persons with special needs after parents pass on.',
    targetNeeds: ['legal', 'future planning', 'trust', 'financial security', 'will', 'power of attorney', 'estate', 'sntc'],
    eligibility: 'Parents or family caregivers of Singapore Citizens or PRs with permanent physical, intellectual, or developmental disabilities.',
    benefit: 'Government-subsidised trust administration; personalized Letter of Intent (LOI) outlining child\'s lifetime care roadmap and monthly disbursement.',
    nextSteps: 'Book a free consultation session directly with an SNTC case manager.',
    url: 'https://www.enablingguide.sg/future-planning/special-needs-trust-company-sntc'
  },
  {
    id: 'snss',
    name: 'Special Needs Savings Scheme (SNSS)',
    agency: 'Central Provident Fund (CPF) Board & MSF',
    category: 'Future Planning & Legal',
    summary: 'Enables parents to set aside their CPF savings to disburse regular monthly payments to children with disabilities upon the parent\'s demise.',
    targetNeeds: ['cpf', 'savings', 'future planning', 'monthly disbursement', 'financial security', 'snss'],
    eligibility: 'Parents who are CPF members and have a child with permanent physical disability, intellectual disability, or autism.',
    benefit: 'Nominated CPF savings are protected and paid out in monthly installments rather than lump-sum.',
    nextSteps: 'Submit application via CPF online portal with medical proof of child\'s disability.',
    url: 'https://www.enablingguide.sg/schemes-subsidies/special-needs-savings-scheme'
  },
  {
    id: 'e2c',
    name: 'Employability & Employment Support (E2C)',
    agency: 'SG Enable & Employment Partners',
    category: 'Adult Care & Day Centres',
    summary: 'Job training, work preparation, employment matching, and on-the-job coaching for persons with disabilities.',
    targetNeeds: ['employment', 'job', 'vocational', 'work', 'income', 'independence', 'e2c'],
    eligibility: 'Singapore Citizen or PR with permanent disability, aged 16 and above, motivated and medically fit for open employment.',
    benefit: 'Structured job-matching, workplace site modifications, assistive device trials, and ongoing job coach support.',
    nextSteps: 'Register online via Enabling Guide or SG Enable Job Portal.',
    url: 'https://www.enablingguide.sg/employment/employment-support'
  },
  {
    id: 'eipic',
    name: 'Early Intervention Programme for Infants & Children (EIPIC)',
    agency: 'ECDA & SG Enable',
    category: 'Early Childhood',
    summary: 'Developmental therapy and social-educational intervention for children aged 0 to 6 with moderate to severe developmental, intellectual, or sensory delays.',
    targetNeeds: ['child', 'pediatric', 'early intervention', 'speech therapy', 'occupational therapy', 'developmental delay', 'eipic'],
    eligibility: 'Singapore Citizen or PR children under 7 diagnosed with developmental delays by a pediatrician (e.g., KKH, NUH).',
    benefit: 'Heavily subsidized multidisciplinary therapy (speech, occupational, physiotherapy) in specialized early intervention centres.',
    nextSteps: 'Obtain pediatric medical report from KKH/NUH and submit EIPIC application through hospital social work department.',
    url: 'https://www.enablingguide.sg/early-childhood/early-intervention-programme-for-infants-children-eipic'
  }
];

/**
 * Matches client profiles and cumulative notes against Singapore support schemes, CHAS cards, AIC grants, and MINDS programmes
 */
export function matchEnablingGuideSchemes(profile, updates = []) {
  const combinedText = [
    profile?.category || '',
    profile?.name || '',
    profile?.notes || '',
    (profile?.familyMembers || []).join(' '),
    ...updates.map(u => `${u.category || ''} ${u.notes || ''}`)
  ].join(' ').toLowerCase();

  const scored = ENABLING_GUIDE_SCHEMES.map(scheme => {
    let score = 0;
    scheme.targetNeeds.forEach(kw => {
      if (combinedText.includes(kw)) {
        score += 2;
      }
    });

    // Special category affinity
    const cat = (profile?.category || '').toLowerCase();
    if ((cat.includes('medical') || cat.includes('health')) && scheme.category === 'Healthcare & Medical Subsidies') score += 3;
    if ((cat.includes('medical') || cat.includes('mobility')) && scheme.category === 'Assistive Tech & Mobility') score += 2;
    if (scheme.category === 'Caregiver Support & Grants') {
      if (profile?.familyMembers?.length > 0 || combinedText.includes('caregiver') || combinedText.includes('burnout') || combinedText.includes('daughter') || combinedText.includes('son') || combinedText.includes('wife') || combinedText.includes('husband') || combinedText.includes('helper') || combinedText.includes('maid')) {
        score += 3;
      }
    }
    if ((cat.includes('financial') || cat.includes('housing')) && (scheme.id === 'chas-blue' || scheme.id === 'aic-hcg')) score += 3;
    
    // Transition & Youth (SPED / post-18 / school leaver)
    if (combinedText.includes('sped') || combinedText.includes('graduat') || combinedText.includes('transition') || combinedText.includes('step') || combinedText.includes('18 year') || combinedText.includes('school leaver')) {
      if (scheme.id === 'minds-step') score += 5;
    }

    // Future Care Planning & Legal (aging caregiver, demise, will, deputyship)
    if (combinedText.includes('future') || combinedText.includes('deputy') || combinedText.includes('will') || combinedText.includes('aging') || combinedText.includes('elderly parent') || combinedText.includes('pass away') || combinedText.includes('trust')) {
      if (scheme.id === 'minds-future-ready' || scheme.id === 'sntc') score += 5;
    }

    // Social, befriending & volunteer activities
    if (combinedText.includes('befriend') || combinedText.includes('volunteer') || combinedText.includes('social') || combinedText.includes('weekend') || combinedText.includes('myg') || combinedText.includes('outing')) {
      if (scheme.id === 'minds-myg') score += 5;
    }

    return { scheme, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top matched schemes (up to 3)
  const top = scored.filter(s => s.score > 0).slice(0, 3).map(s => s.scheme);
  if (top.length === 0) {
    // Return high-value default schemes: CHAS Blue Card, AIC Home Caregiving Grant, and MINDS Future Care Planning
    return [
      ENABLING_GUIDE_SCHEMES.find(s => s.id === 'chas-blue') || ENABLING_GUIDE_SCHEMES[0],
      ENABLING_GUIDE_SCHEMES.find(s => s.id === 'aic-hcg') || ENABLING_GUIDE_SCHEMES[1],
      ENABLING_GUIDE_SCHEMES.find(s => s.id === 'minds-future-ready') || ENABLING_GUIDE_SCHEMES[2]
    ];
  }
  return top;
}
