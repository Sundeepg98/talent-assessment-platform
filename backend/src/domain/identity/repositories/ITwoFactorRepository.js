/**
 * ITwoFactorRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for 2FA data persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class ITwoFactorRepository {
  /**
   * Save 2FA configuration
   * @param {Object} twoFactorData - 2FA data
   * @returns {Promise<Object>} Saved 2FA data
   */
  async save(twoFactorData) {
    throw new Error('ITwoFactorRepository.save must be implemented');
  }

  /**
   * Find 2FA configuration by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} 2FA data or null
   */
  async findByUserId(userId) {
    throw new Error('ITwoFactorRepository.findByUserId must be implemented');
  }

  /**
   * Update 2FA configuration
   * @param {Object} twoFactorData - 2FA data
   * @returns {Promise<Object>} Updated 2FA data
   */
  async update(twoFactorData) {
    throw new Error('ITwoFactorRepository.update must be implemented');
  }

  /**
   * Delete 2FA configuration
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(userId) {
    throw new Error('ITwoFactorRepository.delete must be implemented');
  }

  /**
   * Mark backup code as used
   * @param {string} userId - User ID
   * @param {string} codeHash - Hashed backup code
   * @returns {Promise<boolean>} Success status
   */
  async markBackupCodeUsed(userId, codeHash) {
    throw new Error('ITwoFactorRepository.markBackupCodeUsed must be implemented');
  }

  /**
   * Get remaining backup codes count
   * @param {string} userId - User ID
   * @returns {Promise<number>} Remaining codes count
   */
  async getRemainingBackupCodes(userId) {
    throw new Error('ITwoFactorRepository.getRemainingBackupCodes must be implemented');
  }

  /**
   * Update backup codes
   * @param {string} userId - User ID
   * @param {string[]} hashedCodes - New hashed backup codes
   * @returns {Promise<boolean>} Success status
   */
  async updateBackupCodes(userId, hashedCodes) {
    throw new Error('ITwoFactorRepository.updateBackupCodes must be implemented');
  }

  /**
   * Check if 2FA is enabled for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Enabled status
   */
  async isEnabled(userId) {
    throw new Error('ITwoFactorRepository.isEnabled must be implemented');
  }

  /**
   * Count users with 2FA enabled
   * @returns {Promise<number>} Count of users with 2FA
   */
  async countEnabled() {
    throw new Error('ITwoFactorRepository.countEnabled must be implemented');
  }
}

module.exports = ITwoFactorRepository;