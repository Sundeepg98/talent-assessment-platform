const express = require("express");
const auth = require("../middleware/auth");
const interviewAnalyzer = require("../services/interview/interviewAnalyzer");

const router = express.Router();

// Start interview session (keep existing functionality)
router.post("/start", auth, async (req, res) => {
  try {
    const { position, difficulty } = req.body;
    
    // Would normally create session in database
    const sessionId = Date.now().toString();
    
    res.json({
      success: true,
      sessionId,
      position,
      difficulty
    });
  } catch (error) {
    console.error("Interview start error:", error);
    res.status(500).json({ error: "Failed to start interview" });
  }
});

// Get next question (keep existing functionality)
router.get("/question/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Mock questions for now
    const questions = [
      "Tell me about yourself and your experience.",
      "Describe a challenging project you worked on.",
      "How do you handle tight deadlines?",
      "What are your strengths and weaknesses?",
      "Where do you see yourself in 5 years?"
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    res.json({
      success: true,
      question: randomQuestion,
      questionNumber: 1,
      totalQuestions: 5
    });
  } catch (error) {
    console.error("Question fetch error:", error);
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

// Submit answer - NOW INTEGRATED!
router.post("/answer", auth, async (req, res) => {
  try {
    const { sessionId, question, answer, position } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ 
        error: "Question and answer are required" 
      });
    }
    
    // Use INTEGRATED analyzer service (no external Python server!)
    const analysis = await interviewAnalyzer.analyzeInterview(
      question,
      answer,
      { role: position || 'Software Engineer' }
    );
    
    res.json({
      success: true,
      sessionId,
      analysis: {
        score: analysis.score,
        feedback: analysis.feedback,
        details: analysis.analysis
      },
      message: "Answer analyzed successfully (integrated service)"
    });
    
  } catch (error) {
    console.error("Answer analysis error:", error);
    res.status(500).json({ 
      error: "Analysis failed", 
      details: error.message 
    });
  }
});

// Complete interview session
router.post("/complete/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body;
    
    // Analyze all answers
    let totalScore = 0;
    const analyzedAnswers = [];
    
    for (const item of (answers || [])) {
      const analysis = await interviewAnalyzer.analyzeInterview(
        item.question,
        item.answer
      );
      analyzedAnswers.push(analysis);
      totalScore += analysis.score;
    }
    
    const averageScore = answers?.length 
      ? Math.round(totalScore / answers.length)
      : 0;
    
    res.json({
      success: true,
      sessionId,
      results: {
        score: averageScore,
        totalQuestions: answers?.length || 0,
        analyzedAnswers,
        recommendation: averageScore > 70 
          ? "Strong candidate" 
          : averageScore > 50 
            ? "Potential candidate" 
            : "Needs improvement"
      }
    });
    
  } catch (error) {
    console.error("Session completion error:", error);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

// Health check for integrated service
router.get("/health", async (req, res) => {
  try {
    // Test the analyzer
    const test = await interviewAnalyzer.analyzeInterview(
      "Test question",
      "Test answer"
    );
    
    res.json({
      success: true,
      service: "integrated",
      status: "healthy",
      features: {
        python_analyzer: test.source === "python",
        javascript_fallback: test.source !== "python",
        gemini_integration: false // Can be enabled with API key
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: "integrated",
      status: "error",
      error: error.message
    });
  }
});

module.exports = router;