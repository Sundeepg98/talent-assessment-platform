/**
 * Repository Interfaces Index
 * DDD: Central export point for all domain repository interfaces
 * SOLID: Dependency Inversion - Domain defines contracts, infrastructure implements
 */

// Identity domain repositories
const IUserRepository = require('../identity/repositories/IUserRepository');
const ITokenRepository = require('../identity/repositories/ITokenRepository');
const ISessionRepository = require('../identity/repositories/ISessionRepository');
const ITwoFactorRepository = require('../identity/repositories/ITwoFactorRepository');

// Assessment domain repositories
const IAssessmentRepository = require('../assessment/repositories/IAssessmentRepository');
const IQuestionRepository = require('../assessment/repositories/IQuestionRepository');
const IResultRepository = require('../assessment/repositories/IResultRepository');

// Interview domain repository
const IInterviewRepository = require('../interview/repositories/IInterviewRepository');

// Job domain repository
const IJobRepository = require('../job/repositories/IJobRepository');

module.exports = {
  // Identity
  IUserRepository,
  ITokenRepository,
  ISessionRepository,
  ITwoFactorRepository,
  
  // Assessment
  IAssessmentRepository,
  IQuestionRepository,
  IResultRepository,
  
  // Interview
  IInterviewRepository,
  
  // Job
  IJobRepository
};