const Entity = require('../../shared/Entity');
const { ValidationError, InvalidOperationError, EntityNotFoundError } = require('../../errors/DomainError');
const Question = require('../entities/Question');
const AssessmentId = require('../valueObjects/AssessmentId');
const QuestionId = require('../valueObjects/QuestionId');
const Duration = require('../valueObjects/Duration');
const Score = require('../valueObjects/Score');

/**
 * Assessment Aggregate Root
 *
 * Manages the lifecycle of an assessment and owns all questions.
 * Enforces assessment business rules and consistency boundaries.
 *
 * Status: draft → active → archived
 */
class Assessment extends Entity {
  constructor(props) {
    super(props.id);

    this._title = props.title;
    this._description = props.description || '';
    this._questions = props.questions || []; // Owns questions
    this._duration = props.duration instanceof Duration
      ? props.duration
      : Duration.fromMinutes(props.durationMinutes || 60);
    this._difficulty = props.difficulty || 'medium'; // 'easy', 'medium', 'hard'
    this._category = props.category || 'general';
    this._tags = props.tags || [];

    // Ownership
    this._createdBy = props.createdBy; // UserId
    this._organizationId = props.organizationId || null;

    // Status
    this._status = props.status || 'draft'; // draft, active, archived
    this._publishedAt = props.publishedAt || null;

    // Settings
    this._passingScore = props.passingScore instanceof Score
      ? props.passingScore
      : Score.create(props.passingScore || 60);
    this._shuffleQuestions = props.shuffleQuestions !== undefined ? props.shuffleQuestions : true;
    this._showCorrectAnswers = props.showCorrectAnswers !== undefined ? props.showCorrectAnswers : false;

    // Metadata
    this._attemptCount = props.attemptCount || 0;
    this._averageScore = props.averageScore || null;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // ============================================================================
  // Business Logic - Question Management
  // ============================================================================

  /**
   * Add a question to the assessment
   */
  addQuestion(questionProps) {
    if (this._status !== 'draft') {
      throw new InvalidOperationError('Cannot modify published assessment');
    }

    // Create Question entity if not already one
    const question = questionProps instanceof Question
      ? questionProps
      : new Question({
          id: QuestionId.generate(),
          ...questionProps
        });

    // Validate question
    question.validate();

    this._questions.push(question);
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'QuestionAdded',
      assessmentId: this._id.value,
      questionId: question.id.value,
      timestamp: this._updatedAt
    });

