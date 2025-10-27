/**
 * MongoDB Repository Implementations Index
 * Infrastructure layer - Concrete implementations of domain repository interfaces
 * SOLID: Dependency Inversion - Infrastructure implements domain contracts
 * DDD: Infrastructure layer providing persistence implementations
 */

// Identity domain repositories
const UserRepository = require('./UserRepository');
const TokenRepository = require('./TokenRepository');
const SessionRepository = require('./SessionRepository');
const TwoFactorRepository = require('./TwoFactorRepository');

// Assessment domain repositories (to be implemented)
// const AssessmentRepository = require('./AssessmentRepository');
// const QuestionRepository = require('./QuestionRepository');
// const ResultRepository = require('./ResultRepository');

// Interview domain repository (to be implemented)
// const InterviewRepository = require('./InterviewRepository');

// Job domain repository (to be implemented)
// const JobRepository = require('./JobRepository');

/**
 * Repository factory
 * Creates singleton instances of repositories
 * Can be used with dependency injection containers
 */
class RepositoryFactory {
  constructor() {
    // Lazy initialization
    this._repositories = {};
  }

  /**
   * Get UserRepository instance
   */
  getUserRepository() {
    if (!this._repositories.user) {
      this._repositories.user = new UserRepository();
    }
    return this._repositories.user;
  }

  /**
   * Get TokenRepository instance
   */
  getTokenRepository() {
    if (!this._repositories.token) {
      this._repositories.token = new TokenRepository();
    }
    return this._repositories.token;
  }

  /**
   * Get SessionRepository instance
   */
  getSessionRepository() {
    if (!this._repositories.session) {
      this._repositories.session = new SessionRepository();
    }
    return this._repositories.session;
  }

  /**
   * Get TwoFactorRepository instance
   */
  getTwoFactorRepository() {
    if (!this._repositories.twoFactor) {
      this._repositories.twoFactor = new TwoFactorRepository();
    }
    return this._repositories.twoFactor;
  }

  /**
   * Get all repositories
   */
  getAllRepositories() {
    return {
      userRepository: this.getUserRepository(),
      tokenRepository: this.getTokenRepository(),
      sessionRepository: this.getSessionRepository(),
      twoFactorRepository: this.getTwoFactorRepository()
    };
  }

  /**
   * Clear all repository instances
   * Useful for testing
   */
  clearInstances() {
    this._repositories = {};
  }
}

// Export singleton factory
const repositoryFactory = new RepositoryFactory();

module.exports = {
  // Repository classes
  UserRepository,
  TokenRepository,
  SessionRepository,
  TwoFactorRepository,
  
  // Factory instance
  repositoryFactory,
  
  // Convenience method for getting all repositories
  getRepositories: () => repositoryFactory.getAllRepositories()
};