const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/interview/start - Start interview session with REAL MongoDB storage
router.post("/start", auth, async (req, res) => {
  try {
    const { role, level, position, difficulty = 'medium', interviewType = 'technical' } = req.body;
    const interviewSessionService = req.getService('interviewSessionService');
    const questionBankService = req.getService('questionBankService');

    // Create real session in MongoDB
    const session = await interviewSessionService.createSession({
      userId: req.user.uid,
      position: position || role,
      difficulty: difficulty || level,
      interviewType
    });

    // Get initial questions
    const questions = questionBankService.getQuestions({
      interviewType,
      difficulty: difficulty || level || 'medium',
      count: 5
    });

    res.json({
      success: true,
      ...session,
      questions, // Return questions for E2E tests
      di: true
    });
  } catch (error) {
    console.error("Interview start error:", error);
    res.status(500).json({ error: "Failed to start interview", details: error.message });
  }
});

// GET /api/interview/question/:sessionId - Get next question with REAL question bank
router.get("/question/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { difficulty = 'medium', interviewType = 'technical' } = req.query;

    const interviewSessionService = req.getService('interviewSessionService');
    const questionBankService = req.getService('questionBankService');

    // Get session to check how many questions asked
    const session = await interviewSessionService.getSession(sessionId);

    // Get next question based on session progress
    const currentIndex = session.questions.length;
    const nextQuestion = questionBankService.getNextQuestion({
      interviewType,
      difficulty,
      currentIndex
    });

    if (!nextQuestion) {
      return res.json({
        success: true,
        completed: true,
        message: "No more questions available",
        di: true
      });
    }

    res.json({
      success: true,
      question: nextQuestion.questionText,
      questionNumber: nextQuestion.questionNumber,
      totalQuestions: nextQuestion.totalQuestions,
      hasMore: nextQuestion.hasMore,
      di: true
    });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ error: "Failed to get question", details: error.message });
  }
});

// POST /api/interview/response - Submit interview response with REAL AI analysis and storage
router.post("/response", auth, async (req, res) => {
  try {
    const { sessionId, questionIndex = 0, response, questionText, role = 'Software Engineer' } = req.body;
    const interviewSessionService = req.getService('interviewSessionService');
    const questionBankService = req.getService('questionBankService');

    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: "Response is required" });
    }

    // Get questionText from provided or lookup from question bank
    let actualQuestionText = questionText;
    if (!actualQuestionText) {
      // Look up question from question bank based on questionIndex
      const question = questionBankService.getNextQuestion({
        interviewType: 'technical',
        difficulty: 'medium',
        currentIndex: questionIndex
      });
      actualQuestionText = question ? question.questionText : 'General interview question';
    }

    // Store response with REAL AI analysis
    const result = await interviewSessionService.addResponse({
      sessionId,
      questionText: actualQuestionText,
      userResponse: response,
      role
    });

    res.json({
      success: true,
      sessionId: result.sessionId,
      analysis: result.analysis,
      di: true
    });
  } catch (error) {
    console.error("Response analysis error:", error);
    res.status(500).json({ error: "Failed to analyze response", details: error.message });
  }
});

// POST /api/interview/complete - Complete interview and calculate REAL scores from stored data
router.post("/complete", auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const interviewSessionService = req.getService('interviewSessionService');

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Complete session and calculate real score from all analyses
    const result = await interviewSessionService.completeSession(sessionId);

    res.json({
      success: true,
      message: "Interview completed",
      ...result,
      di: true
    });
  } catch (error) {
    console.error("Complete interview error:", error);
    res.status(500).json({ error: "Failed to complete interview", details: error.message });
  }
});

// GET /api/interview/session/:sessionId - Get session details
router.get("/session/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const interviewSessionService = req.getService('interviewSessionService');

    const session = await interviewSessionService.getSession(sessionId);

    res.json({
      success: true,
      session,
      di: true
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ error: "Failed to get session", details: error.message });
  }
});

// GET /api/interview/health - Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    di: true,
    message: "Interview service using REAL MongoDB storage and AI analysis"
  });
});

module.exports = router;
