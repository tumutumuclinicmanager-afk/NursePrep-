export interface ExtractedExamQuestion {
  question: string;
  questionTypeId: string;
  questionTypeLabel: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

/**
 * Detects whether a string is unparsed raw PDF binary bytecode
 * (e.g. object tokens like /StructElem, /Pg 16 0 R, endobj, obj, /Type)
 */
export function isRawPdfBytecode(str: string): boolean {
  if (!str || typeof str !== 'string') return true;
  const bytecodeMarkers = [
    /\/StructElem/i,
    /\/Type\s*\/[A-Za-z]+/i,
    /\bendobj\b/i,
    /\b\d+\s+\d+\s+obj\b/i,
    /\/Pg\s+\d+\s+\d+\s+R/i,
    /\/MediaBox/i,
    /\/Contents\s+\d+\s+\d+\s+R/i,
    /\/FlateDecode/i,
    /\/Parent\s+\d+\s+\d+\s+R/i,
    /\bstartxref\b/i,
    /\btrailer\b/i,
  ];

  let markerHits = 0;
  for (const marker of bytecodeMarkers) {
    if (marker.test(str)) {
      markerHits++;
    }
  }
  if (markerHits >= 2) return true;

  // Check ratio of PDF slash tokens (/S /P /Type /StructElem /K /P)
  const slashMatches = str.match(/\/[A-Za-z0-9]+/g) || [];
  const totalWords = str.split(/\s+/).filter(Boolean).length;
  if (slashMatches.length >= 6 && slashMatches.length / Math.max(1, totalWords) > 0.12) {
    return true;
  }

  return false;
}

/**
 * Extracts plain text strings from a PDF ArrayBuffer directly in the browser
 */
export async function extractTextFromPdfArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  // Step 1: Use legacy pdfjs-dist engine (works without external worker)
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    let fullText = '';
    const maxPages = Math.min(doc.numPages, 40);
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean)
        .join(' ')
        .trim();
      if (pageStrings.length > 0) {
        fullText += `\n--- Page ${pageNum} ---\n` + pageStrings;
      }
      page.cleanup();
    }
    const clean = fullText.trim();
    if (clean.length > 25 && !isRawPdfBytecode(clean)) {
      return clean;
    }
  } catch (pdfErr) {
    console.warn('Browser pdfjs-dist extraction notice:', pdfErr);
  }

  // Step 2: Extract Tj/TJ string operators from uncompressed stream data
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunk = 10000;
    for (let i = 0; i < Math.min(bytes.length, 500000); i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }

    const textPieces: string[] = [];

    // Match Tj string operators
    const tjRegex = /\(((?:\\\(|\\\)|[^()])*)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(binary)) !== null) {
      const decoded = match[1]
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\r/g, '\n')
        .replace(/\\n/g, '\n')
        .trim();
      if (decoded.length > 0 && !isRawPdfBytecode(decoded)) {
        textPieces.push(decoded);
      }
    }

    // Match TJ array operators
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(binary)) !== null) {
      const inner = match[1];
      const subMatches = inner.match(/\(((?:\\\(|\\\)|[^()])*)\)/g);
      if (subMatches && subMatches.length > 0) {
        const line = subMatches
          .map(m => m.slice(1, -1).replace(/\\([()\\])/g, '$1'))
          .join(' ')
          .trim();
        if (line.length > 0 && !isRawPdfBytecode(line)) {
          textPieces.push(line);
        }
      }
    }

    const candidate = textPieces.join('\n').trim();
    if (candidate.length > 30 && !isRawPdfBytecode(candidate)) {
      return candidate;
    }
  } catch (err) {
    console.error('Error extracting text from PDF ArrayBuffer:', err);
  }

  // Return empty string; NEVER return raw PDF bytecode
  return '';
}

/**
 * Intelligent parser that converts raw exam text into structured NCLEX questions
 */
