const { randomUUID } = require('crypto');
const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * UserId Value Object
 *
 * Unique identifier for User entity.
 * Can be created from existing ID or generated as new UUID.
 *
 * Usage:
 *   const userId = UserId.generate();  // New UUID
 *   const userId = new UserId('507f1f77bcf86cd799439011');  // From existing ID
 */
class UserId extends ValueObject {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('User ID must be a non-empty string');
    }

    super({ value: value.toString() });
  }

  /**
   * Generate new unique ID
   */
  static generate() {
    return new UserId(randomUUID());
  }

  /**
   * Create from MongoDB ObjectId string
   */
  static fromObjectId(objectId) {
    if (!objectId) {
      throw new ValidationError('ObjectId cannot be empty');
    }
    return new UserId(objectId.toString());
  }

  /**
   * Get ID value
   */
  get value() {
    return this._props.value;
  }

  /**
   * For string conversion
   */
  toString() {
    return this._props.value;
  }

  /**
   * Compare with another UserId
   */
  equals(other) {
    if (!other || !(other instanceof UserId)) {
      return false;
    }
    return this._props.value === other._props.value;
  }
}

module.exports = UserId;
