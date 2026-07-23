import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import * as pdfParseModule from "pdf-parse";
import { GoogleGenAI } from "@google/genai";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Quiz Generator Endpoint
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { topic, difficulty, count } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || "dummy_key";
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate a ${count}-question nursing exam quiz on ${topic} at a ${difficulty} difficulty level. 
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
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  // PDF Import / Quiz Mixing
  app.post("/api/upload-exam", upload.single("pdf"), async (req, res) => {
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
        text = req.file.buffer.toString('utf-8');
      }
      
      const apiKey = process.env.GEMINI_API_KEY || "dummy_key";
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Extract nursing exam questions from the following text. 
      Return ONLY a JSON array of objects, where each object has:
      "question" (string), 
      "options" (array of 4 strings), 
      "correctAnswer" (string, one of the options), 
      "explanation" (string), 
      "category" (string),
      "difficulty" (string).
      Text: ${text.substring(0, 10000)}...
      Do not include markdown blocks like \`\`\`json. Just the array.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
      });
      
      const questionsText = response.text;
      let questions = [];
      try {
        questions = JSON.parse(questionsText || "[]");
      } catch(e) {
        questions = [];
      }

      res.json({ questions, message: "Extracted successfully" });
    } catch (error) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  // Mock M-Pesa Payment
  app.post("/api/payment/stkpush", async (req, res) => {
    const { phone, amount, courseId } = req.body;
    const unlockCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    res.json({ 
      success: true, 
      message: "Payment request sent to your phone.",
      unlockCode
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
