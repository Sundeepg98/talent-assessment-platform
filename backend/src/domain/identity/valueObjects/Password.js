const bcrypt = require('bcryptjs');
const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * Password Value Object
 *
 * Encapsulates password hashing, validation, and verification.
 * Immutable - cannot change password without creating new instance.
 *
 * Usage:
 *   const password = Password.create('MySecurePass123!');  // From plain text
 *   const password = Password.fromHash('$2a$10$...');     // From existing hash
 *   password.verify('MySecurePass123!');                  // Returns true/false
 */
class Password extends ValueObject {
  constructor(props) {
    super(props);
  }

  /**
   * Create password from plain text (will hash it)
   */
  static async create(plainPassword) {
    Password._validateStrength(plainPassword);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    return new Password({ hash });
  }

  /**
   * Create password from existing hash (for loading from database)
   */
  static fromHash(hash) {
    if (!hash || typeof hash !== 'string') {
      throw new ValidationError('Password hash must be a non-empty string');
    }
    return new Password({ hash });
  }

  /**
   * Validate password strength requirements
   */
  static _validateStrength(password) {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password must be a non-empty string', 'password');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long', 'password');
    }

    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter', 'password');
    }

    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter', 'password');
    }

    if (!/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain at least one number', 'password');
    }

    // Optional: Special character requirement
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //   throw new ValidationError('Password must contain at least one special character', 'password');
    // }
  }

  /**
   * Verify if plain password matches this hash
   */
  async verify(plainPassword) {
    return await bcrypt.compare(plainPassword, this._props.hash);
  }

  /**
   * Synchronous version of verify (use when you can't await)
   */
  verifySync(plainPassword) {
    return bcrypt.compareSync(plainPassword, this._props.hash);
  }

  /**
   * Get the hash value
   */
  get hash() {
    return this._props.hash;
  }

  /**
   * For backward compatibility with code that expects .value
   */
  get value() {
    return this._props.hash;
  }

  /**
   * Check if password meets strength requirements (static helper)
   */
  static meetsRequirements(password) {
    try {
      Password._validateStrength(password);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Password;
