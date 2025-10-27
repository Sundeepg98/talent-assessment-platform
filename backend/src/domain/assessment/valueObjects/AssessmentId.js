const { randomUUID } = require('crypto');
const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * AssessmentId Value Object
 *
 * Unique identifier for Assessment aggregates.
 */
class AssessmentId extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Assessment ID must be a non-empty string');
    }
    super({ value: value.toString() });
  }

  /**
   * Generate a new unique AssessmentId
   */
  static generate() {
    return new AssessmentId(randomUUID());
  }

  /**
   * Create from MongoDB ObjectId
   */
  static fromObjectId(objectId) {
    if (!objectId) {
      throw new ValidationError('ObjectId cannot be empty');
    }
    return new AssessmentId(objectId.toString());
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

module.exports = AssessmentId;
