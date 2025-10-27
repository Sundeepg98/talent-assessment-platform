const Entity = require('../../shared/Entity');
const { ValidationError, InvalidOperationError } = require('../../errors/DomainError');
const Score = require('../valueObjects/Score');
const QuestionId = require('../valueObjects/QuestionId');

/**
 * Question Entity
 *
 * Represents a single question in an assessment.
 * Contains validation and scoring logic.
 *
 * Types: multiple-choice, coding, essay, true-false
 */
class Question extends Entity {
  constructor(props) {
    super(props.id);

    this._text = props.text;
    this._type = props.type; // 'multiple-choice', 'coding', 'essay', 'true-false'
    this._options = props.options || [];
    this._correctAnswer = props.correctAnswer || null;
    this._points = props.points instanceof Score ? props.points : Score.create(props.points || 10);
    this._difficulty = props.difficulty || 'medium'; // 'easy', 'medium', 'hard'
    this._category = props.category || null;
    this._tags = props.tags || [];

    // Coding-specific fields
    this._starterCode = props.starterCode || null;
    this._testCases = props.testCases || [];

    // Essay-specific fields
    this._rubric = props.rubric || null;
    this._maxWords = props.maxWords || null;

    // Metadata
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // ============================================================================
  // Business Logic - Validation
  // ============================================================================

  /**
   * Validate question completeness
   */
  validate() {
    // Text validation
    if (!this._text || typeof this._text !== 'string') {
      throw new ValidationError('Question text is required', 'text');
    }

    if (this._text.length < 10) {
      throw new ValidationError('Question text must be at least 10 characters', 'text');
    }

    if (this._text.length > 1000) {
      throw new ValidationError('Question text cannot exceed 1000 characters', 'text');
    }

    // Type validation
    const validTypes = ['multiple-choice', 'coding', 'essay', 'true-false'];
    if (!validTypes.includes(this._type)) {
      throw new ValidationError(`Invalid question type. Must be one of: ${validTypes.join(', ')}`, 'type');
    }

    // Type-specific validation
    switch (this._type) {
      case 'multiple-choice':
        this._validateMultipleChoice();
        break;
      case 'true-false':
        this._validateTrueFalse();
        break;
      case 'coding':
        this._validateCoding();
        break;
      case 'essay':
        this._validateEssay();
        break;
    }

    // Points validation
    if (this._points.value <= 0) {
      throw new ValidationError('Question points must be positive', 'points');
    }

    return true;
  }

  _validateMultipleChoice() {
    if (!Array.isArray(this._options) || this._options.length < 2) {
      throw new ValidationError('Multiple choice questions must have at least 2 options', 'options');
    }

    if (this._options.length > 6) {
      throw new ValidationError('Multiple choice questions cannot have more than 6 options', 'options');
    }

    if (!this._correctAnswer) {
      throw new ValidationError('Multiple choice questions must have a correct answer', 'correctAnswer');
    }

    if (!this._options.includes(this._correctAnswer)) {
      throw new ValidationError('Correct answer must be one of the options', 'correctAnswer');
    }
  }

  _validateTrueFalse() {
    if (this._correctAnswer !== true && this._correctAnswer !== false) {
      throw new ValidationError('True/False questions must have a boolean correct answer', 'correctAnswer');
    }
  }

  _validateCoding() {
    // Coding questions should have test cases
    if (!Array.isArray(this._testCases) || this._testCases.length === 0) {
      throw new ValidationError('Coding questions must have at least one test case', 'testCases');
    }
  }

  _validateEssay() {
    // Essay questions can optionally have rubric and max words
    if (this._maxWords !== null && (typeof this._maxWords !== 'number' || this._maxWords <= 0)) {
      throw new ValidationError('Max words must be a positive number', 'maxWords');
    }
  }

  // ============================================================================
  // Business Logic - Scoring
  // ============================================================================

  /**
   * Check if an answer is correct
   */
  isCorrect(answer) {
    if (this._type === 'multiple-choice' || this._type === 'true-false') {
      return answer === this._correctAnswer;
    }

    // Coding questions evaluated by test cases
    if (this._type === 'coding') {
      throw new InvalidOperationError('Coding questions require test case evaluation');
    }

    // Essay questions require manual grading
    if (this._type === 'essay') {
      throw new InvalidOperationError('Essay questions require manual grading');
    }

    return false;
  }

  /**
   * Score a candidate's answer
   */
  scoreAnswer(answer) {
    if (this._type === 'essay' || this._type === 'coding') {
      throw new InvalidOperationError(`${this._type} questions require manual/automated grading`);
    }

    if (this.isCorrect(answer)) {
      return this._points;
    }

    return Score.zero();
  }

  /**
   * Evaluate coding question with test case results
   */
  scoreCodingAnswer(passedTestCases, totalTestCases) {
    if (this._type !== 'coding') {
      throw new InvalidOperationError('Only coding questions can be scored with test cases');
    }

    if (totalTestCases === 0) {
      return Score.zero();
    }

    const percentage = (passedTestCases / totalTestCases) * 100;
    const earnedPoints = (this._points.value * percentage) / 100;

    return Score.create(earnedPoints);
  }

  // ============================================================================
  // Business Logic - Question Management
  // ============================================================================

  /**
   * Update question text
   */
  updateText(newText) {
    if (!newText || newText.length < 10) {
      throw new ValidationError('Question text must be at least 10 characters');
    }

    this._text = newText;
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'QuestionTextUpdated',
      questionId: this._id.value,
      timestamp: this._updatedAt
    });
  }

  /**
   * Update points
   */
  updatePoints(newPoints) {
    if (!(newPoints instanceof Score)) {
      newPoints = Score.create(newPoints);
    }

    this._points = newPoints;
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'QuestionPointsUpdated',
      questionId: this._id.value,
      points: newPoints.value,
      timestamp: this._updatedAt
    });
  }

  /**
   * Add a tag
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

  /**
   * Remove a tag
   */
  removeTag(tag) {
    const index = this._tags.indexOf(tag);
    if (index === -1) {
      throw new InvalidOperationError(`Tag not found: ${tag}`);
    }

    this._tags.splice(index, 1);
    this._updatedAt = new Date();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get text() {
    return this._text;
  }

  get type() {
    return this._type;
  }

  get options() {
    return [...this._options]; // Return copy
  }

  get correctAnswer() {
    return this._correctAnswer;
  }

  get points() {
    return this._points;
  }

  get difficulty() {
    return this._difficulty;
  }

  get category() {
    return this._category;
  }

  get tags() {
    return [...this._tags]; // Return copy
  }

  get starterCode() {
    return this._starterCode;
  }

  get testCases() {
    return [...this._testCases]; // Return copy
  }

  get rubric() {
    return this._rubric;
  }

  get maxWords() {
    return this._maxWords;
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
      text: this._text,
      type: this._type,
      options: this._options,
      // Don't expose correct answer in all contexts
      points: this._points.value,
      difficulty: this._difficulty,
      category: this._category,
      tags: this._tags,
      starterCode: this._starterCode,
      testCases: this._testCases.length, // Just count, not actual cases
      rubric: this._rubric,
      maxWords: this._maxWords,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  toJSONWithAnswer() {
    return {
      ...this.toJSON(),
      correctAnswer: this._correctAnswer,
      testCases: this._testCases // Include full test cases
    };
  }
}

module.exports = Question;
