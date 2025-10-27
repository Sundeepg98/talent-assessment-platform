/**
 * Session Service Interface
 * Defines the contract for session management services
 */

class ISessionService {
  /**
   * Create a new session
   * @param {string} userId - User identifier
   * @param {Object} userInfo - Additional user information
   * @returns {string} Session ID
   */
  createSession(userId, userInfo) {
    throw new Error('Method createSession must be implemented');
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Session data or null if not found
   */
  getSession(sessionId) {
    throw new Error('Method getSession must be implemented');
  }

  /**
   * Update session data
   * @param {string} sessionId - Session identifier
   * @param {Object} updates - Data to update
   * @returns {boolean} Success status
   */
  updateSession(sessionId, updates) {
    throw new Error('Method updateSession must be implemented');
  }

  /**
   * Destroy a session
   * @param {string} sessionId - Session identifier
   * @returns {boolean} Success status
   */
  destroySession(sessionId) {
    throw new Error('Method destroySession must be implemented');
  }

  /**
   * Destroy all sessions for a user
   * @param {string} userId - User identifier
   * @returns {number} Number of sessions destroyed
   */
  destroyAllUserSessions(userId) {
    throw new Error('Method destroyAllUserSessions must be implemented');
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - User identifier
   * @returns {Array<Object>} Array of session data
   */
  getUserActiveSessions(userId) {
    throw new Error('Method getUserActiveSessions must be implemented');
  }

  /**
   * Validate session security
   * @param {string} sessionId - Session identifier
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {{valid: boolean, reason?: string}}
   */
  validateSession(sessionId, ipAddress, userAgent) {
    throw new Error('Method validateSession must be implemented');
  }

  /**
   * Clean up expired sessions
   * @returns {number} Number of sessions cleaned
   */
  cleanInactiveSessions() {
    throw new Error('Method cleanInactiveSessions must be implemented');
  }
}

// Define the interface methods for validation
ISessionService.requiredMethods = [
  'createSession',
  'getSession',
  'updateSession',
  'destroySession',
  'destroyAllUserSessions',
  'getUserActiveSessions',
  'validateSession',
  'cleanInactiveSessions'
];

module.exports = ISessionService;