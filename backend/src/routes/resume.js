const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");

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
    if (path.extname(file.originalname) !== ".pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  }
});

// POST /api/resume/upload - Process resume with 100% DI
router.post("/upload", auth, upload.single("resume"), async (req, res) => {
  try {
    // Get services from DI container
    const pdfProcessor = req.getService('pdfProcessor');
    const resumeMLService = req.getService('resumeMLService'); // ✅ NOW USES SELF-CONTAINED ML

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Process the PDF
    const extractedText = await pdfProcessor.extractText(req.file.path);

    // Analyze with Resume ML Service (3-Level Hybrid ML)
    const analysis = await resumeMLService.analyzeResume(extractedText);

    res.json({
      success: true,
      filename: req.file.filename,

      // Core analysis results
      score: analysis.score,
      rating: analysis.rating,

      // Level 1: NLTK Text Quality Metrics
      textQuality: analysis.textQuality,
      textQualityScore: analysis.textQualityScore,

      // Level 2: BERT Semantic Analysis
      semanticAnalysis: analysis.semanticAnalysis,

      // Level 3: Gemini LLM Feedback
      llmFeedback: analysis.llmFeedback,

      // Backward compatibility
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      skillsMatch: analysis.skillsMatch,
      recommendations: analysis.recommendations,
      similarity: analysis.similarity,

      // ML metadata
      mlModel: analysis.mlModel,
      hybridMlEnabled: analysis.hybridMlEnabled,
      geminiEnabled: analysis.geminiEnabled,

      // Additional info
      extractedText: extractedText.substring(0, 500) + "...", // Preview
      di: true,
      ml_powered: true // ✅ 3-Level Hybrid ML
    });
  } catch (error) {
    console.error("Resume processing error:", error);
    res.status(500).json({
      error: "Failed to process resume",
      details: error.message
    });
  }
});

// POST /api/resume/optimize - Optimize resume (accepts file OR resumeText)
router.post("/optimize", auth, upload.single("resume"), async (req, res) => {
  try {
    const pdfProcessor = req.getService('pdfProcessor');
    const resumeMLService = req.getService('resumeMLService'); // ✅ NOW USES SELF-CONTAINED ML

    let extractedText;
    let filename = null;

    // Support both file upload and direct text
    if (req.file) {
      // File upload mode
      extractedText = await pdfProcessor.extractText(req.file.path);
      filename = req.file.filename;
    } else if (req.body.resumeText) {
      // Direct text mode (for testing/API calls)
      extractedText = req.body.resumeText;
    } else {
      return res.status(400).json({ error: "No file uploaded or resumeText provided" });
    }

    const jobDescription = req.body.jobDescription || "";

    // Optimize with Resume ML Service (3-Level Hybrid ML)
    const optimization = await resumeMLService.optimizeResume(extractedText, jobDescription);

    res.json({
      success: true,
      filename,

      // Optimization suggestions
      optimizationSuggestions: optimization.optimization_suggestions || optimization.suggestions,
      missingSkills: optimization.missing_skills || optimization.missingSkills,
      similarityScore: optimization.similarity_score || optimization.similarity,
      improvements: optimization.improvements,

      // Full optimization data
      optimization,

      // Additional info
      extractedText: extractedText.substring(0, 500) + "...",
      di: true,
      ml_powered: true // ✅ 3-Level Hybrid ML
    });
  } catch (error) {
    console.error("Resume optimization error:", error);
    res.status(500).json({
      error: "Failed to optimize resume",
      details: error.message
    });
  }
});

// GET /api/resume/health - Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    di: true,
    message: "Resume service using 100% DI"
  });
});

// GET /api/resume/ml-info - ML System Information
router.get("/ml-info", (req, res) => {
  res.json({
    success: true,
    mlArchitecture: "3-Level Hybrid ML",
    levels: [
      {
        level: 1,
        name: "NLTK Text Quality Analysis",
        technology: "NLTK 3.9.2",
        metrics: [
          "Word count",
          "Lexical diversity",
          "POS diversity",
          "Action verb count",
          "Quantifiable achievements",
          "Readability score (Flesch)"
        ],
        weight: 0.25
      },
      {
        level: 2,
        name: "BERT Semantic Matching",
        technology: "sentence-transformers (all-MiniLM-L6-v2)",
        metrics: [
          "Semantic similarity (0-1)",
          "Skills match percentage",
          "Matching skills extraction",
          "Missing skills detection"
        ],
        weight: 0.40
      },
      {
        level: 3,
        name: "Gemini AI Feedback",
        technology: "Google Gemini-2.0-Flash",
        metrics: [
          "Intelligent strengths analysis",
          "Contextual improvement suggestions",
          "Actionable recommendations",
          "Relevance score (0-100)"
        ],
        weight: 0.35
      }
    ],
    features: [
      "Graceful degradation (2-level or 1-level fallback)",
      "Real-time analysis",
      "Resume optimization",
      "Job description matching",
      "DDD/DI compliant architecture"
    ],
    endpoints: {
      upload: "POST /api/resume/upload",
      optimize: "POST /api/resume/optimize",
      health: "GET /api/resume/health",
      mlInfo: "GET /api/resume/ml-info"
    }
  });
});

module.exports = router;
