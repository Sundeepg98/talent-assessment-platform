/**
 * ServiceLocator - Dependency Injection Container
 * 
 * This provides a centralized way to manage service instances
 * and their dependencies, making the codebase more testable
 * and loosely coupled.
 */

class ServiceLocator {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a service class or factory function
   * @param {string} name - Service name
   * @param {Function} ServiceClass - Class constructor or factory function
   * @param {Object} options - Options for the service
   * @param {boolean} options.singleton - Whether to create a single instance
   * @param {Object} options.config - Configuration to pass to the constructor
   */
  register(name, ServiceClass, options = {}) {
    this.factories.set(name, {
      ServiceClass,
      singleton: options.singleton || false,
      config: options.config || {}
    });
  }

  /**
   * Get a service instance
   * @param {string} name - Service name
   * @returns {Object} Service instance
   */
  get(name) {
    const factory = this.factories.get(name);
    
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    // If singleton, return cached instance
    if (factory.singleton) {
      if (!this.singletons.has(name)) {
        const instance = new factory.ServiceClass(factory.config);
        this.singletons.set(name, instance);
      }
      return this.singletons.get(name);
    }

    // Otherwise create a new instance
    return new factory.ServiceClass(factory.config);
  }

  /**
   * Create a new instance with custom config (overrides singleton)
   * @param {string} name - Service name
   * @param {Object} config - Custom configuration
   * @returns {Object} Service instance
   */
  create(name, config = {}) {
    const factory = this.factories.get(name);
    
    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    const mergedConfig = { ...factory.config, ...config };
    return new factory.ServiceClass(mergedConfig);
  }

  /**
   * Clear all registered services and singletons
   * Useful for testing
   */
  clear() {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Clear cached singleton instances
   * Useful for testing
   */
  clearSingletons() {
    this.singletons.clear();
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.factories.has(name);
  }

  /**
   * Get all registered service names
   * @returns {Array<string>}
   */
  getRegisteredServices() {
    return Array.from(this.factories.keys());
  }
}

// Create a default instance for the application
const serviceLocator = new ServiceLocator();

// Export both the class and the default instance
module.exports = ServiceLocator;
module.exports.default = serviceLocator;