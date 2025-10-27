/**
 * ISessionRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for session persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class ISessionRepository {
  /**
   * Create new session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  async create(sessionData) {
    throw new Error('ISessionRepository.create must be implemented');
  }

  /**
   * Find session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session data or null
   */
  async findById(sessionId) {
    throw new Error('ISessionRepository.findById must be implemented');
  }

  /**
   * Find sessions by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object[]>} List of sessions
   */
  async findByUserId(userId) {
    throw new Error('ISessionRepository.findByUserId must be implemented');
  }

  /**
   * Find active sessions by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object[]>} List of active sessions
   */
  async findActiveByUserId(userId) {
    throw new Error('ISessionRepository.findActiveByUserId must be implemented');
  }

  /**
   * Save/update session
   * @param {Object} session - Session data
   * @returns {Promise<Object>} Saved session
   */
  async save(session) {
    throw new Error('ISessionRepository.save must be implemented');
  }

  /**
   * Update session
   * @param {Object} session - Session data
   * @returns {Promise<Object>} Updated session
   */
  async update(session) {
    throw new Error('ISessionRepository.update must be implemented');
  }

  /**
   * Invalidate session
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateSession(sessionId) {
    throw new Error('ISessionRepository.invalidateSession must be implemented');
  }

  /**
   * Invalidate all user sessions
   * @param {string} userId - User ID
   * @param {string} exceptSessionId - Session ID to exclude
   * @returns {Promise<number>} Number of invalidated sessions
   */
  async invalidateAllUserSessions(userId, exceptSessionId = null) {
    throw new Error('ISessionRepository.invalidateAllUserSessions must be implemented');
  }

  /**
   * Update last activity
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async updateActivity(sessionId) {
    throw new Error('ISessionRepository.updateActivity must be implemented');
  }

  /**
   * Clean expired sessions
   * @returns {Promise<number>} Number of cleaned sessions
   */
  async cleanExpired() {
    throw new Error('ISessionRepository.cleanExpired must be implemented');
  }

  /**
   * Check if session is active
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Active status
   */
  async isActive(sessionId) {
    throw new Error('ISessionRepository.isActive must be implemented');
  }

  /**
   * Find sessions by device fingerprint
   * @param {string} userId - User ID
   * @param {string} fingerprint - Device fingerprint
   * @returns {Promise<Object[]>} List of sessions
   */
  async findByDeviceFingerprint(userId, fingerprint) {
    throw new Error('ISessionRepository.findByDeviceFingerprint must be implemented');
  }

  /**
   * Count active sessions for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Active session count
   */
  async countActive(userId) {
    throw new Error('ISessionRepository.countActive must be implemented');
  }
}

module.exports = ISessionRepository;