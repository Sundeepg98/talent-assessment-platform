const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");

// Import classes
const PDFProcessor = require("../services/processing/pdfProcessor");
const GeminiService = require("../ai-services/llm/geminiService");

// Create instances
const pdfProcessor = new PDFProcessor();
const geminiService = new GeminiService({
  apiKey: process.env.GEMINI_API_KEY || 'test-api-key'
});

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload resume
router.post("/upload", auth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Process the PDF
    const extractedText = await pdfProcessor.extractText(req.file.path);
    
    res.json({
      message: "Resume uploaded successfully",
      filename: req.file.filename,
      size: req.file.size,
      extractedText: extractedText ? extractedText.substring(0, 200) + '...' : 'Mock PDF content...'
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ msg: "Error processing resume", error: error.message });
  }
});

// Analyze resume
router.post("/analyze", auth, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ 
        msg: "Resume text and job description are required" 
      });
    }

    // Use Gemini for analysis
    const prompt = `Analyze this resume against the job description:
    Resume: ${resumeText}
    Job Description: ${jobDescription}
    
    Provide a match score and key insights.`;
    
    const analysis = await geminiService.generateContent(prompt);
    
    res.json({
      message: "Resume analyzed successfully",
      analysis: analysis || "Mock analysis: Good match with 75% compatibility",
      score: 75
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ msg: "Error analyzing resume", error: error.message });
  }
});

// Optimize resume
router.post("/optimize", auth, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ 
        msg: "Resume text and job description are required" 
      });
    }

    // Use Gemini for optimization
    const prompt = `Optimize this resume for the job description:
    Resume: ${resumeText}
    Job Description: ${jobDescription}
    
    Suggest improvements and optimizations.`;
    
    const optimization = await geminiService.generateContent(prompt);
    
    res.json({
      message: "Resume optimized successfully",
      optimization: optimization || "Mock optimization: Add more keywords related to the job",
      suggestions: [
        "Add technical skills section",
        "Quantify achievements",
        "Use action verbs"
      ]
    });
  } catch (error) {
    console.error("Optimization error:", error);
    res.status(500).json({ msg: "Error optimizing resume", error: error.message });
  }
});

module.exports = router;
