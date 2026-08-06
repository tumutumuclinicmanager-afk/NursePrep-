import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DisplayQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  questionTypeLabel?: string;
}

export function normalizeQuestion(q: any): DisplayQuestion {
  if (!q) {
    return {
      id: '',
      question: 'Question details unavailable.',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'No clinical rationale specified.',
      questionTypeLabel: 'Single Choice'
    };
  }

  const question = q.question || q.questionStem || q.stem || 'Question text not available';
  const explanation = q.explanation || q.rationale || q.correctExplanation || 'No clinical rationale specified.';
  const questionTypeLabel = q.questionTypeLabel || (q.questionType === 'multiple_select' ? 'Multiple Select' : q.questionType === 'true_false' ? 'True / False' : q.questionType === 'numeric' ? 'Numeric' : 'Single Choice');

  let options: string[] = [];
  let correctAnswer = q.correctAnswer || '';

  if (Array.isArray(q.options)) {
    options = q.options.map((opt: any) => {
      if (typeof opt === 'string') return opt;
      if (typeof opt === 'object' && opt !== null) {
        if (opt.isCorrect && !correctAnswer) {
          correctAnswer = opt.text || '';
        }
        return opt.text || opt.label || String(opt);
      }
      return String(opt);
    });
  }

  if (!correctAnswer && options.length > 0) {
    correctAnswer = options[0];
  }

  return {
    id: q.id || String(Math.random()),
    question,
    options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer,
    explanation,
    questionTypeLabel
  };
}
