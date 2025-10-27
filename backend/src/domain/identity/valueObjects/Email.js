const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * Email Value Object
 *
 * Encapsulates email validation and normalization.
 * Always stored in lowercase for consistency.
 *
 * Usage:
 *   const email = Email.create('John.Doe@Example.COM');  // Normalizes to john.doe@example.com
 *   email.domain;  // Returns 'example.com'
 *   email.localPart;  // Returns 'john.doe'
 */
class Email extends ValueObject {
  constructor(props) {
    super(props);
  }

  /**
   * Create Email from string
   */
  static create(emailString) {
    if (!emailString || typeof emailString !== 'string') {
      throw new ValidationError('Email must be a non-empty string', 'email');
    }

    const normalized = emailString.toLowerCase().trim();

    if (!Email._isValid(normalized)) {
      throw new ValidationError(`Invalid email format: ${emailString}`, 'email');
    }

    return new Email({ value: normalized });
  }

  /**
   * Validate email format
   */
  static _isValid(email) {
    // RFC 5322 compliant regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email value
   */
  get value() {
    return this._props.value;
  }

  /**
   * Get domain part (after @)
   */
  get domain() {
    return this._props.value.split('@')[1];
  }

  /**
   * Get local part (before @)
   */
  get localPart() {
    return this._props.value.split('@')[0];
  }

  /**
   * Check if email is from a specific domain
   */
  isFromDomain(domain) {
    return this.domain === domain.toLowerCase();
  }

  /**
   * For logging/display purposes
   */
  toString() {
    return this._props.value;
  }

  /**
   * Static helper for validation without creating instance
   */
  static isValid(email) {
    try {
      Email.create(email);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Email;
