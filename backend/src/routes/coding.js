// backend/src/routes/coding.js
const express = require("express");
const auth = require("../middleware/auth");
const Judge0Service = require("../services/assessment/judge0Service");
const Submission = require("../models/Submission");

const router = express.Router();

// Create instance with test config (uses mock when JUDGE0_API_KEY=test-judge0-key)
const judge0Service = new Judge0Service({
  apiKey: process.env.JUDGE0_API_KEY || 'test-judge0-key'
});

// Submit code for execution
router.post("/submit", auth, async (req, res) => {
  try {
    const { sourceCode, languageId, stdin } = req.body;
    
    if (!sourceCode || !languageId) {
      return res.status(400).json({ msg: "Source code and language ID required" });
    }

    // Submit to Judge0
    const judge0Response = await judge0Service.submitCode(sourceCode, languageId, stdin);
    
    // Save submission to database
    const submission = await Submission.create({
      userId: req.user.uid,
      sourceCode,
      languageId,
      judge0Token: judge0Response.token
    });
    
    res.json({ 
      message: "Code submitted successfully",
      submissionId: submission._id,
      judge0Token: judge0Response.token
    });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ 
      msg: "Server error during submission",
      error: error.message 
    });
  }
});

// Get submission result
router.get("/result/:token", auth, async (req, res) => {
  try {
    const { token } = req.params;
    
    // Get result from Judge0
    const result = await judge0Service.getSubmission(token);
    
    res.json({ 
      message: "Result retrieved successfully",
      result 
    });
  } catch (error) {
    console.error("Result fetch error:", error);
    res.status(500).json({ 
      msg: "Server error fetching result",
      error: error.message 
    });
  }
});

module.exports = router;
