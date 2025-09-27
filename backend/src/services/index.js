/**
 * Services Index
 * Central export for all service domains
 * 
 * Organization:
 * - auth: Authentication and authorization services
 * - communication: Email and notification services
 * - assessment: Code execution and testing services
 * - interview: Interview and analysis services
 * - infrastructure: Core infrastructure services
 * - validation: Input validation services
 * - processing: File and text processing services
 */

// Export domains
const domains = {
  auth: require('./auth'),
  communication: require('./communication'),
  assessment: require('./assessment'),
  interview: require('./interview'),
  infrastructure: require('./infrastructure'),
  validation: require('./validation'),
  processing: require('./processing')
};

module.exports = domains;

// Legacy exports for backward compatibility (to be removed in future)
// These will be deprecated but maintain existing code functionality
const legacyMappings = {
  // Map old names to new locations
  EmailVerificationService: () => domains.communication.emailVerification,
  TokenService: () => domains.auth.TokenService,
  Judge0Service: () => domains.assessment.judge0Service,
  MockJudge0Service: () => domains.assessment.mockJudge0Service,
  RealJudge0Service: () => domains.assessment.realJudge0Service,
  QuestionService: () => domains.assessment.questionService,
  CacheService: () => domains.infrastructure.cacheService,
  SessionManager: () => domains.infrastructure.sessionManager,
  ServiceLocator: () => domains.infrastructure.ServiceLocator,
  FileValidator: () => domains.validation.fileValidator,
  PDFProcessor: () => domains.processing.pdfProcessor,
  ResumeService: () => domains.processing.resume,
  ResumeAnalyzer: () => domains.processing.resumeAnalyzer,
  TextAnalysis: () => domains.processing.textAnalysis,
  VideoInterview: () => domains.interview.videoInterview,
  InterviewAnalyzer: () => domains.interview.interviewAnalyzer
};

// Add legacy exports with deprecation warnings
Object.keys(legacyMappings).forEach(key => {
  Object.defineProperty(module.exports, key, {
    get() {
      console.warn(`⚠️  DEPRECATED: Direct access to '${key}' is deprecated. Use 'services.<domain>.<service>' instead.`);
      return legacyMappings[key]();
    }
  });
});