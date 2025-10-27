const Entity = require('../../shared/Entity');
const { ValidationError, InvalidOperationError } = require('../../errors/DomainError');

/**
 * User Domain Entity
 *
 * Represents a user in the system with their identity and profile.
 * Contains business logic for user operations and validations.
 *
 * Aggregates:
 * - UserId (identifier)
 * - Email (contact)
 * - Password (authentication)
 * - Username (public identifier)
 * - Profile (user information)
 * - Security settings (2FA, locks, etc.)
 */
class User extends Entity {
  constructor(props) {
    // Entity base class requires ID
    super(props.id);

    // Identity Value Objects
    this._email = props.email;  // Email VO
    this._password = props.password;  // Password VO
    this._username = props.username;  // Can be string or Username VO

    // Email verification
    this._isEmailVerified = props.isEmailVerified || false;
    this._emailVerifiedAt = props.emailVerifiedAt || null;

    // Two-Factor Authentication
    this._isTwoFactorEnabled = props.isTwoFactorEnabled || false;
    this._twoFactorSecret = props.twoFactorSecret || null;

    // Account status
    this._isActive = props.isActive !== undefined ? props.isActive : true;
    this._roles = props.roles || ['user'];

    // Profile
    this._profile = props.profile || {};

    // Timestamps
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    // Password management
    this._passwordChangedAt = props.passwordChangedAt || null;

    // Login tracking
    this._lastLoginAt = props.lastLoginAt || null;
    this._lastLoginIp = props.lastLoginIp || null;
    this._loginCount = props.loginCount || 0;

    // Security - Failed login attempts
    this._failedLoginAttempts = props.failedLoginAttempts || 0;
    this._lastFailedLoginAt = props.lastFailedLoginAt || null;

    // Account locking
    this._isLocked = props.isLocked || false;
    this._lockedUntil = props.lockedUntil || null;
  }

  // ============================================================================
  // Business Logic - Email Verification
  // ============================================================================

