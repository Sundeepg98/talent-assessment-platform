const Entity = require('../../shared/Entity');
const { ValidationError, InvalidOperationError } = require('../../errors/DomainError');
const InterviewSessionId = require('../valueObjects/InterviewSessionId');
const Rating = require('../valueObjects/Rating');
const Duration = require('../../assessment/valueObjects/Duration');
const Score = require('../../assessment/valueObjects/Score');

/**
 * InterviewSession Aggregate Root
 *
 * Manages the lifecycle of an interview session.
 * Tracks questions asked, responses given, and overall performance.
 *
 * Status: scheduled → in_progress → completed → analyzed
 */
class InterviewSession extends Entity {
  constructor(props) {
    super(props.id);

    this._candidateId = props.candidateId; // UserId
    this._interviewerId = props.interviewerId || null; // UserId or null for automated
    this._position = props.position || 'Software Engineer';
    this._type = props.type || 'technical'; // 'technical', 'behavioral', 'hr'

    // Session data
    this._questions = props.questions || []; // Array of {question, response, rating}
    this._duration = props.duration instanceof Duration
      ? props.duration
      : Duration.fromMinutes(props.durationMinutes || 60);

    // Status
    this._status = props.status || 'scheduled'; // scheduled, in_progress, completed, analyzed
    this._scheduledAt = props.scheduledAt || null;
    this._startedAt = props.startedAt || null;
    this._completedAt = props.completedAt || null;
    this._analyzedAt = props.analyzedAt || null;

    // Scores and ratings
    this._overallRating = props.overallRating || null; // Rating VO
    this._technicalScore = props.technicalScore || null; // Score VO
    this._communicationRating = props.communicationRating || null; // Rating VO
    this._problemSolvingRating = props.problemSolvingRating || null; // Rating VO

    // Analysis
    this._analysis = props.analysis || null;
    this._strengths = props.strengths || [];
    this._weaknesses = props.weaknesses || [];
    this._recommendation = props.recommendation || null; // 'hire', 'maybe', 'reject'

    // Metadata
    this._notes = props.notes || '';
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // ============================================================================
  // Business Logic - Session Lifecycle
  // ============================================================================

  /**
   * Start the interview session
   */
  start() {
    if (this._status !== 'scheduled') {
      throw new InvalidOperationError(`Cannot start interview in ${this._status} status`);
    }

    this._status = 'in_progress';
    this._startedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'InterviewStarted',
      sessionId: this._id.value,
      candidateId: this._candidateId.value || this._candidateId,
      timestamp: this._startedAt
    });
  }

  /**
   * Add a question and response
   */
  addResponse(question, response, rating = null) {
    if (this._status !== 'in_progress') {
      throw new InvalidOperationError('Interview session is not in progress');
    }

    if (!question || !response) {
      throw new ValidationError('Question and response are required');
    }

    const questionResponse = {
      question,
      response,
      rating: rating instanceof Rating ? rating : null,
      answeredAt: new Date()
    };

    this._questions.push(questionResponse);
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'ResponseAdded',
      sessionId: this._id.value,
      questionNumber: this._questions.length,
      timestamp: questionResponse.answeredAt
    });

    return questionResponse;
  }

  /**
   * Complete the interview session
   */
  complete() {
    if (this._status !== 'in_progress') {
      throw new InvalidOperationError('Interview session is not in progress');
    }

    if (this._questions.length === 0) {
      throw new ValidationError('Cannot complete interview without any responses');
    }

    this._status = 'completed';
    this._completedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'InterviewCompleted',
      sessionId: this._id.value,
      candidateId: this._candidateId.value || this._candidateId,
      questionCount: this._questions.length,
      timestamp: this._completedAt
    });
  }

  /**
   * Analyze interview and set ratings
   */
  analyze(analysis) {
    if (this._status !== 'completed') {
      throw new InvalidOperationError('Can only analyze completed interviews');
    }

    if (!analysis.overallRating) {
      throw new ValidationError('Overall rating is required', 'overallRating');
    }

    // Set ratings
    this._overallRating = analysis.overallRating instanceof Rating
      ? analysis.overallRating
      : Rating.create(analysis.overallRating);

    if (analysis.technicalScore) {
      this._technicalScore = analysis.technicalScore instanceof Score
        ? analysis.technicalScore
        : Score.create(analysis.technicalScore);
    }

    if (analysis.communicationRating) {
      this._communicationRating = analysis.communicationRating instanceof Rating
        ? analysis.communicationRating
        : Rating.create(analysis.communicationRating);
    }

    if (analysis.problemSolvingRating) {
      this._problemSolvingRating = analysis.problemSolvingRating instanceof Rating
        ? analysis.problemSolvingRating
        : Rating.create(analysis.problemSolvingRating);
    }

    // Set analysis details
    this._analysis = analysis.summary || null;
    this._strengths = analysis.strengths || [];
    this._weaknesses = analysis.weaknesses || [];
    this._recommendation = analysis.recommendation || null;

    this._status = 'analyzed';
    this._analyzedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'InterviewAnalyzed',
      sessionId: this._id.value,
      overallRating: this._overallRating.value,
      recommendation: this._recommendation,
      timestamp: this._analyzedAt
    });
  }

  // ============================================================================
  // Business Logic - Ratings
  // ============================================================================

  /**
   * Calculate average rating from individual question ratings
   */
  calculateAverageRating() {
    const ratedQuestions = this._questions.filter(q => q.rating !== null);

    if (ratedQuestions.length === 0) {
      return null;
    }

    const sum = ratedQuestions.reduce((total, q) => total + q.rating.value, 0);
    const average = Math.round(sum / ratedQuestions.length);

    return Rating.create(average);
  }

  /**
   * Rate a specific question
   */
  rateQuestion(questionIndex, rating) {
    if (questionIndex < 0 || questionIndex >= this._questions.length) {
      throw new ValidationError('Invalid question index');
    }

    if (!(rating instanceof Rating)) {
      rating = Rating.create(rating);
    }

    this._questions[questionIndex].rating = rating;
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Business Logic - Duration
  // ============================================================================

  /**
   * Get actual interview duration
   */
  getActualDuration() {
    if (!this._startedAt || !this._completedAt) {
      return null;
    }

    const milliseconds = this._completedAt - this._startedAt;
    return Duration.fromMilliseconds(milliseconds);
  }

  /**
   * Check if interview exceeded planned duration
   */
  hasExceededDuration() {
    const actualDuration = this.getActualDuration();
    if (!actualDuration) return false;

    return actualDuration.isLongerThan(this._duration);
  }

  // ============================================================================
  // Business Logic - Authorization
  // ============================================================================

  /**
   * Check if user can view interview details
   */
  canBeViewedBy(user) {
    const userId = user.id.value || user.id;
    const candidateId = this._candidateId.value || this._candidateId;
    const interviewerId = this._interviewerId ? (this._interviewerId.value || this._interviewerId) : null;

    // Candidate can view their own interview
    if (userId === candidateId) return true;

    // Interviewer can view
    if (userId === interviewerId) return true;

    // Admin/recruiter can view (check role)
    if (user.hasRole && (user.hasRole('admin') || user.hasRole('recruiter'))) {
      return true;
    }

    return false;
  }

  // ============================================================================
  // Business Logic - Metadata
  // ============================================================================

  /**
   * Add notes
   */
  addNotes(notes) {
    if (!notes || typeof notes !== 'string') {
      throw new ValidationError('Notes must be a non-empty string');
    }

    this._notes = this._notes ? `${this._notes}\n\n${notes}` : notes;
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get candidateId() {
    return this._candidateId;
  }

  get interviewerId() {
    return this._interviewerId;
  }

  get position() {
    return this._position;
  }

  get type() {
    return this._type;
  }

  get questions() {
    return [...this._questions]; // Return copy
  }

  get questionCount() {
    return this._questions.length;
  }

  get duration() {
    return this._duration;
  }

  get status() {
    return this._status;
  }

  get scheduledAt() {
    return this._scheduledAt;
  }

  get startedAt() {
    return this._startedAt;
  }

  get completedAt() {
    return this._completedAt;
  }

  get analyzedAt() {
    return this._analyzedAt;
  }

  get overallRating() {
    return this._overallRating;
  }

  get technicalScore() {
    return this._technicalScore;
  }

  get communicationRating() {
    return this._communicationRating;
  }

  get problemSolvingRating() {
    return this._problemSolvingRating;
  }

  get analysis() {
    return this._analysis;
  }

  get strengths() {
    return [...this._strengths];
  }

  get weaknesses() {
    return [...this._weaknesses];
  }

  get recommendation() {
    return this._recommendation;
  }

  get notes() {
    return this._notes;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON() {
    return {
      id: this._id.value,
      candidateId: this._candidateId.value || this._candidateId,
      interviewerId: this._interviewerId ? (this._interviewerId.value || this._interviewerId) : null,
      position: this._position,
      type: this._type,
      questionCount: this._questions.length,
      duration: this._duration.toJSON(),
      status: this._status,
      scheduledAt: this._scheduledAt,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      analyzedAt: this._analyzedAt,
      overallRating: this._overallRating ? this._overallRating.toJSON() : null,
      technicalScore: this._technicalScore ? this._technicalScore.value : null,
      communicationRating: this._communicationRating ? this._communicationRating.toJSON() : null,
      problemSolvingRating: this._problemSolvingRating ? this._problemSolvingRating.toJSON() : null,
      recommendation: this._recommendation,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  toJSONWithDetails() {
    return {
      ...this.toJSON(),
      questions: this._questions.map(q => ({
        question: q.question,
        response: q.response,
        rating: q.rating ? q.rating.toJSON() : null,
        answeredAt: q.answeredAt
      })),
      analysis: this._analysis,
      strengths: this._strengths,
      weaknesses: this._weaknesses,
      notes: this._notes
    };
  }
}

module.exports = InterviewSession;