export function parseExamQuestionsFromText(rawText: string, defaultFileName: string = 'Uploaded Exam'): ExtractedExamQuestion[] {
  if (!rawText || typeof rawText !== 'string' || isRawPdfBytecode(rawText)) {
    return createFallbackQuestions(defaultFileName);
  }

  // Clean and normalize linebreaks
  const clean = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Regex patterns to identify question boundaries
  // e.g. "1. ", "Question 1:", "Q.1", "1)", "Item 1"
  const qPattern = /(?:(?:Question|Q\.?|Item)\s*(\d+)[\.:\-]?\s*|(?:\n|^)\s*(\d+)[\.\)]\s+)/gi;

  const matches = [...clean.matchAll(qPattern)];
  const questionBlocks: { num: string; text: string }[] = [];

  if (matches.length >= 1) {
    for (let i = 0; i < matches.length; i++) {
      const startIdx = matches[i].index ?? 0;
      const endIdx = i + 1 < matches.length ? (matches[i + 1].index ?? clean.length) : clean.length;
      const block = clean.substring(startIdx, endIdx).trim();
      if (block.length > 15 && !isRawPdfBytecode(block)) {
        questionBlocks.push({
          num: matches[i][1] || matches[i][2] || String(i + 1),
          text: block
        });
      }
    }
  } else {
    // If no numbered pattern, split by double newlines or question marks
    const blocks = clean.split(/\n\s*\n/).filter(b => b.trim().length > 30 && !isRawPdfBytecode(b));
    for (let i = 0; i < blocks.length; i++) {
      questionBlocks.push({
        num: String(i + 1),
        text: blocks[i]
      });
    }
  }

  if (questionBlocks.length === 0) {
    return createFallbackQuestions(defaultFileName);
  }

  const results: ExtractedExamQuestion[] = [];

  for (const qBlock of questionBlocks) {
    let block = qBlock.text;

    // Reject any block with raw PDF tokens
    if (isRawPdfBytecode(block)) continue;

    // Clean leading question numbering
    block = block.replace(/^(?:(?:Question|Q\.?|Item)\s*\d+[\.:\-]?\s*|\d+[\.\)]\s*)/i, '').trim();

    // 1. Extract Answer Key if present
    let rawAnswer = '';
    const ansMatch = block.match(/(?:(?:Correct\s*)?Answer|Ans|Key)\s*[:\-]\s*([A-Ea-e1-5](?:\s*,\s*[A-Ea-e1-5])*|[^\n]+)/i);
    if (ansMatch) {
      rawAnswer = ansMatch[1].trim();
      block = block.replace(ansMatch[0], '').trim();
    }

    // 2. Extract Rationale / Explanation if present
    let explanation = '';
    const ratMatch = block.match(/(?:Rationale|Explanation|Reason)\s*[:\-]\s*([\s\S]+)$/i);
    if (ratMatch) {
      explanation = ratMatch[1].trim();
      block = block.substring(0, ratMatch.index ?? block.length).trim();
    }

    // 3. Extract Options
    // Check for A., B., C., D. or (A), (B)
    const optRegex = /(?:^|\n|\s{2,})(?:([A-Ea-e])[\.\)]|\(([A-Ea-e])\))\s+([^\n]+(?:\n(?!(?:[A-Ea-e][\.\)]|\([A-Ea-e]\))\s+)[^\n]+)*)/g;
    const optionMatches = [...block.matchAll(optRegex)];

    let options: { letter: string; text: string }[] = [];
    let stem = block;

    if (optionMatches.length >= 2) {
      const firstOptIndex = optionMatches[0].index ?? block.length;
      stem = block.substring(0, firstOptIndex).trim();
      options = optionMatches.map(m => {
        const letter = (m[1] || m[2] || '').toUpperCase();
        const text = (m[3] || '').trim();
        return { letter, text };
      });
    } else {
      // Inline options check: A. text B. text C. text D. text
      const inlineRegex = /(?:^|\s+)([A-Ea-e])[\.\)]\s*(.*?)(?=\s+[A-Ea-e][\.\)]|\s+(?:Answer|Ans|Rationale|Explanation|Key)|$)/gi;
      const inlineMatches = [...block.matchAll(inlineRegex)];
      if (inlineMatches.length >= 2) {
        stem = block.substring(0, inlineMatches[0].index ?? block.length).trim();
        options = inlineMatches.map(m => ({ letter: m[1].toUpperCase(), text: m[2].trim() }));
      }
    }

    // Determine finalized options & answer
    let finalOptions: string[] = [];
    let finalCorrectAnswer: string = '';

    if (options.length >= 2) {
      finalOptions = options.map(o => o.text);
      if (rawAnswer) {
        const matched = options.find(o => o.letter.toLowerCase() === rawAnswer.charAt(0).toLowerCase());
        finalCorrectAnswer = matched ? matched.text : rawAnswer;
      } else {
        finalCorrectAnswer = finalOptions[0];
      }
    } else {
      // Generic nursing assessment options if stem is standalone
      finalOptions = [
        'Assess airway patency and respiratory rate immediately',
        'Notify the primary healthcare provider of assessment findings',
        'Document the vital signs in the electronic medical record',
        'Administer scheduled oral maintenance medication'
      ];
      finalCorrectAnswer = finalOptions[0];
    }

    if (!explanation) {
      explanation = `Clinical assessment priority. Assess client status, ABCs (Airway, Breathing, Circulation), and ensure patient safety.`;
    }

    const lowerStem = stem.toLowerCase();
    let questionTypeId = 'single_choice';
    let questionTypeLabel = 'Single Choice';

    if (lowerStem.includes('select all that apply') || lowerStem.includes('sata') || rawAnswer.includes(',')) {
      questionTypeId = 'multiple_select';
      questionTypeLabel = 'Multiple Select (SATA)';
    } else if (finalOptions.length === 2 && (finalOptions.some(o => o.toLowerCase() === 'true') || finalOptions.some(o => o.toLowerCase() === 'false'))) {
      questionTypeId = 'true_false';
      questionTypeLabel = 'True / False';
    } else if (lowerStem.includes('calculate') || lowerStem.includes('ml/hr') || lowerStem.includes('mg/kg')) {
      questionTypeId = 'numeric';
      questionTypeLabel = 'Numeric Calculation';
    }

    const cleanStem = stem.replace(/\s+/g, ' ').trim();
    if (cleanStem.length >= 15 && !isRawPdfBytecode(cleanStem)) {
      results.push({
        question: cleanStem,
        questionTypeId,
        questionTypeLabel,
        options: finalOptions.slice(0, 5),
        correctAnswer: finalCorrectAnswer,
        explanation,
        category: 'Nursing Exam',
        difficulty: 'Medium'
      });
    }
  }

  return results.length > 0 ? results : createFallbackQuestions(defaultFileName);
}

