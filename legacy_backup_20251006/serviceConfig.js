/**
 * Service Configuration
 * 
 * This file configures all services using the ServiceLocator pattern.
 * It provides centralized dependency injection and configuration management.
 */

const ServiceLocator = require('./ServiceLocator');
const EmailVerificationService = require('./emailVerification');
const SessionManager = require('./sessionManager');

// Create the service locator instance
const serviceLocator = new ServiceLocator();

/**
 * Configure services based on environment
 */
function configureServices(env = process.env) {
  // Email Verification Service
  serviceLocator.register('emailVerification', EmailVerificationService, {
    singleton: true,
    config: {
      emailService: env.EMAIL_SERVICE || 'gmail',
      emailUser: env.EMAIL_USER,
      emailPass: env.EMAIL_PASS,
      jwtSecret: env.JWT_SECRET || 'default-jwt-secret',
      frontendUrl: env.FRONTEND_URL || 'http://localhost:3000'
    }
  });

  // Session Manager
  serviceLocator.register('sessionManager', SessionManager, {
    singleton: true,
    config: {
      sessionSecret: env.SESSION_SECRET,
      nodeEnv: env.NODE_ENV || 'development',
      mongoUri: env.MONGO_URI,
      cookieMaxAge: 1000 * 60 * 60 * 24, // 24 hours
      sessionTtl: 24 * 60 * 60, // 24 hours in seconds
      maxInactivity: 1000 * 60 * 60 * 24 // 24 hours in ms
    }
  });

  // Add more services as needed
  // Example:
  // serviceLocator.register('judge0Service', Judge0Service, {
  //   singleton: true,
  //   config: {
  //     apiKey: env.JUDGE0_API_KEY,
  //     apiUrl: env.JUDGE0_API_URL
  //   }
  // });

  return serviceLocator;
}

/**
 * Get a configured service instance
 * @param {string} serviceName - Name of the service
 * @returns {Object} Service instance
 */
function getService(serviceName) {
  return serviceLocator.get(serviceName);
}

/**
 * Create a new service instance with custom config
 * @param {string} serviceName - Name of the service  
 * @param {Object} config - Custom configuration
 * @returns {Object} Service instance
 */
function createService(serviceName, config) {
  return serviceLocator.create(serviceName, config);
}

// Configure services on module load
configureServices();

module.exports = {
  serviceLocator,
  configureServices,
  getService,
  createService,
  
  // Export specific service getters for convenience
  getEmailVerificationService: () => getService('emailVerification'),
  getSessionManager: () => getService('sessionManager')
};