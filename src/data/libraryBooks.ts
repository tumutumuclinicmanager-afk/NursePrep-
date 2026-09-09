export interface ChapterSummary {
  chapterNumber: number;
  title: string;
  highYieldPoints: string[];
  keyMnemonic?: string;
  googleSearchQuery: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  edition: string;
  category: 'Exam Prep' | 'Pharmacology' | 'Med-Surg' | 'Pediatrics' | 'Maternity' | 'Psychiatric' | 'Fundamentals';
  spineColor: string; // Tailwind gradient or color
  textColor: string;
  accentColor: string;
  pages: number;
  nclexYieldRating: number; // 1-5
  isbn: string;
  summary: string;
  highYieldTopics: string[];
  chapters: ChapterSummary[];
  googleBooksQuery: string;
}

export const LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 'saunders-nclex-9th',
    title: 'Saunders Comprehensive Review for the NCLEX-RN',
    subtitle: 'The Gold Standard Examination Guide',
    author: 'Linda Anne Silvestri, PhD, RN, FAAN & Angela Silvestri, PhD, RN',
    edition: '9th Edition',
    category: 'Exam Prep',
    spineColor: 'from-blue-900 via-indigo-950 to-blue-950',
    textColor: 'text-amber-300',
    accentColor: '#3b82f6',
    pages: 1152,
    nclexYieldRating: 5,
    isbn: '978-0323795302',
    summary: 'Widely recognized as the premier examination manual for the NCLEX-RN. Encompasses clinical judgment measurement models, Next-Generation question types, and comprehensive practice rationales.',
    highYieldTopics: [
      'Prioritization & Clinical Delegation (ABC Framework)',
      'Management of Care & Legal Responsibilities',
      'Physiological Adaptation & Acute Crises',
      'Safe and Effective Care Environment'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'Client Needs & Priority Decision Making',
        highYieldPoints: [
          'Airway, Breathing, Circulation (ABCs) takes priority unless CPR with cardiac arrest (CAB).',
          'Acute conditions take precedence over chronic, stable conditions.',
          'Systemic issues take priority over local, isolated concerns.',
          'Assess the patient directly before calling the healthcare provider, unless in immediate life threat.'
        ],
        keyMnemonic: 'ABC + Maslow: Physiological needs must be met before psychosocial safety.',
        googleSearchQuery: 'NCLEX prioritization delegation Saunders clinical judgment'
      },
      {
        chapterNumber: 2,
        title: 'Fluid, Electrolyte, and Acid-Base Imbalances',
        highYieldPoints: [
          'Potassium (3.5 - 5.0 mEq/L): Never give IV push. Cardiac arrhythmias are immediate emergency.',
          'Sodium (135 - 145 mEq/L): Hyponatremia leads to cerebral edema and seizure precautions.',
          'Calcium (9.0 - 10.5 mg/dL): Hypocalcemia causes Chvostek and Trousseau signs.',
          'ROME Method: Respiratory Opposite (pH & PaCO2), Metabolic Equal (pH & HCO3).'
        ],
        keyMnemonic: 'CATS of Hypocalcemia: Convulsions, Arrhythmias, Tetany, Spasms/Stridor.',
        googleSearchQuery: 'Saunders acid base balance electrolyte imbalances NCLEX'
      },
      {
        chapterNumber: 3,
        title: 'Pharmacological Therapies & High-Alert Precautions',
        highYieldPoints: [
          'Digoxin (0.5 - 2.0 ng/mL): Check apical pulse for 1 full minute. Yellow halos indicate toxicity.',
          'Lithium (0.6 - 1.2 mEq/L): Ensure adequate hydration and steady sodium intake.',
          'Warfarin: Monitor PT/INR (Target 2.0-3.0). Antidote is Vitamin K.',
          'Heparin: Monitor aPTT (1.5-2.5x control). Antidote is Protamine Sulfate.'
        ],
        keyMnemonic: 'Remember "SLOW": Check pulse, level, output, and warnings before cardiac meds.',
        googleSearchQuery: 'Saunders high alert medications NCLEX pharmacology'
      }
    ],
    googleBooksQuery: 'Saunders Comprehensive Review for the NCLEX-RN Linda Anne Silvestri'
  },
  {
    id: 'davis-drug-guide-18th',
    title: "Davis's Drug Guide for Nurses",
    subtitle: 'Comprehensive Nursing Drug Reference',
    author: 'April Hazard Vallerand, PhD, RN, FAAN & Cynthia A. Sanoski, BS, PharmD',
    edition: '18th Edition',
    category: 'Pharmacology',
    spineColor: 'from-rose-950 via-red-900 to-amber-950',
    textColor: 'text-amber-200',
    accentColor: '#dc2626',
    pages: 1472,
    nclexYieldRating: 5,
    isbn: '978-1719646406',
    summary: 'The trusted bedside and NCLEX drug compendium. Features high-alert badges, life-span considerations, IV push rates, and black box warnings.',
    highYieldTopics: [
      'High-Alert Medications & Sound-Alike Look-Alike Drugs',
      'Antidotes, Toxicity Thresholds & Reversals',
      'IV Push Administration Timing & Dilutions',
      'Black Box Warnings & Patient Education'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'Cardiac & Antihypertensive Medications',
        highYieldPoints: [
          'ACE Inhibitors (-pril): Monitor for dry cough, angioedema, and hyperkalemia.',
          'Beta Blockers (-lol): Hold if HR < 60 bpm or Systolic BP < 100 mmHg. Contraindicated in severe asthma.',
          'Calcium Channel Blockers (-dipine, Diltiazem, Verapamil): Watch for peripheral edema and bradycardia.',
          'Nitroglycerin: Up to 3 doses 5 minutes apart for chest pain. Contraindicated with PDE-5 inhibitors (Sildenafil).'
        ],
        keyMnemonic: 'BETA: Bradycardia, Edema, Tiredness, Airway bronchospasm risk.',
        googleSearchQuery: 'Davis Drug Guide cardiovascular antihypertensive nursing considerations'
      },
      {
        chapterNumber: 2,
        title: 'Insulins & Endocrine Pharmacotherapy',
        highYieldPoints: [
          'Rapid-Acting (Lispro, Aspart): Onset 15 min, Peak 1-2 hr, Duration 3-5 hr. Give with food in sight.',
          'Short-Acting (Regular): Onset 30-60 min, Peak 2-4 hr. Only insulin given IV for DKA.',
          'Intermediate (NPH): Cloudy, Peak 4-12 hr (highest hypoglycemia risk in mid-afternoon).',
          'Long-Acting (Glargine, Detemir): Peakless, 24 hr duration. Never mix in same syringe.'
        ],
        keyMnemonic: 'Clear before Cloudy: Draw up Regular (clear) before NPH (cloudy).',
        googleSearchQuery: 'Davis Drug Guide insulin peak onset duration nursing NCLEX'
      },
      {
        chapterNumber: 3,
        title: 'Anticoagulants, Antiplatelets & Thrombolytics',
        highYieldPoints: [
          'Enoxaparin (Lovenox): Inject subQ in love handles, do not expel air bubble, do not rub.',
          'Thrombolytics (tPA, Alteplase): Must rule out active bleeding, recent surgery, or hemorrhagic stroke.',
          'Bleeding Precautions: Soft toothbrush, electric razor, avoid IM injections, monitor hematocrit.'
        ],
        keyMnemonic: 'BLEED: Beware bruising, Low platelets, Evaluate urine/stool, Epistaxis, Decrease trauma.',
        googleSearchQuery: 'Davis Drug Guide anticoagulants heparin warfarin nursing precautions'
      }
    ],
    googleBooksQuery: 'Daviss Drug Guide for Nurses April Hazard Vallerand'
  },
  {
    id: 'prioritization-delegation-lacharity',
    title: 'Prioritization, Delegation, and Assignment',
    subtitle: 'Practice Exercises for the NCLEX Examination',
    author: 'Linda A. LaCharity, PhD, RN, Candice K. Kumagai & Barbara Bartz',
    edition: '5th Edition',
    category: 'Exam Prep',
    spineColor: 'from-emerald-950 via-teal-900 to-slate-950',
    textColor: 'text-emerald-200',
    accentColor: '#059669',
    pages: 368,
    nclexYieldRating: 5,
    isbn: '978-0323683166',
    summary: 'The definitive textbook for mastering "Who do you see first?" questions on the NCLEX. Unpacks the legal scope of practice for RNs, LPNs/LVNs, and Unlicensed Assistive Personnel (UAP).',
    highYieldTopics: [
      'Scope of Practice: RN vs. LPN/LVN vs. UAP / CNA',
      'Clinical Triage & Who to See First',
      'Delegation Principles & The 5 Rights of Delegation',
      'Disaster Management & START Triage Rules'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'The Five Rights of Delegation & Legal Boundaries',
        highYieldPoints: [
          'Right Task, Right Circumstance, Right Person, Right Direction/Communication, Right Supervision.',
          'RN NEVER delegates: Assessment, Teaching, Clinical Judgment, Evaluation, Blood Administration, First dose IV meds (Remember: EAT = Evaluate, Assess, Teach).',
          'LPN/LVN Scope: Stable clients with predictable outcomes, sterile dressing changes, routine catheterization, administering standard oral/subQ meds.',
          'UAP/CNA Scope: Routine ADLs, vital signs on stable patients, ambulation, basic hygiene, intake and output recording.'
        ],
        keyMnemonic: 'Do NOT delegate what you can E.A.T. (Evaluate, Assess, Teach)!',
        googleSearchQuery: 'LaCharity prioritization delegation scope of practice NCLEX'
      },
      {
        chapterNumber: 2,
        title: 'Disaster Triage & Mass Casualty Incident (MCI)',
        highYieldPoints: [
          'Red Tag (Immediate): Life-threatening compromise but survivable (tension pneumothorax, arterial bleed, respiratory rate >30).',
          'Yellow Tag (Delayed): Serious injury but can wait 1-2 hours (open compound fracture, large burns without airway compromise).',
          'Green Tag (Minimal): "Walking wounded", minor abrasions and sprains.',
          'Black Tag (Expectant): Deceased or catastrophic nonsurvivable injury (penetrating brain trauma with apnea).'
        ],
        keyMnemonic: 'START triage: Simple Triage And Rapid Treatment.',
        googleSearchQuery: 'START mass casualty disaster triage red yellow green black NCLEX'
      }
    ],
    googleBooksQuery: 'Prioritization Delegation and Assignment Linda LaCharity'
  },
  {
    id: 'brunner-suddarth-medsurg',
    title: "Brunner & Suddarth's Medical-Surgical Nursing",
    subtitle: 'Clinical Excellence & Pathophysiology',
    author: 'Janice L. Hinkle, PhD, RN, CNRN & Kerry H. Cheever, PhD, RN',
    edition: '15th Edition',
    category: 'Med-Surg',
    spineColor: 'from-amber-950 via-yellow-950 to-stone-900',
    textColor: 'text-amber-300',
    accentColor: '#d97706',
    pages: 2384,
    nclexYieldRating: 5,
    isbn: '978-1975161033',
    summary: 'The cornerstone medical-surgical nursing authority. In-depth coverage of organ systems, critical path planning, surgical interventions, and post-operative recovery.',
    highYieldTopics: [
      'Cardiovascular: Heart Failure, Myocardial Infarction & ECGs',
      'Respiratory: COPD, ARDS, Chest Tubes & Tracheostomies',
      'Neurological: Stroke, ICP Elevation, Spinal Cord Injury & Autonomic Dysreflexia',
      'Renal & Metabolic: Acute Kidney Injury, DKA vs HHS, Cirrhosis'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'Neurological Crises & Increased Intracranial Pressure (ICP)',
        highYieldPoints: [
          'Normal ICP: 5 - 15 mmHg. Sustained ICP > 20 mmHg requires prompt emergency intervention.',
          'Cushing Triad (Late sign of impending herniation): Severe hypertension with widening pulse pressure, bradycardia, and irregular/Cheyne-Stokes respirations.',
          'Nursing Actions: Elevate HOB 30 degrees, maintain neutral head alignment, avoid hip flexion, administer Mannitol as ordered.',
          'Autonomic Dysreflexia: Occurs in spinal cord injuries at T6 or above. Triggered by full bladder, bowel impaction. High BP, severe headache, facial flushing.'
        ],
        keyMnemonic: 'Cushing vs Shock: Cushing is opposite of shock (BP up, HR down, RR down).',
        googleSearchQuery: 'Brunner Suddarth increased ICP Cushing triad autonomic dysreflexia'
      },
      {
        chapterNumber: 2,
        title: 'Cardiovascular Emergencies & Chest Tube Management',
        highYieldPoints: [
          'Myocardial Infarction: MONA protocol (Morphine, Oxygen, Nitrates, Aspirin). Check Troponin I/T.',
          'Left Heart Failure: Pulmonary symptoms (crackles, dyspnea, orthopnea, pink frothy sputum).',
          'Right Heart Failure: Systemic symptoms (jugular venous distension, hepatomegaly, peripheral edema, ascites).',
          'Chest Tube: Continuous bubbling in water seal chamber indicates an air leak. Fluctuations (tidaling) with breathing are normal.'
        ],
        keyMnemonic: 'LEFT heart failure = LUNGS (pulmonary); RIGHT heart failure = REST of the body (systemic).',
        googleSearchQuery: 'Brunner Suddarth heart failure chest tube air leak NCLEX'
      }
    ],
    googleBooksQuery: 'Brunner and Suddarths Textbook of Medical Surgical Nursing Janice Hinkle'
  },
  {
    id: 'wong-pediatric-nursing',
    title: "Wong's Essentials of Pediatric Nursing",
    subtitle: 'Child Development & Pediatric Clinical Care',
    author: 'Marilyn J. Hockenberry, PhD, RN, PNP-BC, FAAN & David Wilson, MS, RN',
    edition: '11th Edition',
    category: 'Pediatrics',
    spineColor: 'from-violet-950 via-purple-900 to-indigo-950',
    textColor: 'text-purple-200',
    accentColor: '#8b5cf6',
    pages: 1248,
    nclexYieldRating: 4,
    isbn: '978-0323624190',
    summary: 'The benchmark pediatric nursing resource covering infant and toddler developmental milestones, congenital cardiac anomalies, pediatric resuscitation, and family-centered care.',
    highYieldTopics: [
      'Developmental Milestones (Erikson, Piaget & Physical Growth)',
      'Congenital Heart Defects (Cyanotic vs. Acyanotic)',
      'Pediatric Respiratory Crises (Epiglottitis vs. Croup)',
      'Pediatric Medication Safety & Weight-Based Calculations'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'Congenital Heart Defects & Circulatory Shunts',
        highYieldPoints: [
          'Tetralogy of Fallot (Cyanotic): 4 defects - Ventricular Septal Defect, Pulmonic Stenosis, Overriding Aorta, Right Ventricular Hypertrophy.',
          'Hypercyanotic "Tet" Spells: Place child in knee-to-chest position immediately to increase systemic vascular resistance.',
          'Acyanotic Defects: Patent Ductus Arteriosus (PDA), Atrial Septal Defect (ASD), Ventricular Septal Defect (VSD) - left-to-right shunt.'
        ],
        keyMnemonic: 'DROP for Tetralogy: Displaced aorta, Right ventricle hypertrophy, Opening in septum, Pulmonary stenosis.',
        googleSearchQuery: 'Wong Essentials Pediatric Tetralogy of Fallot knee chest position NCLEX'
      },
      {
        chapterNumber: 2,
        title: 'Acute Pediatric Respiratory Conditions',
        highYieldPoints: [
          'Acute Epiglottitis: Caused by Hib. 4 Ds: Drooling, Dysphagia, Dysphonia, Distressed inspiratory stridor.',
          'Emergency Action for Epiglottitis: NEVER examine throat with tongue blade. Prepare for immediate emergency tracheostomy/intubation.',
          'Croup (Laryngotracheobronchitis): Barking seal cough, inspiratory stridor. Treat with cool mist, humidified oxygen, and nebulized epinephrine.'
        ],
        keyMnemonic: 'NEVER stick a tongue blade into a child with suspected epiglottitis!',
        googleSearchQuery: 'Epiglottitis vs Croup pediatric nursing interventions Wong'
      }
    ],
    googleBooksQuery: 'Wongs Essentials of Pediatric Nursing Marilyn Hockenberry'
  },
  {
    id: 'lowdermilk-maternity-care',
    title: "Lowdermilk's Maternity & Women's Health Care",
    subtitle: 'Obstetrical & Neonatal Nursing Excellence',
    author: 'Deitra Leonard Lowdermilk, RNC, PhD, FAAN & Shannon E. Perry, RN, PhD',
    edition: '12th Edition',
    category: 'Maternity',
    spineColor: 'from-pink-950 via-rose-950 to-slate-950',
    textColor: 'text-rose-200',
    accentColor: '#ec4899',
    pages: 992,
    nclexYieldRating: 4,
    isbn: '978-0323556293',
    summary: 'The primary textbook for labor, delivery, neonatal assessment, postpartum complications, and high-risk pregnancies.',
    highYieldTopics: [
      'Fetal Heart Rate Monitoring (VEAL CHOP Decelerations)',
      'Labor Stages & Labor Progression',
      'Preeclampsia, Eclampsia & Magnesium Sulfate Toxicity',
      'Newborn APGAR Scoring & Postpartum Hemorrhage'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'Fetal Heart Rate (FHR) Decelerations & Interventions',
        highYieldPoints: [
          'Variable Decels = Cord Compression. Reposition mom to left side, stop Pitocin, administer O2, check for prolapsed cord.',
          'Early Decels = Head Compression. Normal, benign finding during labor progression; continue monitoring.',
          'Accelerations = Oxygenation / Ok. Reassuring sign of fetal well-being.',
          'Late Decels = Placental Insufficiency. Emergency! Reposition mother to left lateral position, oxygen 8-10 L/min via non-rebreather, IV fluid bolus, stop oxytocin, notify physician immediately.'
        ],
        keyMnemonic: 'VEAL CHOP: Variable=Cord, Early=Head, Acceleration=Ok, Late=Placenta.',
        googleSearchQuery: 'VEAL CHOP fetal heart rate monitoring NCLEX Lowdermilk'
      },
      {
        chapterNumber: 2,
        title: 'Preeclampsia & Magnesium Sulfate Management',
        highYieldPoints: [
          'Preeclampsia Signs: Hypertension (BP >140/90), proteinuria, facial/hand edema, hyperreflexia (+3, +4 DTRs), epigastric pain.',
          'Magnesium Sulfate: Given to prevent seizures in preeclampsia.',
          'Magnesium Toxicity: Absent deep tendon reflexes (DTRs), respiratory rate <12 breaths/min, urine output <30 mL/hr.',
          'Antidote for Magnesium Toxicity: Calcium Gluconate (keep at bedside).'
        ],
        keyMnemonic: 'BURP for Mag Toxicity: Blood pressure down, Urine output down, Respirations down, Patellar reflex absent.',
        googleSearchQuery: 'Preeclampsia magnesium sulfate toxicity calcium gluconate NCLEX'
      }
    ],
    googleBooksQuery: 'Maternity and Womens Health Care Deitra Lowdermilk'
  },
  {
    id: 'varcarolis-psychiatric-nursing',
    title: "Varcarolis' Foundations of Psychiatric-Mental Health Nursing",
    subtitle: 'A Clinical Approach to Mental Health',
    author: 'Margaret Jordan Halter, PhD, APRN',
    edition: '9th Edition',
    category: 'Psychiatric',
    spineColor: 'from-cyan-950 via-sky-950 to-blue-950',
    textColor: 'text-cyan-200',
    accentColor: '#06b6d4',
    pages: 720,
    nclexYieldRating: 4,
    isbn: '978-0323624800',
    summary: 'The standard text for psychiatric nursing, therapeutic nurse-client communication, psychopharmacology (SSRIs, MAOIs, Lithium, Antipsychotics), and de-escalation protocols.',
    highYieldTopics: [
      'Therapeutic vs. Non-Therapeutic Communication',
      'Suicide Risk Assessment & Involuntary Commitment',
      'Psychotropic Medications & Serotonin Syndrome',
      'Neuroleptic Malignant Syndrome (NMS) & Extrapyramidal Symptoms (EPS)'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'Psychopharmacology & Critical Drug Syndromes',
        highYieldPoints: [
          'Lithium (0.6 - 1.2 mEq/L): Early toxicity = nausea, vomiting, fine tremors, diarrhea. Late = ataxia, coarse tremors, seizures. Do not restrict dietary sodium.',
          'MAO Inhibitors (Phenelzine, Tranylcypromine): Avoid Tyramine-rich foods (aged cheese, cured meats, red wine) to prevent hypertensive crisis.',
          'Neuroleptic Malignant Syndrome (NMS): Caused by typical antipsychotics. Severe muscle rigidity ("lead pipe"), high fever (hyperpyrexia), tachycardia, diaphoresis. Treat with Dantrolene/Bromocriptine.',
          'Serotonin Syndrome: Agitation, hyperreflexia, tremors, clonus, fever. Caused by SSRI combined with St. John\'s Wort or MAOI.'
        ],
        keyMnemonic: 'FEVER for NMS: Fever, Encephalopathy, Vitals unstable, Elevated enzymes, Rigidity.',
        googleSearchQuery: 'Varcarolis neuroleptic malignant syndrome lithium toxicity NCLEX'
      },
      {
        chapterNumber: 2,
        title: 'Therapeutic Communication & De-escalation',
        highYieldPoints: [
          'NCLEX Gold Rules: Never ask "Why?" (places patient on defensive). Never give false reassurance ("Everything will be fine").',
          'Acknowledge Feelings: Reflect and validate emotion before addressing behavior ("It sounds like you are feeling overwhelmed").',
          'Hallucinations & Delusions: Do not validate or debate the hallucination. Present reality gently ("I don\'t see the spiders, but I understand that they are frightening to you").'
        ],
        keyMnemonic: 'Broad Openings & Silence: Allow the patient to lead the conversation and express feelings safely.',
        googleSearchQuery: 'Therapeutic communication techniques nursing NCLEX Varcarolis'
      }
    ],
    googleBooksQuery: 'Varcarolis Foundations of Psychiatric Mental Health Nursing Margaret Halter'
  },
  {
    id: 'potter-perry-fundamentals',
    title: "Potter & Perry's Clinical Nursing Skills & Techniques",
    subtitle: 'Mastery of Fundamental Bedside Procedures',
    author: 'Anne Griffin Perry, EdD, RN, FAAN & Patricia A. Potter, PhD, RN, FAAN',
    edition: '10th Edition',
    category: 'Fundamentals',
    spineColor: 'from-amber-900 via-stone-900 to-yellow-950',
    textColor: 'text-amber-200',
    accentColor: '#b45309',
    pages: 1040,
    nclexYieldRating: 4,
    isbn: '978-0323708630',
    summary: 'The essential guide to core nursing procedures, asepsis, blood transfusions, catheterization, wound care, and infection control standards.',
    highYieldTopics: [
      'Infection Control: Contact, Droplet & Airborne Precautions',
      'Blood Transfusion Protocol & Acute Hemolytic Reaction',
      'Invasive Lines: Central Venous Lines & TPN Protocol',
      'Pressure Injury Staging & Sterile Wound Dressing'
    ],
    chapters: [
      {
        chapterNumber: 1,
        title: 'Infection Control & Transmission Precautions',
        highYieldPoints: [
          'Airborne (MTV: Measles, Tuberculosis, Varicella): N95 respirator mask, negative pressure private room, door kept closed.',
          'Droplet (SPIDERMAN: Sepsis, Pertussis, Influenza, Diphtheria, Epiglottitis, Rubella, Mumps, Adenovirus): Surgical mask within 3 feet, private room or cohort.',
          'Contact (MRS. WEE: MRSA, RSV, Skin infections, Wound infections, Enteric C. diff, Eye infection): Gloves, gown. C. difficile requires soap and water handwashing (alcohol gel is ineffective).'
        ],
        keyMnemonic: 'C. DIFF = Soap & Water ONLY (spores survive alcohol hand sanitizer).',
        googleSearchQuery: 'Potter Perry infection control airborne droplet contact precautions NCLEX'
      },
      {
        chapterNumber: 2,
        title: 'Blood Product Administration & Hemolytic Reactions',
        highYieldPoints: [
          'Pre-transfusion: 2 RN verification of patient ID, blood type, Rh factor, expiration date, donor number.',
          'Administration: Must use 18 or 20 gauge IV needle, prime tubing ONLY with 0.9% Normal Saline (never dextrose or lactated Ringer).',
          'Timing: Start infusion within 30 minutes of leaving blood bank; complete infusion within 4 hours.',
          'Acute Hemolytic Reaction: Chills, fever, low back pain, tachycardia, tachypnea, hypotension. FIRST STEP: STOP THE TRANSFUSION IMMEDIATELY, flush IV with fresh normal saline using new tubing, notify provider, send blood bag & urine to lab.'
        ],
        keyMnemonic: 'STOP THE BLOOD FIRST. Do not discard tubing or blood bag.',
        googleSearchQuery: 'Blood transfusion reaction nursing protocol Potter Perry NCLEX'
      }
    ],
    googleBooksQuery: 'Potter and Perrys Clinical Nursing Skills and Techniques Anne Perry'
  }
];

