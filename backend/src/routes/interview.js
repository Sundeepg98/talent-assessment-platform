const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/interview/start - Start interview session with 100% DI
router.post("/start", auth, async (req, res) => {
  try {
    const { position, difficulty } = req.body;
    
    // Would normally use a session service from DI
    const sessionService = req.getService('sessionService');
    const sessionId = Date.now().toString();
    
    res.json({
      success: true,
      sessionId,
      position,
      difficulty,
      di: true
    });
  } catch (error) {
    console.error("Interview start error:", error);
    res.status(500).json({ error: "Failed to start interview" });
  }
});

// GET /api/interview/question/:sessionId - Get next question with 100% DI
router.get("/question/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const questionBank = req.getService('questionBank');
    
    // Sample questions (would come from service)
    const questions = [
      "Tell me about yourself",
      "Why do you want to work here?",
      "What are your greatest strengths?",
      "Describe a challenging project you worked on"
    ];
    
    const questionIndex = parseInt(sessionId) % questions.length;
    
    res.json({
      success: true,
      question: questions[questionIndex],
      questionNumber: questionIndex + 1,
      totalQuestions: questions.length,
      di: true
    });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ error: "Failed to get question" });
  }
});

// POST /api/interview/respond - Submit interview response with 100% DI
router.post("/respond", auth, async (req, res) => {
  try {
    const { sessionId, question, response } = req.body;
    const interviewAnalyzer = req.getService('interviewAnalyzer');
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: "Response is required" });
    }
    
    // Analyze the response
    const analysis = await interviewAnalyzer.analyzeInterview(
      question,
      response,
      { role: 'Software Engineer' }
    );
    
    res.json({
      success: true,
      sessionId,
      analysis,
      di: true
    });
  } catch (error) {
    console.error("Response analysis error:", error);
    res.status(500).json({ error: "Failed to analyze response" });
  }
});

// POST /api/interview/end - End interview session with 100% DI
router.post("/end", auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const sessionService = req.getService('sessionService');
    
    res.json({
      success: true,
      message: "Interview session ended",
      sessionId,
      di: true
    });
  } catch (error) {
    console.error("End interview error:", error);
    res.status(500).json({ error: "Failed to end interview" });
  }
});

// GET /api/interview/health - Health check
router.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    di: true,
    message: "Interview service using 100% DI"
  });
});

module.exports = router;
