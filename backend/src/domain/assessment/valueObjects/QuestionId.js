const { randomUUID } = require('crypto');
const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * QuestionId Value Object
 *
 * Unique identifier for Question entities.
 */
class QuestionId extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Question ID must be a non-empty string');
    }
    super({ value: value.toString() });
  }

  /**
   * Generate a new unique QuestionId
   */
  static generate() {
    return new QuestionId(randomUUID());
  }

  /**
   * Create from MongoDB ObjectId
   */
  static fromObjectId(objectId) {
    if (!objectId) {
      throw new ValidationError('ObjectId cannot be empty');
    }
    return new QuestionId(objectId.toString());
  }

  /**
   * Get the string value
   */
  get value() {
    return this._props.value;
  }

  toString() {
    return this._props.value;
  }
}

module.exports = QuestionId;
