const mongoose = require('mongoose');

/**
 * Real Interview Session Service with MongoDB persistence
 * Manages interview sessions with actual storage and score calculation
 */
class InterviewSessionService {
  constructor({ InterviewSessionModel, interviewAnalyzer }) {
    this.InterviewSessionModel = InterviewSessionModel;
    this.interviewAnalyzer = interviewAnalyzer;
  }

  /**
   * Create a new interview session
   */
  async createSession({ userId, position, difficulty, interviewType = 'technical' }) {
    const session = new this.InterviewSessionModel({
      userId,
      interviewType,
      questions: [],
      overallScore: 0,
      feedback: [],
      status: 'in_progress'
    });

    await session.save();

    return {
      sessionId: session._id.toString(),
      userId: session.userId,
      interviewType: session.interviewType,
      status: session.status,
      createdAt: session.createdAt
    };
  }

  /**
   * Add a question response to session with AI analysis
   */
  async addResponse({ sessionId, questionText, userResponse, role = 'Software Engineer' }) {
    const session = await this.InterviewSessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'completed') {
      throw new Error('Session already completed');
    }

    // Analyze the response with AI
    const analysis = await this.interviewAnalyzer.analyzeInterview(
      questionText,
      userResponse,
      { role }
    );

    // Store question and response with analysis
    session.questions.push({
      questionText,
      userResponse,
      timeSpent: 0, // Could be tracked from frontend
      analysis: analysis // Store full analysis
    });

    await session.save();

    return {
      sessionId: session._id.toString(),
      questionIndex: session.questions.length - 1,
      analysis
    };
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const session = await this.InterviewSessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  /**
   * Complete session and calculate final score
   */
  async completeSession(sessionId) {
    const session = await this.InterviewSessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'completed') {
      return this._formatCompletedSession(session);
    }

    // Calculate overall score from all question analyses
    let totalScore = 0;
    const feedback = [];

    for (const question of session.questions) {
      if (question.analysis && question.analysis.score) {
        totalScore += question.analysis.score;
      }

      // Collect feedback
      if (question.analysis && question.analysis.feedback) {
        if (question.analysis.feedback.strengths) {
          feedback.push(...question.analysis.feedback.strengths);
        }
        if (question.analysis.feedback.improvements) {
          feedback.push(...question.analysis.feedback.improvements);
        }
      }
    }

    // Calculate average score
    const overallScore = session.questions.length > 0
      ? Math.round(totalScore / session.questions.length)
      : 0;

    // Update session
    session.overallScore = overallScore;
    session.feedback = feedback;
    session.status = 'completed';
    session.completedAt = new Date();

    await session.save();

    return this._formatCompletedSession(session);
  }

  /**
   * Format completed session for response
   */
  _formatCompletedSession(session) {
    return {
      sessionId: session._id.toString(),
      score: session.overallScore,
      status: session.status,
      totalQuestions: session.questions.length,
      feedback: session.feedback,
      completedAt: session.completedAt,
      analysis: this._generateAnalysisSummary(session)
    };
  }

  /**
   * Generate analysis summary from all questions
   */
  _generateAnalysisSummary(session) {
    const scores = session.questions
      .map(q => q.analysis?.score || 0)
      .filter(s => s > 0);

    if (scores.length === 0) {
      return 'No responses analyzed';
    }

    const avgScore = session.overallScore;

    if (avgScore >= 80) {
      return 'Excellent interview performance with strong technical knowledge and communication skills';
    } else if (avgScore >= 60) {
      return 'Good interview performance with solid understanding and room for improvement';
    } else if (avgScore >= 40) {
      return 'Fair interview performance, needs improvement in several areas';
    } else {
      return 'Interview performance needs significant improvement';
    }
  }

  /**
   * Get sessions for a user
   */
  async getUserSessions(userId) {
    return await this.InterviewSessionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = InterviewSessionService;
