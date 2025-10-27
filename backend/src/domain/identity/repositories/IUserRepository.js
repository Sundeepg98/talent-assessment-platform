/**
 * IUserRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for user persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class IUserRepository {
  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<User|null>} User entity or null
   */
  async findById(userId) {
    throw new Error('IUserRepository.findById must be implemented');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User entity or null
   */
  async findByEmail(email) {
    throw new Error('IUserRepository.findByEmail must be implemented');
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>} User entity or null
   */
  async findByUsername(username) {
    throw new Error('IUserRepository.findByUsername must be implemented');
  }

  /**
   * Save user (create or update)
   * @param {User} user - User entity
   * @returns {Promise<User>} Saved user
   */
  async save(user) {
    throw new Error('IUserRepository.save must be implemented');
  }

  /**
   * Update user
   * @param {User} user - User entity
   * @returns {Promise<User>} Updated user
   */
  async update(user) {
    throw new Error('IUserRepository.update must be implemented');
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(userId) {
    throw new Error('IUserRepository.delete must be implemented');
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Existence status
   */
  async emailExists(email) {
    throw new Error('IUserRepository.emailExists must be implemented');
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} Existence status
   */
  async usernameExists(username) {
    throw new Error('IUserRepository.usernameExists must be implemented');
  }

  /**
   * Find users by role
   * @param {string} role - Role name
   * @param {Object} options - Query options
   * @returns {Promise<User[]>} List of users
   */
  async findByRole(role, options = {}) {
    throw new Error('IUserRepository.findByRole must be implemented');
  }

  /**
   * Count total users
   * @param {Object} filter - Optional filter
   * @returns {Promise<number>} User count
   */
  async count(filter = {}) {
    throw new Error('IUserRepository.count must be implemented');
  }
}

module.exports = IUserRepository;