/**
 * Fallback questions if an uploaded document is a scanned image or empty PDF
 */
function createFallbackQuestions(fileName: string): ExtractedExamQuestion[] {
  const cleanName = fileName.replace(/\.pdf$/i, '');
  return [
    {
      question: `Clinical Review Question 1 (${cleanName}): A nurse enters the room of an assigned client and observes acute respiratory distress with oxygen saturation dropping to 86%. What is the priority nursing action?`,
      questionTypeId: 'single_choice',
      questionTypeLabel: 'Single Choice',
      options: [
        'Apply supplemental oxygen and elevate head of the bed to high-Fowler position',
        'Leave the room to locate the attending physician immediately',
        'Administer a sedative to reduce the client anxiety level',
        'Document the baseline vital signs and re-evaluate in 30 minutes'
      ],
      correctAnswer: 'Apply supplemental oxygen and elevate head of the bed to high-Fowler position',
      explanation: 'Airway, Breathing, Circulation (ABCs) takes priority. Immediate positioning and oxygenation must be initiated before contacting the provider.',
      category: 'Medical-Surgical',
      difficulty: 'Medium'
    },
    {
      question: `Clinical Review Question 2 (${cleanName}): When administering high-alert intravenous medications, which nursing safeguard is most essential to prevent medication errors?`,
      questionTypeId: 'single_choice',
      questionTypeLabel: 'Single Choice',
      options: [
        'Conduct an independent double check with a second licensed nurse',
        'Administer the entire dose by rapid IV push over 5 seconds',
        'Rely on the client verbal verification of the medication dose',
        'Document the administration prior to infusing the medication'
      ],
      correctAnswer: 'Conduct an independent double check with a second licensed nurse',
      explanation: 'Independent double checking of high-alert medications (e.g. heparin, insulin) ensures calculation accuracy and prevents fatal errors.',
      category: 'Pharmacology',
      difficulty: 'Medium'
    },
    {
      question: `Clinical Review Question 3 (${cleanName}): A nurse is delegating care tasks for four stable clients. Which client care activity can be safely delegated to Unlicensed Assistive Personnel (UAP)?`,
      questionTypeId: 'single_choice',
      questionTypeLabel: 'Single Choice',
      options: [
        'Assisting a stable postoperative client with ambulation in the hallway',
        'Teaching a newly diagnosed diabetic client how to inject insulin',
        'Assessing breath sounds for a client reporting dyspnea',
        'Evaluating client pain response 30 minutes after IV morphine'
      ],
      correctAnswer: 'Assisting a stable postoperative client with ambulation in the hallway',
      explanation: 'The RN cannot delegate what you can E.A.T. (Evaluate, Assess, Teach). Routine ambulation of a stable client is within UAP scope of practice.',
      category: 'Management of Care',
      difficulty: 'Medium'
    }
  ];
}

/**
 * Universal dual-engine extractor:
 * 1. Attempts server-side extraction with timeout.
 * 2. If server returns 404, 500, or network fails, automatically runs client-side extraction.
 */
export async function extractExamQuestionsUniversal(file: File): Promise<{
  questions: ExtractedExamQuestion[];
  source: 'server' | 'client_pdf' | 'client_fallback';
}> {
  // Step 1: Try server extraction with 30-second timeout
  try {
    const formData = new FormData();
    formData.append('pdf', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('/api/upload-exam', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const cleanServerQuestions = data.questions.filter((q: ExtractedExamQuestion) => !isRawPdfBytecode(q?.question));
        if (cleanServerQuestions.length > 0) {
          return {
            questions: cleanServerQuestions,
            source: 'server'
          };
        }
      }
    }
  } catch (serverErr: any) {
    console.warn('Server-side PDF extraction endpoint unavailable or timed out, executing client-side extraction engine:', serverErr?.message || serverErr);
  }

  // Step 2: Client-side ArrayBuffer parsing with pdfjs
  try {
    const buffer = await file.arrayBuffer();
    const extractedText = await extractTextFromPdfArrayBuffer(buffer);
    if (extractedText && extractedText.trim().length > 20 && !isRawPdfBytecode(extractedText)) {
      const parsed = parseExamQuestionsFromText(extractedText, file.name);
      const cleanClientQuestions = parsed.filter(q => !isRawPdfBytecode(q.question));
      if (cleanClientQuestions.length > 0) {
        return {
          questions: cleanClientQuestions,
          source: 'client_pdf'
        };
      }
    }
  } catch (clientErr: any) {
    console.error('Client PDF buffer extraction error:', clientErr);
  }

  // Step 3: Reliable fallback questions based on filename
  return {
    questions: createFallbackQuestions(file.name),
    source: 'client_fallback'
  };
}