    return question;
  }

  /**
   * Remove a question from the assessment
   */
  removeQuestion(questionId) {
    if (this._status !== 'draft') {
      throw new InvalidOperationError('Cannot modify published assessment');
    }

    // Accept both QuestionId and string
    const questionIdValue = questionId instanceof QuestionId ? questionId.value : questionId;

    const index = this._questions.findIndex(q => {
      const qId = q.id instanceof QuestionId ? q.id.value : q.id;
      return qId === questionIdValue;
    });

    if (index === -1) {
      throw new EntityNotFoundError('Question', questionIdValue);
    }

    const [removedQuestion] = this._questions.splice(index, 1);
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'QuestionRemoved',
      assessmentId: this._id.value,
      questionId: questionIdValue,
      timestamp: this._updatedAt
    });

    return removedQuestion;
  }

  /**
   * Update a question
   */
  updateQuestion(questionId, updates) {
    if (this._status !== 'draft') {
      throw new InvalidOperationError('Cannot modify published assessment');
    }

    const question = this.findQuestion(questionId);
    if (!question) {
      throw new EntityNotFoundError('Question', questionId);
    }

    // Apply updates
    if (updates.text) question.updateText(updates.text);
    if (updates.points) question.updatePoints(updates.points);

    this._updatedAt = new Date();

    return question;
  }

  /**
   * Find a question by ID
   */
  findQuestion(questionId) {
    const questionIdValue = questionId instanceof QuestionId ? questionId.value : questionId;

    return this._questions.find(q => {
      const qId = q.id instanceof QuestionId ? q.id.value : q.id;
      return qId === questionIdValue;
    });
  }

  /**
   * Get questions by difficulty
   */
  getQuestionsByDifficulty(difficulty) {
    return this._questions.filter(q => q.difficulty === difficulty);
  }

  /**
   * Get questions by type
   */
  getQuestionsByType(type) {
    return this._questions.filter(q => q.type === type);
  }

  // ============================================================================
  // Business Logic - Publishing
  // ============================================================================

  /**
   * Publish the assessment (make it active)
   */
  publish() {
    this._validateForPublishing();

    this._status = 'active';
    this._publishedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'AssessmentPublished',
      assessmentId: this._id.value,
      questionCount: this._questions.length,
      maxScore: this.calculateMaxScore().value,
      timestamp: this._publishedAt
    });
  }

  /**
   * Validate assessment can be published
   */
  _validateForPublishing() {
    if (this._status === 'active') {
      throw new InvalidOperationError('Assessment is already published');
    }

    if (this._questions.length === 0) {
      throw new ValidationError('Cannot publish assessment without questions', 'questions');
    }

    if (!this._title || this._title.length < 5) {
      throw new ValidationError('Assessment title must be at least 5 characters', 'title');
    }

    if (this._duration.minutes <= 0) {
      throw new ValidationError('Assessment duration must be positive', 'duration');
    }

    // Validate all questions
    this._questions.forEach((question, index) => {
      try {
        question.validate();
      } catch (error) {
        throw new ValidationError(`Question ${index + 1} is invalid: ${error.message}`, 'questions');
      }
    });
  }

  /**
   * Archive the assessment
   */
  archive() {
    if (this._status === 'draft') {
      throw new InvalidOperationError('Cannot archive unpublished assessment');
    }

    this._status = 'archived';
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'AssessmentArchived',
      assessmentId: this._id.value,
      timestamp: this._updatedAt
    });
  }

  /**
   * Unarchive the assessment
   */
  unarchive() {
    if (this._status !== 'archived') {
      throw new InvalidOperationError('Assessment is not archived');
    }

    this._status = 'active';
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'AssessmentUnarchived',
      assessmentId: this._id.value,
      timestamp: this._updatedAt
    });
  }

  // ============================================================================
  // Business Logic - Scoring
  // ============================================================================

  /**
   * Calculate maximum possible score
   */
  calculateMaxScore() {
    if (this._questions.length === 0) {
      return Score.zero();
    }

    const total = this._questions.reduce((sum, question) => {
      return sum + question.points.value;
    }, 0);

    return Score.create(total);
  }

  /**
   * Calculate score for given answers
   */
  calculateScore(answers) {
    let totalScore = 0;

    this._questions.forEach(question => {
      const answer = answers[question.id.value || question.id];

      if (answer !== undefined) {
        try {
          const score = question.scoreAnswer(answer);
          totalScore += score.value;
        } catch (error) {
          // Question requires manual grading (essay/coding)
          // Skip it for now
        }
      }
    });

    const maxScore = this.calculateMaxScore();
    const percentage = maxScore.value > 0
      ? (totalScore / maxScore.value) * 100
      : 0;

    return Score.create(percentage);
  }

  /**
   * Check if score is passing
   */
  isPassing(score) {
    if (!(score instanceof Score)) {
      score = Score.create(score);
    }

    return score.value >= this._passingScore.value;
  }

  // ============================================================================
  // Business Logic - Attempts
  // ============================================================================

  /**
   * Record an attempt
   */
  recordAttempt(score) {
    if (!(score instanceof Score)) {
      score = Score.create(score);
    }

    this._attemptCount += 1;

    // Update average score
    if (this._averageScore === null) {
      this._averageScore = score.value;
    } else {
      this._averageScore = (this._averageScore * (this._attemptCount - 1) + score.value) / this._attemptCount;
    }

    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'AssessmentAttempted',
      assessmentId: this._id.value,
      score: score.value,
      isPassing: this.isPassing(score),
      attemptCount: this._attemptCount,
      timestamp: this._updatedAt
    });
  }

  // ============================================================================
  // Business Logic - Authorization
  // ============================================================================

  /**
   * Check if user can attempt assessment
   */
  canBeAttemptedBy(user) {
    if (this._status !== 'active') {
      return false;
    }

    // User must have verification and proper authorization
    return user.canSubmitCode && user.canSubmitCode();
  }

  /**
   * Check if user can edit assessment
   */
  canBeEditedBy(user) {
    if (this._status !== 'draft') {
      return false;
    }

    // Check if user is creator
    const userId = user.id.value || user.id;
    const creatorId = this._createdBy.value || this._createdBy;

    return userId === creatorId;
  }

  // ============================================================================
  // Business Logic - Metadata
  // ============================================================================

  /**
   * Update title
   */
  updateTitle(newTitle) {
    if (this._status !== 'draft') {
      throw new InvalidOperationError('Cannot modify published assessment');
    }

    if (!newTitle || newTitle.length < 5) {
      throw new ValidationError('Title must be at least 5 characters');
    }

    this._title = newTitle;
    this._updatedAt = new Date();
  }

  /**
   * Update description
   */
  updateDescription(newDescription) {
    if (this._status !== 'draft') {
      throw new InvalidOperationError('Cannot modify published assessment');
    }

    this._description = newDescription || '';
    this._updatedAt = new Date();
  }

  /**
   * Update duration
   */
  updateDuration(newDuration) {
    if (this._status !== 'draft') {
      throw new InvalidOperationError('Cannot modify published assessment');
    }

    if (!(newDuration instanceof Duration)) {
      newDuration = Duration.fromMinutes(newDuration);
    }

    this._duration = newDuration;
    this._updatedAt = new Date();
  }

  /**
   * Add tag
   */
  addTag(tag) {
    if (!tag || typeof tag !== 'string') {
      throw new ValidationError('Tag must be a non-empty string');
    }

    if (this._tags.includes(tag)) {
      throw new InvalidOperationError(`Tag already exists: ${tag}`);
    }

    this._tags.push(tag);
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get title() {
    return this._title;
  }

  get description() {
    return this._description;
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

  get difficulty() {
    return this._difficulty;
  }

  get category() {
    return this._category;
  }

  get tags() {
    return [...this._tags];
  }

  get createdBy() {
    return this._createdBy;
  }

  get status() {
    return this._status;
  }

  get publishedAt() {
    return this._publishedAt;
  }

  get passingScore() {
    return this._passingScore;
  }

  get shuffleQuestions() {
    return this._shuffleQuestions;
  }

  get showCorrectAnswers() {
    return this._showCorrectAnswers;
  }

  get attemptCount() {
    return this._attemptCount;
  }

  get averageScore() {
    return this._averageScore !== null ? Score.create(this._averageScore) : null;
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
      title: this._title,
      description: this._description,
      questionCount: this._questions.length,
      duration: this._duration.toJSON(),
      difficulty: this._difficulty,
      category: this._category,
      tags: this._tags,
      status: this._status,
      publishedAt: this._publishedAt,
      passingScore: this._passingScore.value,
      maxScore: this.calculateMaxScore().value,
      attemptCount: this._attemptCount,
      averageScore: this._averageScore,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  toJSONWithQuestions(includeAnswers = false) {
    return {
      ...this.toJSON(),
      questions: this._questions.map(q =>
        includeAnswers ? q.toJSONWithAnswer() : q.toJSON()
      )
    };
  }
}

module.exports = Assessment;
