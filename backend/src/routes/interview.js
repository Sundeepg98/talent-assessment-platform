const express = require("express");
const auth = require("../middleware/auth");
const QuestionService = require("../services/assessment/questionService");

const router = express.Router();

// Create instance
const questionService = new QuestionService();

// Create interview session
router.post("/session", auth, async (req, res) => {
  try {
    const { candidateName, position, level } = req.body;
    
    if (!candidateName || !position) {
      return res.status(400).json({ msg: "Candidate name and position required" });
    }
    
    // Create session
    const session = {
      id: 'session-' + Date.now(),
      candidateName,
      position,
      level: level || 'intermediate',
      userId: req.user.uid,
      createdAt: new Date()
    };
    
    res.json({
      message: "Interview session created",
      session
    });
  } catch (error) {
    console.error("Session creation error:", error);
    res.status(500).json({ msg: "Error creating session", error: error.message });
  }
});

// Get interview questions
router.get("/questions", auth, async (req, res) => {
  try {
    const { category, count } = req.query;
    const questionCount = parseInt(count) || 5;
    
    // Get questions from service
    const questions = await questionService.getRandomQuestions(questionCount);
    
    res.json({
      message: "Questions retrieved successfully",
      questions,
      count: questions.length
    });
  } catch (error) {
    console.error("Questions fetch error:", error);
    res.status(500).json({ msg: "Error fetching questions", error: error.message });
  }
});

// Submit interview response
router.post("/response", auth, async (req, res) => {
  try {
    const { sessionId, questionId, answer } = req.body;
    
    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ 
        msg: "Session ID, question ID, and answer are required" 
      });
    }
    
    // Process response (simplified for now)
    const response = {
      id: 'response-' + Date.now(),
      sessionId,
      questionId,
      answer,
      timestamp: new Date(),
      score: Math.floor(Math.random() * 40) + 60 // Mock score 60-100
    };
    
    res.json({
      message: "Response submitted successfully",
      response
    });
  } catch (error) {
    console.error("Response submission error:", error);
    res.status(500).json({ msg: "Error submitting response", error: error.message });
  }
});

// Complete interview
router.post("/complete", auth, async (req, res) => {
  try {
    const { sessionId, responses } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ msg: "Session ID required" });
    }
    
    // Calculate overall score (mock)
    const totalScore = responses?.length 
      ? responses.reduce((sum, r) => sum + (r.score || 70), 0) / responses.length
      : 75;
    
    res.json({
      message: "Interview completed successfully",
      sessionId,
      totalScore: Math.round(totalScore),
      feedback: "Good performance overall. Strong technical skills demonstrated."
    });
  } catch (error) {
    console.error("Interview completion error:", error);
    res.status(500).json({ msg: "Error completing interview", error: error.message });
  }
});

module.exports = router;
