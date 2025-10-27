const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * Username Value Object
 *
 * Encapsulates username validation and normalization.
 * Ensures username meets requirements and is stored consistently.
 *
 * Rules:
 * - 3-30 characters
 * - Alphanumeric with underscores/hyphens allowed
 * - Stored in lowercase for case-insensitive matching
 *
 * Usage:
 *   const username = Username.create('John_Doe123');  // Normalizes to john_doe123
 */
class Username extends ValueObject {
  constructor(props) {
    super(props);
  }

  /**
   * Create Username from string
   */
  static create(usernameString) {
    if (!usernameString || typeof usernameString !== 'string') {
      throw new ValidationError('Username must be a non-empty string', 'username');
    }

    const normalized = usernameString.toLowerCase().trim();

    if (normalized.length < 3) {
      throw new ValidationError('Username must be at least 3 characters long', 'username');
    }

    if (normalized.length > 30) {
      throw new ValidationError('Username cannot exceed 30 characters', 'username');
    }

    // Allow alphanumeric, underscores, and hyphens
    if (!/^[a-z0-9_-]+$/.test(normalized)) {
      throw new ValidationError(
        'Username can only contain letters, numbers, underscores, and hyphens',
        'username'
      );
    }

    // Cannot start or end with special characters
    if (/^[_-]|[_-]$/.test(normalized)) {
      throw new ValidationError('Username cannot start or end with underscore or hyphen', 'username');
    }

    return new Username({ value: normalized });
  }

  /**
   * Get username value
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
   * Static helper for validation without creating instance
   */
  static isValid(username) {
    try {
      Username.create(username);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Username;
