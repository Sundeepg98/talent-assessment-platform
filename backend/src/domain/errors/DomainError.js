/**
 * DomainError - Base Error Class for Domain Layer
 *
 * All domain validation errors should extend this class.
 * Separates domain errors from infrastructure/application errors.
 *
 * Usage:
 *   throw new DomainError('Invalid email format');
 *   throw new DomainError('Password too weak', 'PasswordValidationError');
 */
class DomainError extends Error {
  constructor(message, name = 'DomainError') {
    super(message);
    this.name = name;
    this.isDomainError = true;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Check if an error is a domain error
   */
  static isDomainError(error) {
    return error && error.isDomainError === true;
  }
}

/**
 * Specific Domain Errors
 */
class ValidationError extends DomainError {
  constructor(message, field = null) {
    super(message, 'ValidationError');
    this.field = field;
  }
}

class EntityNotFoundError extends DomainError {
  constructor(entityName, identifier) {
    super(`${entityName} not found: ${identifier}`, 'EntityNotFoundError');
    this.entityName = entityName;
    this.identifier = identifier;
  }
}

class DuplicateEntityError extends DomainError {
  constructor(entityName, field, value) {
    super(`${entityName} already exists with ${field}: ${value}`, 'DuplicateEntityError');
    this.entityName = entityName;
    this.field = field;
    this.value = value;
  }
}

class InvalidOperationError extends DomainError {
  constructor(message) {
    super(message, 'InvalidOperationError');
  }
}

class AuthorizationError extends DomainError {
  constructor(message = 'Unauthorized operation') {
    super(message, 'AuthorizationError');
  }
}

module.exports = {
  DomainError,
  ValidationError,
  EntityNotFoundError,
  DuplicateEntityError,
  InvalidOperationError,
  AuthorizationError
};
