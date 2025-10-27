/**
 * ITokenRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for token persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class ITokenRepository {
  /**
   * Save token
   * @param {Object} tokenData - Token data to save
   * @returns {Promise<Object>} Saved token
   */
  async save(tokenData) {
    throw new Error('ITokenRepository.save must be implemented');
  }

  /**
   * Find token by value
   * @param {string} token - Token value
   * @returns {Promise<Object|null>} Token data or null
   */
  async findByToken(token) {
    throw new Error('ITokenRepository.findByToken must be implemented');
  }

  /**
   * Find tokens by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object[]>} List of tokens
   */
  async findByUserId(userId) {
    throw new Error('ITokenRepository.findByUserId must be implemented');
  }

  /**
   * Find tokens by type and user
   * @param {string} userId - User ID
   * @param {string} type - Token type
   * @returns {Promise<Object[]>} List of tokens
   */
  async findByUserIdAndType(userId, type) {
    throw new Error('ITokenRepository.findByUserIdAndType must be implemented');
  }

  /**
   * Delete token
   * @param {string} token - Token value
   * @returns {Promise<boolean>} Success status
   */
  async delete(token) {
    throw new Error('ITokenRepository.delete must be implemented');
  }

  /**
   * Delete all tokens for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted tokens
   */
  async deleteByUserId(userId) {
    throw new Error('ITokenRepository.deleteByUserId must be implemented');
  }

  /**
   * Delete tokens by type for user
   * @param {string} userId - User ID
   * @param {string} type - Token type
   * @returns {Promise<number>} Number of deleted tokens
   */
  async deleteByUserIdAndType(userId, type) {
    throw new Error('ITokenRepository.deleteByUserIdAndType must be implemented');
  }

  /**
   * Mark token as used
   * @param {string} token - Token value
   * @returns {Promise<boolean>} Success status
   */
  async markAsUsed(token) {
    throw new Error('ITokenRepository.markAsUsed must be implemented');
  }

  /**
   * Clean expired tokens
   * @returns {Promise<number>} Number of cleaned tokens
   */
  async cleanExpired() {
    throw new Error('ITokenRepository.cleanExpired must be implemented');
  }

  /**
   * Check if token exists
   * @param {string} token - Token value
   * @returns {Promise<boolean>} Existence status
   */
  async exists(token) {
    throw new Error('ITokenRepository.exists must be implemented');
  }
}

module.exports = ITokenRepository;