export const POPULAR_GOOGLE_SEARCHES = [
  {
    label: 'Normal Lab Values Cheat Sheet',
    query: 'normal lab values nursing cheat sheet nclex potassium sodium wbc platelets',
    tag: 'Lab Values'
  },
  {
    label: 'Digoxin Toxicity Signs & Antidote',
    query: 'digoxin toxicity nclex questions halos digibind potassium level',
    tag: 'Pharmacology'
  },
  {
    label: 'VEAL CHOP Decelerations Rationale',
    query: 'VEAL CHOP fetal heart rate decelerations nursing interventions nclex',
    tag: 'Maternity'
  },
  {
    label: 'Parkland Burn Fluid Formula',
    query: 'parkland formula burn resuscitation calculation nursing nclex practice',
    tag: 'Critical Care'
  },
  {
    label: 'Insulin Peak Times Chart',
    query: 'insulin peak onset duration table rapid regular nph glargine nclex',
    tag: 'Endocrine'
  },
  {
    label: 'Lithium Therapeutic Range & Symptoms',
    query: 'lithium therapeutic levels toxicity signs nursing interventions nclex',
    tag: 'Psychiatric'
  },
  {
    label: 'Cranial Nerves Mnemonic & Assessment',
    query: 'cranial nerves mnemonic assessment nursing examination nclex',
    tag: 'Neurology'
  },
  {
    label: 'ABG Interpretation ROME Method',
    query: 'ABG arterial blood gas interpretation ROME method respiratory metabolic acidosis alkalosis',
    tag: 'Acid-Base'
  }
];