  /**
   * Verify email
   */
  verifyEmail() {
    if (this._isEmailVerified) {
      throw new InvalidOperationError('Email is already verified');
    }

    this._isEmailVerified = true;
    this._emailVerifiedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'EmailVerified',
      userId: this._id.value,
      email: this._email.value,
      verifiedAt: this._emailVerifiedAt
    });
  }

  /**
   * Check if email is verified
   */
  hasVerifiedEmail() {
    return this._isEmailVerified === true;
  }

  // ============================================================================
  // Business Logic - Two-Factor Authentication
  // ============================================================================

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(secret) {
    if (!secret) {
      throw new ValidationError('Two-factor secret is required');
    }

    this._isTwoFactorEnabled = true;
    this._twoFactorSecret = secret;
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'TwoFactorEnabled',
      userId: this._id.value
    });
  }

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor() {
    if (!this._isTwoFactorEnabled) {
      throw new InvalidOperationError('Two-factor is not enabled');
    }

    this._isTwoFactorEnabled = false;
    this._twoFactorSecret = null;
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'TwoFactorDisabled',
      userId: this._id.value
    });
  }

  // ============================================================================
  // Business Logic - Login Tracking
  // ============================================================================

  /**
   * Record successful login
   */
  recordLogin(ipAddress) {
    this._lastLoginAt = new Date();
    this._lastLoginIp = ipAddress;
    this._loginCount += 1;
    this._failedLoginAttempts = 0;  // Reset failed attempts on success
    this._updatedAt = new Date();

    // Unlock account if it was locked
    if (this._isLocked) {
      this.unlock();
    }

    this.addDomainEvent({
      type: 'UserLoggedIn',
      userId: this._id.value,
      ipAddress,
      timestamp: this._lastLoginAt
    });
  }

  /**
   * Record failed login attempt
   */
  recordFailedLogin() {
    this._failedLoginAttempts += 1;
    this._lastFailedLoginAt = new Date();
    this._updatedAt = new Date();

    // Lock account after 5 failed attempts
    if (this._failedLoginAttempts >= 5) {
      this.lock(60);  // Lock for 60 minutes
    }

    this.addDomainEvent({
      type: 'LoginAttemptFailed',
      userId: this._id.value,
      attempts: this._failedLoginAttempts
    });
  }

  // ============================================================================
  // Business Logic - Account Locking
  // ============================================================================

  /**
   * Lock account
   */
  lock(durationMinutes = 60) {
    this._isLocked = true;
    this._lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'UserAccountLocked',
      userId: this._id.value,
      lockedUntil: this._lockedUntil
    });
  }

  /**
   * Unlock account
   */
  unlock() {
    this._isLocked = false;
    this._lockedUntil = null;
    this._failedLoginAttempts = 0;
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'UserAccountUnlocked',
      userId: this._id.value
    });
  }

  /**
   * Check if account is currently locked
   */
  isCurrentlyLocked() {
    if (!this._isLocked) return false;

    // Check if lock has expired
    if (this._lockedUntil && this._lockedUntil < new Date()) {
      this.unlock();
      return false;
    }

    return true;
  }

  // ============================================================================
  // Business Logic - Authorization
  // ============================================================================

  /**
   * Check if user has a specific role
   */
  hasRole(role) {
    return this._roles.includes(role);
  }

  /**
   * Add role to user
   */
  addRole(role) {
    if (this._roles.includes(role)) {
      throw new InvalidOperationError(`User already has role: ${role}`);
    }

    this._roles.push(role);
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'RoleAdded',
      userId: this._id.value,
      role
    });
  }

  /**
   * Remove role from user
   */
  removeRole(role) {
    const index = this._roles.indexOf(role);
    if (index === -1) {
      throw new InvalidOperationError(`User does not have role: ${role}`);
    }

    this._roles.splice(index, 1);
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'RoleRemoved',
      userId: this._id.value,
      role
    });
  }

  /**
   * Check if user can schedule interviews
   */
  canScheduleInterview() {
    return this._isEmailVerified && !this.isCurrentlyLocked() && this._isActive;
  }

  /**
   * Check if user can submit code
   */
  canSubmitCode() {
    return this._isEmailVerified && !this.isCurrentlyLocked() && this._isActive;
  }

  // ============================================================================
  // Business Logic - Profile Management
  // ============================================================================

  /**
   * Update profile
   */
  updateProfile(updates) {
    this._profile = { ...this._profile, ...updates };
    this._updatedAt = new Date();

    this.addDomainEvent({
      type: 'ProfileUpdated',
      userId: this._id.value
    });

    return this;
  }

  // ============================================================================
  // Getters - Identity
  // ============================================================================

  get email() {
    return this._email;
  }

  get password() {
    return this._password;
  }

  get username() {
    return this._username;
  }

  // ============================================================================
  // Getters - Status
  // ============================================================================

  get isEmailVerified() {
    return this._isEmailVerified;
  }

  get emailVerifiedAt() {
    return this._emailVerifiedAt;
  }

  get isTwoFactorEnabled() {
    return this._isTwoFactorEnabled;
  }

  get twoFactorSecret() {
    return this._twoFactorSecret;
  }

  get isActive() {
    return this._isActive;
  }

  get roles() {
    return [...this._roles];  // Return copy to prevent mutation
  }

  get profile() {
    return { ...this._profile };  // Return copy to prevent mutation
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  get passwordChangedAt() {
    return this._passwordChangedAt;
  }

  get lastLoginAt() {
    return this._lastLoginAt;
  }

  get lastLoginIp() {
    return this._lastLoginIp;
  }

  get loginCount() {
    return this._loginCount;
  }

  get failedLoginAttempts() {
    return this._failedLoginAttempts;
  }

  get lastFailedLoginAt() {
    return this._lastFailedLoginAt;
  }

  get isLocked() {
    return this._isLocked;
  }

  get lockedUntil() {
    return this._lockedUntil;
  }

  // ============================================================================
  // Backward Compatibility - For gradual migration
  // ============================================================================

  /**
   * MongoDB _id (for backward compatibility)
   * Note: The Entity base class already has this.__id from super(props.id)
   * We just expose it through a getter that returns the string value
   */
  toString() {
    return this.id ? this.id.value : '';
  }
}

module.exports = User;
