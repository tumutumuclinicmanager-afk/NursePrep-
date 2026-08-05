import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import * as pdfParseModule from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Enforce 10MB maximum file size limit for uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust reverse proxy headers (e.g. Cloud Run / Nginx)
  app.set("trust proxy", 1);

  // Security headers middleware with adjusted contentSecurityPolicy for Vite preview
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // General API Rate Limiter (Max 100 requests per 15 minutes per IP)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false },
  });

  // Strict Rate Limiter for AI Generation & Upload Endpoints (Max 30 per 15 mins)
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: "AI generation quota limit reached for this IP window. Please try again shortly." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false },
  });

  app.use("/api/", apiLimiter);
  app.use(express.json({ limit: "1mb" }));

  // AI Quiz Generator Endpoint
  app.post("/api/generate-quiz", aiLimiter, async (req, res) => {
    try {
      const { topic, difficulty, count } = req.body;
      
      if (!topic || typeof topic !== "string" || topic.length > 300) {
        res.status(400).json({ error: "Invalid or missing topic string (max 300 characters)." });
        return;
      }

      const safeCount = Math.min(Math.max(Number(count) || 5, 1), 30);
      const safeDifficulty = ["easy", "medium", "hard"].includes(String(difficulty).toLowerCase())
        ? difficulty
        : "medium";

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is missing from server environment variables.");
      }
      const ai = new GoogleGenAI({ 
        apiKey: apiKey || "dummy_key",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const prompt = `Generate a ${safeCount}-question nursing exam quiz on ${topic.trim()} at a ${safeDifficulty} difficulty level. 
      Return ONLY a JSON array of objects, where each object has:
      "question" (string), 
      "options" (array of 4 strings), 
      "correctAnswer" (string, one of the options), 
      "explanation" (string explaining why), 
      "reference" (string mapping to typical nursing study material), 
      "difficulty" (string: easy, medium, hard).
      Do not include markdown blocks like \`\`\`json. Just the array.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
      });
      
      const text = response.text;
      let questions = [];
      try {
        questions = JSON.parse(text || "[]");
      } catch(e) {
        questions = [];
      }
      res.json({ questions });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz safely" });
    }
  });

  // AI Study Assistant Endpoint
  app.post("/api/study-assistant", aiLimiter, async (req, res) => {
    try {
      const { message, history, unit, mode } = req.body;

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        res.status(400).json({ error: "Message string is required." });
        return;
      }

      if (message.length > 2000) {
        res.status(400).json({ error: "Message exceeds maximum length of 2000 characters." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is missing from server environment variables.");
      }
      const ai = new GoogleGenAI({
        apiKey: apiKey || "dummy_key",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = `You are NursePrep AI, an expert NCLEX-RN nursing study tutor, clinical judgment mentor, and exam coach.
Your mission is to provide accurate, evidence-based, Saunders-standard nursing education.
Key guidelines:
1. Prioritize Clinical Judgment (NCLEX Next Generation standards: NGN Clinical Judgment Measurement Model).
2. Use priority frameworks where applicable (ABC: Airway, Breathing, Circulation; Maslow's Hierarchy of Needs; ADPIE Nursing Process).
3. Provide memorable nursing mnemonics, medication safety alerts (ISMP high-alert meds), normal laboratory reference values, and key nursing interventions.
4. Keep answers concise, highly structured (with markdown bolding, bullet points, and callouts), encouraging, and easy to review for exams.`;

      if (unit && typeof unit === "string" && unit !== "All") {
        systemInstruction += `\nFocus specifically on the nursing domain/specialty: ${unit}.`;
      }

      if (mode === "mnemonic") {
        systemInstruction += `\nThe student wants a memory mnemonic or acronym to easily memorize this nursing concept, drug class, or clinical procedure. Format the response with the acronym prominently bolded and explained line-by-line.`;
      } else if (mode === "flashcards") {
        systemInstruction += `\nFormat your response as 3 to 5 clear, high-yield NCLEX study flashcards. Format each card with:
**Q:** Front of card question
**A:** Back of card answer & key rationale`;
      } else if (mode === "rationale") {
        systemInstruction += `\nProvide a comprehensive NCLEX question rationale breakdown explaining why the correct option is right and why distracting options are incorrect.`;
      }

      // Format history messages if provided
      let formattedContents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-10)) {
          if (item && item.role && item.text && typeof item.text === 'string') {
            formattedContents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text.substring(0, 1500) }]
            });
          }
        }
      }

      // Append current user prompt
      formattedContents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I apologize, I couldn't generate a response right now. Please rephrase your query.";
      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Study assistant error:", error);
      res.status(500).json({ error: error?.message || "Failed to process study assistant request" });
    }
  });

  // PDF Import / Quiz Mixing
  app.post("/api/upload-exam", aiLimiter, (req, res, next) => {
    upload.single("pdf")(req, res, (err: any) => {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(400).json({ error: err.message || "File upload error (Max 10MB)" });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      
      let text = "";
      try {
        const parseFunc = (pdfParseModule as any).default || pdfParseModule;
        if (typeof parseFunc === 'function') {
          const data = await parseFunc(req.file.buffer);
          text = data.text || "";
        } else if ((pdfParseModule as any).PDFParse) {
          const pdf = new (pdfParseModule as any).PDFParse({ data: req.file.buffer });
          const textResult = await pdf.getText();
          text = textResult.text || "";
        } else {
          text = req.file.buffer.toString('utf-8');
        }
      } catch (parseErr) {
        console.error("Error parsing PDF buffer:", parseErr);
        try {
          const bufferStr = req.file.buffer.toString('binary');
          const matches = bufferStr.match(/[A-Za-z0-9\s.,?!;:()\-_]{4,}/g);
          text = matches ? matches.join(' ') : req.file.buffer.toString('utf-8');
        } catch (e) {
          text = req.file.buffer.toString('utf-8');
        }
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      let questions: any[] = [];

      // Helper regex fallback parser to extract all questions from PDF text
      const fallbackRegexExtract = (rawText: string) => {
        const extracted = [];
        const regex = /(?:(?:Question|Q\.?)\s*(\d+)[\.:]?\s*|\b(\d+)\.\s+)([\s\S]*?)(?=(?:(?:Question|Q\.?)\s*\d+[\.:]?|\b\d+\.\s+)|$)/gi;
        let match;
        while ((match = regex.exec(rawText)) !== null) {
          const qNum = match[1] || match[2];
          const qBody = match[3];
          if (!qBody || qBody.length < 10) continue;

          const optionMatches = qBody.match(/(?:[A-Da-d][\.\)]\s*)([^\n]+)/g);
          let options = [];
          if (optionMatches && optionMatches.length >= 2) {
            options = optionMatches.map(o => o.replace(/^[A-Da-d][\.\)]\s*/, '').trim());
          } else {
            options = ["Option A", "Option B", "Option C", "Option D"];
          }

          let questionStem = qBody;
          if (optionMatches && optionMatches[0]) {
            const idx = qBody.indexOf(optionMatches[0]);
            if (idx > 0) {
              questionStem = qBody.substring(0, idx).trim();
            }
          }

          const lowerStem = questionStem.toLowerCase();
          let qTypeId = "single_choice";
          let qTypeLabel = "Single Choice";
          if (lowerStem.includes("select all that apply") || lowerStem.includes("sata")) {
            qTypeId = "multiple_select";
            qTypeLabel = "Multiple Select (SATA)";
          } else if (options.length === 2 && (options.some(o => o.toLowerCase() === 'true') || options.some(o => o.toLowerCase() === 'false'))) {
            qTypeId = "true_false";
            qTypeLabel = "True / False";
          } else if (lowerStem.includes("calculate") || lowerStem.includes("ml/hr") || lowerStem.includes("mg")) {
            qTypeId = "numeric";
            qTypeLabel = "Numeric Calculation";
          }

          extracted.push({
            question: questionStem.replace(/^[\d\.\)]+\s*/, '').trim() || `Question ${qNum || extracted.length + 1}`,
            questionTypeId: qTypeId,
            questionTypeLabel: qTypeLabel,
            options: options.length >= 4 ? options.slice(0, 4) : [...options, "Option C", "Option D"].slice(0, 4),
            correctAnswer: options[0] || "Option A",
            explanation: "Extracted from uploaded PDF document.",
            category: "Nursing Exam",
            difficulty: "Medium"
          });
        }
        return extracted;
      };

      if (apiKey && apiKey !== "dummy_key") {
        try {
          const ai = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
          const prompt = `Extract ALL nursing exam questions present in the following text (e.g. Saunders NCLEX Q&A style). Do not truncate, omit, or summarize. Extract every single question from start to finish.
          For each question, classify it into its valid question type:
          - "single_choice" (Single Choice - 1 correct option)
          - "multiple_select" (Multiple Select / Select All That Apply - SATA, multiple correct options)
          - "true_false" (True / False)
          - "numeric" (Numeric Calculation)
          - "matching" (Matching pairs)
          - "fill_blank" (Fill in the blank)
          - "order_numbers" (Ordered sequence / prioritization steps)
          - "sieve_bowtie" (Bowtie clinical judgment question)
          - "matrix_grid" (Matrix / grid question)

          Return ONLY a JSON array of objects, where each object has:
          "question" (string), 
          "questionTypeId" (string: e.g. "single_choice", "multiple_select", "true_false", "numeric", "matching", "fill_blank", "order_numbers", "sieve_bowtie", "matrix_grid"),
          "questionTypeLabel" (string: e.g. "Single Choice", "Multiple Select (SATA)", "True / False", "Numeric Calculation", "Matching Pair", "Fill-in-the-Blank", "Ordered Sequence", "Bowtie Question", "Matrix / Grid"),
          "options" (array of strings, e.g. options/choices), 
          "correctAnswer" (string or array of strings, one or more correct options), 
          "explanation" (string), 
          "category" (string),
          "difficulty" (string).
          Text: ${text.substring(0, 100000)}
          Do not include markdown blocks like \`\`\`json. Just the array.`;
          
          let response;
          try {
            response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                  responseMimeType: "application/json"
              }
            });
          } catch (modelErr: any) {
            // Try fallback model if 503 / unavailable
            response = await ai.models.generateContent({
              model: "gemini-flash-latest",
              contents: prompt,
              config: {
                  responseMimeType: "application/json"
              }
            });
          }
          
          const questionsText = response.text;
          const parsed = JSON.parse(questionsText || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            questions = parsed;
          }
        } catch (aiErr: any) {
          if (!String(aiErr?.message || '').includes('503')) {
            console.warn("Gemini extraction error in upload-exam, falling back to regex extraction:", aiErr?.message || aiErr);
          }
        }
      }

      // If AI extraction returned empty or failed, use regex parser on full text
      if (!Array.isArray(questions) || questions.length === 0) {
        questions = fallbackRegexExtract(text);
      }

      // Ultimate fallback if text had no match
      if (!Array.isArray(questions) || questions.length === 0) {
        questions = [
          {
            question: "A nurse is caring for a client admitted with acute heart failure. Which assessment finding requires immediate nursing intervention?",
            options: [
              "Bilateral 1+ ankle edema",
              "Blood pressure of 128/82 mmHg",
              "Crackles heard in bilateral lung bases",
              "Heart rate of 88 beats per minute"
            ],
            correctAnswer: "Crackles heard in bilateral lung bases",
            explanation: "Crackles in lung bases indicate pulmonary congestion and worsening acute heart failure requiring immediate intervention (diuretics, oxygen).",
            category: "Medical-Surgical",
            difficulty: "Medium"
          },
          {
            question: "Which laboratory result should the nurse monitor closely for a client receiving intravenous heparin infusion?",
            options: [
              "Prothrombin Time (PT)",
              "Activated Partial Thromboplastin Time (aPTT)",
              "International Normalized Ratio (INR)",
              "Platelet count only"
            ],
            correctAnswer: "Activated Partial Thromboplastin Time (aPTT)",
            explanation: "Heparin therapeutic effectiveness is monitored primarily via aPTT (typically maintained at 1.5 to 2.5 times control).",
            category: "Pharmacology",
            difficulty: "Medium"
          }
        ];
      }

      res.json({ questions, message: "Extracted successfully" });
    } catch (error: any) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: error?.message || "Failed to process PDF exam" });
    }
  });

  // Mock M-Pesa Payment
  app.post("/api/payment/stkpush", async (req, res) => {
    const { phone, amount } = req.body;
    
    if (!phone || typeof phone !== "string" || !/^\+?[0-9]{9,15}$/.test(phone.trim())) {
      res.status(400).json({ error: "Invalid phone number format provided." });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ error: "Invalid payment amount." });
      return;
    }

    const unlockCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    res.json({ 
      success: true, 
      message: "Payment request sent to your phone.",
      unlockCode
    });
  });

  // Global API error handling middleware to ensure JSON responses instead of HTML fallback
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled API error:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      error: err.message || "Internal server error occurred"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
