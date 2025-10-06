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
    const geminiService = req.getService('geminiService');
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Process the PDF
    const extractedText = await pdfProcessor.extractText(req.file.path);
    
    // Analyze with Gemini
    const analysis = await geminiService.analyzeResume(extractedText);
    
    res.json({
      success: true,
      filename: req.file.filename,
      analysis,
      extractedText: extractedText.substring(0, 500) + "..." // Preview
    });
  } catch (error) {
    console.error("Resume processing error:", error);
    res.status(500).json({ 
      error: "Failed to process resume",
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

module.exports = router;
