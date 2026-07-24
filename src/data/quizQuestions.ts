import { QuestionData } from '@/types';

export const NURSING_UNITS = [
  'Medical-Surgical Nursing',
  'Maternal & Newborn Health',
  'Pediatric Nursing',
  'Pharmacology & Parenteral Therapies',
  'Psychiatric & Mental Health',
  'Community & Public Health',
  'Nursing Fundamentals & Leadership',
  'Critical Care & Emergency Nursing'
] as const;

export type NursingUnit = typeof NURSING_UNITS[number];

export function normalizeExamCategory(mode?: string): 'NCK' | 'NCLEX' | 'HESI' | 'GED' | 'Custom' {
  if (!mode) return 'Custom';
  const m = mode.toUpperCase();
  if (m.includes('NCK') || m.includes('KENYA') || m.includes('COUNCIL')) return 'NCK';
  if (m.includes('NCLEX') || m.includes('RN') || m.includes('PN') || m.includes('NGN')) return 'NCLEX';
  if (m.includes('HESI') || m.includes('ATI') || m.includes('TEAS')) return 'HESI';
  if (m.includes('GED') || m.includes('FOUNDATION')) return 'GED';
  return 'Custom';
}

export const ALL_QUIZ_QUESTIONS: QuestionData[] = [
  // ==========================================
  // UNIT 1: Medical-Surgical Nursing
  // ==========================================
  {
    id: 'medsurg-1',
    examMode: 'NCLEX',
    unitDomain: 'Medical-Surgical Nursing',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'A nurse is assessing a client who underwent a total thyroidectomy 6 hours ago. The client exhibits facial muscle twitching when the nurse taps gently over the facial nerve in front of the ear. Which medication should the nurse prepare to administer immediately?',
    difficulty: 'Medium',
    rationale: 'Facial muscle twitching when tapping the facial nerve is Chvostek\'s sign, a classic indicator of severe hypocalcemia secondary to accidental removal or trauma to the parathyroid glands during thyroidectomy. Intravenous calcium gluconate is the immediate treatment to prevent tetany and laryngospasm.',
    options: [
      { id: 'a', text: 'Potassium chloride IV infusion', isCorrect: false },
      { id: 'b', text: 'Calcium gluconate IV injection', isCorrect: true },
      { id: 'c', text: 'Levothyroxine sodium PO', isCorrect: false },
      { id: 'd', text: 'Calcitonin subcutaneous injection', isCorrect: false }
    ],
    tags: ['Thyroidectomy', 'Endocrine', 'Hypocalcemia']
  },
  {
    id: 'medsurg-2',
    examMode: 'NCLEX',
    unitDomain: 'Medical-Surgical Nursing',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'A client with a lower leg fiberglass cast reports severe, escalating pain (9/10) that is unrelieved by prescribed intravenous morphine. Which clinical findings should the nurse recognize as signs of acute compartment syndrome? (Select all that apply)',
    difficulty: 'Hard',
    rationale: 'Acute compartment syndrome is a surgical emergency caused by increased pressure within a closed tissue compartment. The "6 Ps" include Pain out of proportion and unrelieved by opioids, Paresthesia (early sign), Pallor, Pulselessness (late sign), Poikilothermia, and Paralysis.',
    options: [
      { id: 'a', text: 'Severe pain exacerbated by passive stretch of toes', isCorrect: true },
      { id: 'b', text: 'Paresthesia (numbness and tingling) in the distal foot', isCorrect: true },
      { id: 'c', text: 'Pitting edema extending up to the groin', isCorrect: false },
      { id: 'd', text: 'Pale, cool skin distal to the cast', isCorrect: true },
      { id: 'e', text: 'Diminished or absent dorsalis pedis pulse', isCorrect: true },
      { id: 'f', text: 'Warm, erythemic calf muscle', isCorrect: false }
    ],
    tags: ['Musculoskeletal', 'Cast Care', 'Compartment Syndrome']
  },
  {
    id: 'medsurg-3',
    examMode: 'NCLEX',
    unitDomain: 'Medical-Surgical Nursing',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Dosage Calculation',
    questionStem: 'A provider orders a heparin infusion at 800 units/hour for a client with a deep vein thrombosis (DVT). The pharmacy supplies a IV bag containing Heparin 25,000 units in 500 mL 5% Dextrose in Water (D5W). Calculate the infusion rate in mL/hour.',
    difficulty: 'Medium',
    numericValue: 16,
    unitOfMeasure: 'mL/hr',
    tolerance: 0,
    calculationSteps: 'Rate (mL/hr) = (Desired Units/hr) × (Total Volume mL / Total Units) = 800 units/hr × (500 mL / 25,000 units) = 800 × 0.02 = 16 mL/hr.',
    rationale: 'To calculate mL/hr: 800 units/hr ÷ (25,000 units / 500 mL) = 800 ÷ 50 = 16 mL/hr.',
    tags: ['Pharmacology', 'Dosage Math', 'Hematology']
  },
  {
    id: 'medsurg-4',
    examMode: 'NCLEX',
    unitDomain: 'Medical-Surgical Nursing',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'A client arrives at the emergency department reporting severe substernal chest pressure radiating to the left jaw and diaphoresis. Arrange the following emergency interventions in order of priority (1 = highest priority to 4 = lowest priority).',
    difficulty: 'Hard',
    orderedSteps: [
      'Administer supplemental oxygen to maintain SpO2 above 90%',
      'Obtain a 12-lead electrocardiogram (ECG)',
      'Administer sublingual nitroglycerin as prescribed',
      'Draw blood samples for cardiac troponin and CK-MB markers'
    ],
    rationale: 'Oxygenation and airway/breathing (A/B) come first to prevent ongoing myocardial ischemia. Obtaining a 12-lead ECG within 10 minutes confirms STEMI vs NSTEMI. Nitroglycerin promotes coronary vasodilation to alleviate pain. Blood draws for diagnostic biomarkers follow.',
    tags: ['Cardiology', 'MI', 'Emergency']
  },
  {
    id: 'medsurg-5',
    examMode: 'NCLEX',
    unitDomain: 'Medical-Surgical Nursing',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: In a client experiencing Diabetic Ketoacidosis (DKA), rapid Kussmaul respirations represent an adaptive respiratory compensation mechanism to eliminate excess carbon dioxide and raise serum pH.',
    difficulty: 'Easy',
    trueFalseAnswer: true,
    rationale: 'True. DKA causes severe metabolic acidosis due to ketone accumulation. The respiratory center compensates by hyperventilating (Kussmaul breathing) to blow off CO2 (an acid), thereby reducing carbonic acid levels and shifting pH toward normal.',
    tags: ['Diabetes', 'Acid-Base', 'Endocrine']
  },

  // ==========================================
  // UNIT 2: Maternal & Newborn Health
  // ==========================================
  {
    id: 'ob-1',
    examMode: 'NCK',
    unitDomain: 'Maternal & Newborn Health',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'A pregnant client at 34 weeks gestation presents to the labor unit reporting sudden onset of dark red vaginal bleeding accompanied by severe, continuous uterine abdominal pain and a rigid, board-like abdomen. What condition should the nurse suspect?',
    difficulty: 'Medium',
    rationale: 'Abruptio placentae (premature separation of the placenta) typically presents with painful, dark red vaginal bleeding, uterine tenderness or hypertonicity, and a rigid, board-like abdomen. Placenta previa presents with painless, bright red bleeding.',
    options: [
      { id: 'a', text: 'Placenta Previa', isCorrect: false },
      { id: 'b', text: 'Abruptio Placentae', isCorrect: true },
      { id: 'c', text: 'Uterine Rupture', isCorrect: false },
      { id: 'd', text: 'Cervical Incompetence', isCorrect: false }
    ],
    tags: ['Obstetrics', 'Placental Complications', 'Emergencies']
  },
  {
    id: 'ob-2',
    examMode: 'NCK',
    unitDomain: 'Maternal & Newborn Health',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'A primigravida at 38 weeks gestation is evaluated in the triage clinic. Which assessment findings support a diagnosis of severe preeclampsia? (Select all that apply)',
    difficulty: 'Hard',
    rationale: 'Severe preeclampsia is characterized by blood pressure >= 160/110 mmHg, severe persistent frontal headache, visual disturbances (scotomata, blurred vision), epigastric or right upper quadrant pain (indicating hepatic involvement), and deep tendon hyperreflexia with clonus.',
    options: [
      { id: 'a', text: 'Blood pressure of 168/112 mmHg on two readings', isCorrect: true },
      { id: 'b', text: 'Persistent frontal headache unrelieved by acetaminophen', isCorrect: true },
      { id: 'c', text: 'Epigastric pain and right upper quadrant tenderness', isCorrect: true },
      { id: 'd', text: 'Visual scotomata (spots in visual field)', isCorrect: true },
      { id: 'e', text: 'Generalized hypoactive tendon reflexes (1+)', isCorrect: false },
      { id: 'f', text: 'Glycosuria 4+ on urine dipstick', isCorrect: false }
    ],
    tags: ['Preeclampsia', 'High-Risk Pregnancy', 'Maternal']
  },
  {
    id: 'ob-3',
    examMode: 'NCK',
    unitDomain: 'Maternal & Newborn Health',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Dosage Calculation',
    questionStem: 'Postpartum order: Oxytocin 20 units diluted in 1,000 mL Normal Saline IV to prevent postpartum hemorrhage. The provider orders the infusion to run at 2 milliunits/min. Calculate the pump setting in mL/hour.',
    difficulty: 'Hard',
    numericValue: 6,
    unitOfMeasure: 'mL/hr',
    tolerance: 0,
    calculationSteps: '20 units = 20,000 milliunits in 1,000 mL -> Concentration = 20,000 mU / 1,000 mL = 20 mU/mL. Desired rate = 2 mU/min = 120 mU/hr. Rate in mL/hr = 120 mU/hr ÷ 20 mU/mL = 6 mL/hr.',
    rationale: '20 Units = 20,000 milliUnits. Concentration = 20,000 mU / 1,000 mL = 20 mU/mL. Rate = (2 mU/min × 60 min/hr) / 20 mU/mL = 120 / 20 = 6 mL/hr.',
    tags: ['Obstetrics', 'Oxytocin', 'Dosage Math']
  },
  {
    id: 'ob-4',
    examMode: 'NCK',
    unitDomain: 'Maternal & Newborn Health',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'Sequence the immediate nursing actions in correct chronological order following the vaginal birth of a term newborn.',
    difficulty: 'Medium',
    orderedSteps: [
      'Suction the newborn\'s mouth first, then the nose using a bulb syringe',
      'Thoroughly dry the infant and discard wet linens to prevent heat loss',
      'Place the newborn skin-to-skin on the mother\'s chest',
      'Assign the 1-minute APGAR score'
    ],
    rationale: 'Airway clearance (mouth then nose) is paramount immediately upon delivery. Thermal regulation (drying) prevents cold stress. Skin-to-skin contact promotes bonding and stabilization. APGAR assessment occurs at 1 and 5 minutes post-birth.',
    tags: ['Newborn Care', 'APGAR', 'Delivery']
  },
  {
    id: 'ob-5',
    examMode: 'NCK',
    unitDomain: 'Maternal & Newborn Health',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: Rho(D) immune globulin (RhoGAM) must be administered to an Rh-negative mother within 72 hours after delivery if the newborn is determined to be Rh-positive.',
    difficulty: 'Easy',
    trueFalseAnswer: true,
    rationale: 'True. RhoGAM prevents isoimmunization in Rh-negative mothers by neutralizing fetal Rh-positive red blood cells entering maternal circulation, protecting future pregnancies from hemolytic disease of the newborn.',
    tags: ['Rh Isoimmunization', 'Postpartum', 'RhoGAM']
  },

  // ==========================================
  // UNIT 3: Pediatric Nursing
  // ==========================================
  {
    id: 'peds-1',
    examMode: 'NCLEX',
    unitDomain: 'Pediatric Nursing',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'A 2-year-old child diagnosed with acute laryngotracheobronchitis (croup) is admitted to the pediatric unit. Which assessment finding requires immediate notification of the healthcare provider?',
    difficulty: 'Medium',
    rationale: 'Inspiratory stridor at rest, severe intercostal retractions, and nasal flaring signal impending respiratory muscle fatigue and severe airway compromise, requiring urgent epinephrine nebulization or airway management.',
    options: [
      { id: 'a', text: 'Barking cough occurring during crying', isCorrect: false },
      { id: 'b', text: 'Inspiratory stridor heard at rest with nasal flaring', isCorrect: true },
      { id: 'c', text: 'Low-grade temperature of 38.1°C (100.6°F)', isCorrect: false },
      { id: 'd', text: 'Preference to be held sitting upright by parent', isCorrect: false }
    ],
    tags: ['Pediatrics', 'Respiratory', 'Croup']
  },
  {
    id: 'peds-2',
    examMode: 'NCLEX',
    unitDomain: 'Pediatric Nursing',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'A nurse is caring for a 6-year-old child admitted with a vaso-occlusive sickle cell crisis. Which nursing interventions should be included in the child\'s plan of care? (Select all that apply)',
    difficulty: 'Medium',
    rationale: 'Key crisis management includes aggressive IV hydration (dilutes sickled cells), opioid analgesia for severe pain, warm compresses on joints (cold causes vasoconstriction and worsens sickling), and rest. Cold packs are strictly contraindicated.',
    options: [
      { id: 'a', text: 'Administer intravenous hydration at 1.5 times maintenance rate', isCorrect: true },
      { id: 'b', text: 'Apply cold ice packs directly to painful swollen joints', isCorrect: false },
      { id: 'c', text: 'Administer scheduled IV morphine or acetaminophen as prescribed', isCorrect: true },
      { id: 'd', text: 'Apply warm blankets and warm moist compresses to extremities', isCorrect: true },
      { id: 'e', text: 'Encourage high-impact strenuous exercise to improve circulation', isCorrect: false },
      { id: 'f', text: 'Provide humidified supplemental oxygen if SpO2 drops below 92%', isCorrect: true }
    ],
    tags: ['Sickle Cell', 'Pediatrics', 'Pain Management']
  },
  {
    id: 'peds-3',
    examMode: 'NCLEX',
    unitDomain: 'Pediatric Nursing',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Dosage Calculation',
    questionStem: 'A pediatric client weighing 15 kg is prescribed oral Acetaminophen 15 mg/kg per dose. The oral suspension available is labeled 160 mg / 5 mL. Calculate the single dose volume to be administered in mL.',
    difficulty: 'Easy',
    numericValue: 7,
    unitOfMeasure: 'mL',
    tolerance: 0.1,
    calculationSteps: 'Total dose = 15 kg × 15 mg/kg = 225 mg. Volume in mL = (225 mg / 160 mg) × 5 mL = 1.40625 × 5 = 7.03 mL (round to 7.0 mL).',
    rationale: 'Total Dose = 15 kg × 15 mg/kg = 225 mg. Dose (mL) = (225 mg ÷ 160 mg) × 5 mL = 7.03 mL -> 7.0 mL.',
    tags: ['Pediatrics', 'Dosage Math', 'Pharmacology']
  },
  {
    id: 'peds-4',
    examMode: 'NCLEX',
    unitDomain: 'Pediatric Nursing',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'Place the steps for administering oral liquid medication via syringe to an uncooperative 10-month-old infant in the correct sequence.',
    difficulty: 'Medium',
    orderedSteps: [
      'Position the infant in a semi-upright, elevated sitting position',
      'Place the syringe tip into the side of the mouth along the cheek/tongue',
      'Depress the syringe plunger slowly in small increments',
      'Allow the infant time to swallow between small squirts'
    ],
    rationale: 'Semi-upright positioning prevents aspiration. Inserting into the cheek pocket prevents spraying back out or pushing into the larynx. Slow administration ensures safe swallowing without choking.',
    tags: ['Pediatrics', 'Medication Administration', 'Infant Care']
  },
  {
    id: 'peds-5',
    examMode: 'NCLEX',
    unitDomain: 'Pediatric Nursing',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: Squatting or placing a child in the knee-to-chest position during a hypercyanotic ("tet") spell in Tetralogy of Fallot decreases systemic vascular resistance and reduces pulmonary blood flow.',
    difficulty: 'Medium',
    trueFalseAnswer: false,
    rationale: 'False. Squatting INCREASES systemic vascular resistance (SVR) by compressing femoral arteries. Higher SVR reduces right-to-left shunting across the VSD, directing more unoxygenated blood through the pulmonary artery to the lungs.',
    tags: ['Pediatrics', 'Congenital Heart Disease', 'Tetralogy of Fallot']
  },

  // ==========================================
  // UNIT 4: Pharmacology & Parenteral Therapies
  // ==========================================
  {
    id: 'pharm-1',
    examMode: 'NCLEX',
    unitDomain: 'Pharmacology & Parenteral Therapies',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'A client taking oral digoxin 0.25 mg daily reports loss of appetite, nausea, and seeing yellowish-green halos around light fixtures. Laboratory results reveal serum digoxin level 2.8 ng/mL and serum potassium 3.2 mEq/L. Which action should the nurse take first?',
    difficulty: 'Hard',
    rationale: 'A digoxin level > 2.0 ng/mL along with visual halos and GI symptoms confirms digoxin toxicity. Hypokalemia (K+ < 3.5 mEq/L) potentiates toxicity. The nurse must withhold the dose immediately and notify the provider.',
    options: [
      { id: 'a', text: 'Administer the morning digoxin dose with an antacid', isCorrect: false },
      { id: 'b', text: 'Hold digoxin dose and notify the provider immediately', isCorrect: true },
      { id: 'c', text: 'Encourage the client to drink 1 liter of orange juice', isCorrect: false },
      { id: 'd', text: 'Administer intravenous furosemide 40 mg', isCorrect: false }
    ],
    tags: ['Digoxin', 'Pharmacology', 'Toxicity']
  },
  {
    id: 'pharm-2',
    examMode: 'NCLEX',
    unitDomain: 'Pharmacology & Parenteral Therapies',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'A nurse is providing discharge instructions to a client who is newly prescribed Warfarin for atrial fibrillation. Which teaching points must be emphasized? (Select all that apply)',
    difficulty: 'Medium',
    rationale: 'Clients on warfarin must maintain consistent (not eliminated or surging) intake of vitamin K, report bleeding/bruising, avoid NSAIDs/aspirin due to antiplatelet synergism, use soft toothbrushes, and undergo routine INR monitoring.',
    options: [
      { id: 'a', text: 'Maintain a consistent daily intake of green leafy vegetables', isCorrect: true },
      { id: 'b', text: 'Completely eliminate all foods containing Vitamin K from diet', isCorrect: false },
      { id: 'c', text: 'Avoid taking aspirin or ibuprofen without consulting provider', isCorrect: true },
      { id: 'd', text: 'Use a soft-bristled toothbrush and electric razor', isCorrect: true },
      { id: 'e', text: 'Report black tarry stools or unexpected bruising immediately', isCorrect: true },
      { id: 'f', text: 'Take double doses if a routine evening dose is missed', isCorrect: false }
    ],
    tags: ['Anticoagulation', 'Warfarin', 'Patient Teaching']
  },
  {
    id: 'pharm-3',
    examMode: 'NCLEX',
    unitDomain: 'Pharmacology & Parenteral Therapies',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Dosage Calculation',
    questionStem: 'Order: Vancomycin 1,000 mg in 200 mL Normal Saline IV to infuse over 90 minutes. The IV tubing drop factor is 15 gtt/mL. Calculate the IV drip rate in drops/minute (gtt/min).',
    difficulty: 'Medium',
    numericValue: 33,
    unitOfMeasure: 'gtt/min',
    tolerance: 0,
    calculationSteps: 'Formula: gtt/min = (Volume mL × Drop Factor gtt/mL) / Time in minutes = (200 mL × 15 gtt/mL) / 90 min = 3,000 / 90 = 33.33 gtt/min -> 33 gtt/min.',
    rationale: 'gtt/min = (200 mL × 15 gtt/mL) / 90 minutes = 3000 / 90 = 33.33 -> round to 33 gtt/min.',
    tags: ['Pharmacology', 'IV Math', 'Drop Rate']
  },
  {
    id: 'pharm-4',
    examMode: 'NCLEX',
    unitDomain: 'Pharmacology & Parenteral Therapies',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'Sequence the essential nursing steps when preparing and initiating a unit of Packed Red Blood Cells (PRBCs) blood transfusion.',
    difficulty: 'Hard',
    orderedSteps: [
      'Confirm provider order and verify signed patient informed consent',
      'Dual-verify patient identity, blood unit number, and ABO/Rh compatibility with a second licensed nurse',
      'Obtain baseline complete set of vital signs immediately prior to spike',
      'Infuse slowly for the first 15 minutes while remaining at bedside to monitor for acute reactions'
    ],
    rationale: 'Consent verification must precede product retrieval. Dual licensed verification prevents fatal ABO incompatibility errors. Baseline vitals establish comparison for febrile/hemolytic reactions. Bedside presence during the first 15 mins catches immediate adverse events.',
    tags: ['Blood Transfusion', 'Safety', 'Parenteral']
  },
  {
    id: 'pharm-5',
    examMode: 'NCLEX',
    unitDomain: 'Pharmacology & Parenteral Therapies',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: Concentrated Intravenous Potassium Chloride (KCl) can be safely administered via direct IV push if diluted in 10 mL of normal saline flush.',
    difficulty: 'Easy',
    trueFalseAnswer: false,
    rationale: 'FALSE! IV potassium chloride must NEVER be administered via IV push, bolus, or undiluted. Direct IV push of potassium causes immediate fatal cardiac arrest. It must always be diluted in IV fluids and infused slowly via a pump.',
    tags: ['High-Alert Meds', 'Potassium', 'Safety']
  },

  // ==========================================
  // UNIT 5: Psychiatric & Mental Health
  // ==========================================
  {
    id: 'psych-1',
    examMode: 'HESI',
    unitDomain: 'Psychiatric & Mental Health',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'A client diagnosed with Paranoid Schizophrenia points to the wall and states, "The government radio transmitter inside that wall is broadcasting my personal thoughts to the city!" Which response by the nurse is most therapeutic?',
    difficulty: 'Medium',
    rationale: 'Therapeutic communication in psychosis validates the client\'s emotion/feeling without reinforcing or agreeing with the ungrounded delusion. Stating reality calmly maintains trust without arguing.',
    options: [
      { id: 'a', text: '"There are no radios in the wall; that is logically impossible."', isCorrect: false },
      { id: 'b', text: '"It must be frightening to feel like your thoughts are being exposed, but I do not hear any radio broadcasting."', isCorrect: true },
      { id: 'c', text: '"Who in the government do you think put the radio there?"', isCorrect: false },
      { id: 'd', text: '"Let us go outside right now so the walls cannot transmit your thoughts."', isCorrect: false }
    ],
    tags: ['Psychiatry', 'Schizophrenia', 'Therapeutic Communication']
  },
  {
    id: 'psych-2',
    examMode: 'HESI',
    unitDomain: 'Psychiatric & Mental Health',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'A client taking Haloperidol for acute psychosis develops high fever (40.2°C / 104.4°F), severe "lead-pipe" muscle rigidity, labile blood pressure, and altered mental status. Which clinical conditions or actions should the nurse anticipate? (Select all that apply)',
    difficulty: 'Hard',
    rationale: 'These symptoms characterize Neuroleptic Malignant Syndrome (NMS), a life-threatening reaction to antipsychotics. Immediate actions include discontinuing the antipsychotic, administering IV fluids, antipyretics, cooling blankets, and ICU transfer. Dantrolene or bromocriptine may be prescribed.',
    options: [
      { id: 'a', text: 'Immediate recognition of Neuroleptic Malignant Syndrome (NMS)', isCorrect: true },
      { id: 'b', text: 'Prompt discontinuation of Haloperidol administration', isCorrect: true },
      { id: 'c', text: 'Application of cooling blankets and antipyretics', isCorrect: true },
      { id: 'd', text: 'Administration of Dantrolene or Bromocriptine as prescribed', isCorrect: true },
      { id: 'e', text: 'Immediate doubling of Haloperidol dose to suppress fever', isCorrect: false },
      { id: 'f', text: 'Restricting all IV fluids to prevent cerebral edema', isCorrect: false }
    ],
    tags: ['NMS', 'Antipsychotics', 'Psychiatry']
  },
  {
    id: 'psych-3',
    examMode: 'HESI',
    unitDomain: 'Psychiatric & Mental Health',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Dosage Calculation',
    questionStem: 'Order: Haloperidol 5 mg IM stat for severe acute agitation. The drug supply multidose vial is labeled 5 mg/mL. Calculate the volume in mL to administer.',
    difficulty: 'Easy',
    numericValue: 1,
    unitOfMeasure: 'mL',
    tolerance: 0,
    calculationSteps: 'Volume = Desired / On Hand = 5 mg / 5 mg/mL = 1 mL.',
    rationale: '5 mg / (5 mg/mL) = 1 mL.',
    tags: ['Psychiatry', 'Dosage Math']
  },
  {
    id: 'psych-4',
    examMode: 'HESI',
    unitDomain: 'Psychiatric & Mental Health',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'Rank the nursing priorities in order for a client newly admitted following an explicit suicide gesture with passive ongoing suicidal ideation.',
    difficulty: 'Hard',
    orderedSteps: [
      'Initiate continuous 1-on-1 observation or 15-minute close line-of-sight monitoring',
      'Perform a thorough search of the client\'s room and personal belongings for dangerous items',
      'Establish a clear safety plan and verbal contract for safety with the client',
      'Encourage participation in structured mileu and psychoeducational therapy groups'
    ],
    rationale: 'Safety and suicide prevention take top priority (Maslow\'s safety). Environment searching removes physical means. Safety planning empowers coping. Group therapy follows once acute safety is secured.',
    tags: ['Suicide Prevention', 'Safety', 'Psychiatry']
  },
  {
    id: 'psych-5',
    examMode: 'HESI',
    unitDomain: 'Psychiatric & Mental Health',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: Lithium toxicity can be triggered by low sodium intake or dehydration because the kidneys reabsorb lithium in place of sodium when serum sodium levels drop.',
    difficulty: 'Medium',
    trueFalseAnswer: true,
    rationale: 'True. Lithium is a salt. When a client becomes hyponatremic or dehydrated, renal tubules increase sodium and lithium reabsorption, causing serum lithium levels to rapidly rise into toxic ranges (> 1.5 mEq/L).',
    tags: ['Lithium', 'Psychiatry', 'Toxicity']
  },

  // ==========================================
  // UNIT 6: Community & Public Health
  // ==========================================
  {
    id: 'community-1',
    examMode: 'NCK',
    unitDomain: 'Community & Public Health',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'A community health nurse conducts blood pressure and blood glucose screenings at a local civic center health fair. What level of prevention does this activity represent?',
    difficulty: 'Easy',
    rationale: 'Secondary prevention focuses on early detection, screening, and rapid diagnosis of disease in asymptomatic individuals to halt progression. Primary prevention prevents disease onset (e.g. vaccines). Tertiary limits disability.',
    options: [
      { id: 'a', text: 'Primary Prevention', isCorrect: false },
      { id: 'b', text: 'Secondary Prevention', isCorrect: true },
      { id: 'c', text: 'Tertiary Prevention', isCorrect: false },
      { id: 'd', text: 'Quaternary Prevention', isCorrect: false }
    ],
    tags: ['Public Health', 'Levels of Prevention', 'Screening']
  },
  {
    id: 'community-2',
    examMode: 'NCK',
    unitDomain: 'Community & Public Health',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'Which infectious diseases require Airborne Precautions (N95 respirator mask, negative pressure airborne infection isolation room)? (Select all that apply)',
    difficulty: 'Medium',
    rationale: 'Airborne precautions are indicated for pathogens spread via small droplet nuclei that remain suspended in air: Measles (Rubeola), Tuberculosis (TB), Varicella (Chickenpox), and Disseminated Zoster (mnemonic: "MTV").',
    options: [
      { id: 'a', text: 'Active Pulmonary Tuberculosis (TB)', isCorrect: true },
      { id: 'b', text: 'Measles (Rubeola)', isCorrect: true },
      { id: 'c', text: 'Varicella (Chickenpox)', isCorrect: true },
      { id: 'd', text: 'Influenza A', isCorrect: false },
      { id: 'e', text: 'Clostridioides difficile (C. diff)', isCorrect: false },
      { id: 'f', text: 'Disseminated Herpes Zoster', isCorrect: true }
    ],
    tags: ['Infection Control', 'Airborne Precautions', 'Public Health']
  },
  {
    id: 'community-3',
    examMode: 'NCK',
    unitDomain: 'Community & Public Health',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Epidemiology Calculation',
    questionStem: 'In a rural village population of 500 residents, a water contamination event results in 25 newly confirmed cases of cholera during a 1-week period. Calculate the incidence rate per 1,000 population.',
    difficulty: 'Medium',
    numericValue: 50,
    unitOfMeasure: 'per 1,000',
    tolerance: 0,
    calculationSteps: 'Incidence rate = (New Cases / Population at risk) × 1,000 = (25 / 500) × 1,000 = 0.05 × 1,000 = 50 per 1,000 population.',
    rationale: '(25 / 500) × 1000 = 50 per 1,000.',
    tags: ['Epidemiology', 'Public Health', 'Math']
  },
  {
    id: 'community-4',
    examMode: 'NCK',
    unitDomain: 'Community & Public Health',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'Place the primary steps of an epidemiological outbreak investigation in the correct sequential order.',
    difficulty: 'Hard',
    orderedSteps: [
      'Establish the existence of an epidemic or outbreak relative to baseline',
      'Verify and confirm the clinical diagnosis with laboratory testing',
      'Formulate a standardized case definition and construct a line listing',
      'Implement immediate community control and preventive measures'
    ],
    rationale: 'Epidemiology steps start with confirming an actual outbreak above baseline, diagnostic verification, defining cases, and rapidly enacting control protocols to halt disease spread.',
    tags: ['Epidemiology', 'Outbreak Response', 'Community']
  },
  {
    id: 'community-5',
    examMode: 'NCK',
    unitDomain: 'Community & Public Health',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: Administering routine childhood immunizations (such as MMR and Polio) at 12 months of age is an example of Primary Prevention.',
    difficulty: 'Easy',
    trueFalseAnswer: true,
    rationale: 'True. Primary prevention aims to prevent disease or injury before it occurs by enhancing resistance and eliminating risk factors.',
    tags: ['Prevention', 'Immunization', 'Public Health']
  },

  // ==========================================
  // UNIT 7: Nursing Fundamentals & Leadership
  // ==========================================
  {
    id: 'fund-1',
    examMode: 'GED',
    unitDomain: 'Nursing Fundamentals & Leadership',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'An immobilized client has a Stage 2 pressure injury over the sacrum. Which description best matches a Stage 2 pressure injury?',
    difficulty: 'Easy',
    rationale: 'Stage 2 pressure injuries involve partial-thickness skin loss with exposed dermis. The wound bed is viable, pink or red, moist, and may present as an intact or ruptured serum-filled blister.',
    options: [
      { id: 'a', text: 'Non-blanchable erythema of intact skin', isCorrect: false },
      { id: 'b', text: 'Partial-thickness skin loss with exposed pink, moist dermis', isCorrect: true },
      { id: 'c', text: 'Full-thickness skin loss with visible subcutaneous adipose tissue', isCorrect: false },
      { id: 'd', text: 'Full-thickness tissue loss with exposed muscle, tendon, or bone', isCorrect: false }
    ],
    tags: ['Pressure Injuries', 'Fundamentals', 'Wound Care']
  },
  {
    id: 'fund-2',
    examMode: 'GED',
    unitDomain: 'Nursing Fundamentals & Leadership',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'Which tasks can a Registered Nurse (RN) appropriately delegate to an experienced Unlicensed Assistive Personnel (UAP)? (Select all that apply)',
    difficulty: 'Medium',
    rationale: 'UAPs can perform routine standard tasks on stable clients: measuring vital signs, hygiene/baths, ambulation, and measuring intake/output. RNs CANNOT delegate Assessment, Teaching, Evaluation, or Medication administration (EAT rule).',
    options: [
      { id: 'a', text: 'Obtaining vital signs on a postoperative client who is clinically stable', isCorrect: true },
      { id: 'b', text: 'Assisting a stable client with hygiene and bed bath', isCorrect: true },
      { id: 'c', text: 'Teaching a client how to administer subcutaneous insulin injections', isCorrect: false },
      { id: 'd', text: 'Measuring and recording urine volume from a Foley urinary drainage bag', isCorrect: true },
      { id: 'e', text: 'Assessing swallowing ability prior to initial oral intake', isCorrect: false },
      { id: 'f', text: 'Ambulating a client who is 2 days post-cholecystectomy', isCorrect: true }
    ],
    tags: ['Delegation', 'Leadership', 'Scope of Practice']
  },
  {
    id: 'fund-3',
    examMode: 'GED',
    unitDomain: 'Nursing Fundamentals & Leadership',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Infusion Calculation',
    questionStem: 'Order: 1,000 mL Normal Saline 0.9% IV to infuse over 8 hours. Calculate the infusion rate in mL/hour.',
    difficulty: 'Easy',
    numericValue: 125,
    unitOfMeasure: 'mL/hr',
    tolerance: 0,
    calculationSteps: 'Rate = Total Volume / Total Time = 1,000 mL / 8 hours = 125 mL/hr.',
    rationale: '1000 mL / 8 hours = 125 mL/hr.',
    tags: ['IV Calculation', 'Fundamentals', 'Math']
  },
  {
    id: 'fund-4',
    examMode: 'GED',
    unitDomain: 'Nursing Fundamentals & Leadership',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'Sequence the proper steps for performing routine hand hygiene using soap and water.',
    difficulty: 'Easy',
    orderedSteps: [
      'Wet hands and wrists under warm running water',
      'Apply 3 to 5 mL of liquid soap to cover all hand surfaces',
      'Rub hands together vigorously for at least 20 seconds, lathers palms, backs, and between fingers',
      'Rinse hands thoroughly under running water and dry with clean single-use paper towel'
    ],
    rationale: 'Wetting before soap promotes lathering. Friction for >= 20 seconds mechanically destroys micro-organisms. Thorough rinsing and drying prevents skin breakdown.',
    tags: ['Infection Control', 'Hand Hygiene', 'Fundamentals']
  },
  {
    id: 'fund-5',
    examMode: 'GED',
    unitDomain: 'Nursing Fundamentals & Leadership',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: The ethical principle of "Non-maleficence" requires healthcare providers to act in the best interest of the patient and actively promote good.',
    difficulty: 'Easy',
    trueFalseAnswer: false,
    rationale: 'False. Promoting good and acting in the patient\'s best interest is BENEFICENCE. NON-MALEFICENCE is the duty to do no harm or inflict least possible harm.',
    tags: ['Ethics', 'Leadership', 'Principles']
  },

  // ==========================================
  // UNIT 8: Critical Care & Emergency Nursing
  // ==========================================
  {
    id: 'crit-1',
    examMode: 'NCLEX',
    unitDomain: 'Critical Care & Emergency Nursing',
    questionTypeId: 'single_choice',
    questionTypeLabel: 'Multiple Choice',
    questionStem: 'A trauma patient arrives at the Resuscitation Bay hypotensive (BP 72/42 mmHg), tachycardic (HR 138 bpm), with pale cool clammy skin following severe blunt abdominal trauma. Which initial intravenous resuscitation fluid is indicated?',
    difficulty: 'Medium',
    rationale: 'Isotonic crystalloids (0.9% Normal Saline or Lactated Ringer\'s) administered rapidly via large-bore IV lines expand intravascular volume in acute hypovolemic shock until blood products are available.',
    options: [
      { id: 'a', text: '0.45% Half-Normal Saline IV infusion', isCorrect: false },
      { id: 'b', text: '5% Dextrose in Water (D5W) IV bolus', isCorrect: false },
      { id: 'c', text: '0.9% Normal Saline rapid IV bolus', isCorrect: true },
      { id: 'd', text: '3% Hypertonic Saline slow IV infusion', isCorrect: false }
    ],
    tags: ['Critical Care', 'Shock', 'Trauma']
  },
  {
    id: 'crit-2',
    examMode: 'NCLEX',
    unitDomain: 'Critical Care & Emergency Nursing',
    questionTypeId: 'multiple_select',
    questionTypeLabel: 'Select All That Apply (SATA)',
    questionStem: 'A client in the Intensive Care Unit is suspected of progressing into Septic Shock. Which clinical indicators support this diagnosis? (Select all that apply)',
    difficulty: 'Hard',
    rationale: 'Septic shock is defined by persistent hypotension requiring vasopressors to maintain MAP >= 65 mmHg and serum lactate > 2 mmol/L despite fluid resuscitation, accompanied by oliguria (< 0.5 mL/kg/hr) and altered mental status.',
    options: [
      { id: 'a', text: 'Mean Arterial Pressure (MAP) < 65 mmHg despite IV fluid challenge', isCorrect: true },
      { id: 'b', text: 'Serum arterial blood lactate level > 2.0 mmol/L', isCorrect: true },
      { id: 'c', text: 'Urine output diminished below 0.5 mL/kg/hour (oliguria)', isCorrect: true },
      { id: 'd', text: 'Core body temperature 38.9°C (102°F) or hypothermia < 36°C', isCorrect: true },
      { id: 'e', text: 'Central venous pressure (CVP) > 18 mmHg', isCorrect: false },
      { id: 'f', text: 'Serum WBC count within normal limits (6,000/mm³)', isCorrect: false }
    ],
    tags: ['Sepsis', 'Critical Care', 'Hemodynamics']
  },
  {
    id: 'crit-3',
    examMode: 'NCLEX',
    unitDomain: 'Critical Care & Emergency Nursing',
    questionTypeId: 'numeric',
    questionTypeLabel: 'Emergency Drug Calculation',
    questionStem: 'During cardiac arrest resuscitation (ACL protocol), Epinephrine 1 mg IV push is ordered every 3 minutes. The prefilled syringe concentration is Epinephrine 0.1 mg/mL (1:10,000 solution). Calculate the volume in mL to administer per dose.',
    difficulty: 'Easy',
    numericValue: 10,
    unitOfMeasure: 'mL',
    tolerance: 0,
    calculationSteps: 'Volume = Desired / Concentration = 1 mg / (0.1 mg/mL) = 10 mL.',
    rationale: '1 mg / 0.1 mg/mL = 10 mL.',
    tags: ['ACLS', 'Emergency', 'Math']
  },
  {
    id: 'crit-4',
    examMode: 'NCLEX',
    unitDomain: 'Critical Care & Emergency Nursing',
    questionTypeId: 'order_drag',
    questionTypeLabel: 'Prioritization / Sequencing',
    questionStem: 'Sequence the primary trauma survey protocol steps (ABCDE protocol) for a multi-trauma victim upon arrival in the Emergency Department.',
    difficulty: 'Hard',
    orderedSteps: [
      'Airway assessment and maintenance with cervical spine stabilization',
      'Breathing and ventilation assessment (inspect chest expansion, auscultate breath sounds)',
      'Circulation assessment with hemorrhage control and large-bore IV access',
      'Disability assessment (neurological status via AVPU or Glasgow Coma Scale)'
    ],
    rationale: 'The Primary Trauma Survey strictly follows Airway (A), Breathing (B), Circulation (C), Disability (D), and Exposure (E). Airway with C-spine control always takes precedence.',
    tags: ['Trauma', 'Triage', 'Emergency']
  },
  {
    id: 'crit-5',
    examMode: 'NCLEX',
    unitDomain: 'Critical Care & Emergency Nursing',
    questionTypeId: 'true_false',
    questionTypeLabel: 'True or False',
    questionStem: 'True or False: Electrical defibrillation is indicated for both Ventricular Fibrillation (V-Fib) and Pulseless Electrical Activity (PEA) during cardiac arrest.',
    difficulty: 'Medium',
    trueFalseAnswer: false,
    rationale: 'FALSE! Defibrillation is indicated ONLY for shockable rhythms: Ventricular Fibrillation (V-Fib) and Pulseless Ventricular Tachycardia (V-Tach). PEA and Asystole are non-shockable rhythms treated with high-quality CPR and Epinephrine.',
    tags: ['ACLS', 'Defibrillation', 'Cardiology']
  }
];
