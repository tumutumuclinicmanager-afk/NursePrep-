export type ExamMode = string;
export type QuestionDomain = string;

export type QuestionTypeId = 
  | 'single_choice'
  | 'multiple_select'
  | 'true_false'
  | 'numeric'
  | 'image_based'
  | 'multiple_image'
  | 'matching'
  | 'essay'
  | 'short_answer'
  | 'fill_blank'
  | 'hotspot'
  | 'order_numbers'
  | 'order_drag'
  | 'sieve_bowtie'
  | 'matrix_grid'
  | 'case_exhibit'
  | string;

export interface QuestionTypeDefinition {
  id: QuestionTypeId;
  label: string;
  description: string;
  category: 'Standard' | 'Image & Media' | 'Interactive & Ordering' | 'NGN Next-Gen' | 'Custom';
  isCustom?: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface MatchingPair {
  id: string;
  term: string;
  match: string;
}

export interface BowtieMatrixConfig {
  actionsToTake: { text: string; isCorrect: boolean }[];
  potentialConditions: { text: string; isCorrect: boolean }[];
  parametersToMonitor: { text: string; isCorrect: boolean }[];
}

export interface MatrixRow {
  id: string;
  statement: string;
  // Map column index or header to true/false boolean or selected column id
  correctColumnIndex?: number; // for single select per row
  correctColumnIndices?: number[]; // for multi-select per row
}

export interface CaseExhibitTab {
  id: string;
  title: string; // e.g., "Nurses' Notes", "Vital Signs", "Lab Results", "History & Physical"
  content: string;
}

export interface QuestionData {
  id?: string;
  examMode: string;
  unitDomain: string;
  questionTypeId: QuestionTypeId;
  questionTypeLabel: string;
  questionStem: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rationale: string;
  citation?: string;
  tags?: string[];
  createdAt?: string;
  createdBy?: string;

  // Specific feedback
  correctExplanation?: string;
  wrongExplanation?: string;

  // Parameters depending on question type
  options?: QuestionOption[];
  partialCreditRule?: string;
  trueFalseAnswer?: boolean;
  
  // Numeric response parameters
  numericValue?: number;
  tolerance?: number;
  unitOfMeasure?: string;
  calculationSteps?: string;

  // Image parameters
  imageUrl?: string;
  imageCaption?: string;

  // Matching
  matchingPairs?: MatchingPair[];

  // Essay & Short Answer
  idealAnswer?: string;
  gradingRubric?: string;
  maxWordCount?: number;
  acceptedKeywords?: string[];
  caseSensitive?: boolean;

  // Fill in the blank
  blankAnswers?: { blankIndex: number; acceptedValues: string[] }[];

  // Hotspot
  hotspotImageUrl?: string;
  hotspotTargetDescription?: string;

  // Ordering
  orderedSteps?: string[];

  // Sieve / Bowtie NGN
  caseStudyScenario?: string;
  bowtieConfig?: BowtieMatrixConfig;

  // Matrix Grid NGN
  matrixColumns?: string[]; // e.g. ["Indicated", "Not Indicated", "Nonessential"]
  matrixRows?: MatrixRow[];

  // Case Exhibit NGN
  exhibitTabs?: CaseExhibitTab[];

  // Custom parameters
  customParameters?: Record<string, any>;
}
