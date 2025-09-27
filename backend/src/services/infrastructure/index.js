/**
 * Infrastructure Services
 * Domain: infrastructure
 * 
 * Core infrastructure services for caching, configuration, and service management
 */

module.exports = {
  cacheService: require('./cacheService'),
  ServiceLocator: require('./ServiceLocator'),
  serviceConfig: require('./serviceConfig'),
  sessionManager: require('./sessionManager')
};