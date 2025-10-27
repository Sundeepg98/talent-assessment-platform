const { randomUUID } = require('crypto');
const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * InterviewSessionId Value Object
 *
 * Unique identifier for Interview Session aggregates.
 */
class InterviewSessionId extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Interview Session ID must be a non-empty string');
    }
    super({ value: value.toString() });
  }

  /**
   * Generate a new unique InterviewSessionId
   */
  static generate() {
    return new InterviewSessionId(randomUUID());
  }

  /**
   * Create from MongoDB ObjectId
   */
  static fromObjectId(objectId) {
    if (!objectId) {
      throw new ValidationError('ObjectId cannot be empty');
    }
    return new InterviewSessionId(objectId.toString());
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

module.exports = InterviewSessionId;
