/**
 * Token Service Interface
 * Defines the contract for token generation and validation
 */

class ITokenService {
  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @returns {string} Generated token
   */
  generateAccessToken(payload) {
    throw new Error('Method generateAccessToken must be implemented');
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload
   * @returns {string} Generated token
   */
  generateRefreshToken(payload) {
    throw new Error('Method generateRefreshToken must be implemented');
  }

  /**
   * Generate verification token
   * @param {string} userId - User identifier
   * @param {string} email - User email
   * @returns {string} Generated token
   */
  generateVerificationToken(userId, email) {
    throw new Error('Method generateVerificationToken must be implemented');
  }

  /**
   * Verify token
   * @param {string} token - Token to verify
   * @returns {{valid: boolean, payload?: Object, error?: string}}
   */
  verifyToken(token) {
    throw new Error('Method verifyToken must be implemented');
  }

  /**
   * Decode token without verification
   * @param {string} token - Token to decode
   * @returns {Object|null} Decoded payload or null
   */
  decodeToken(token) {
    throw new Error('Method decodeToken must be implemented');
  }

  /**
   * Revoke token
   * @param {string} token - Token to revoke
   * @returns {Promise<boolean>} Success status
   */
  async revokeToken(token) {
    throw new Error('Method revokeToken must be implemented');
  }

  /**
   * Check if token is revoked
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} True if revoked
   */
  async isTokenRevoked(token) {
    throw new Error('Method isTokenRevoked must be implemented');
  }
}

// Define the interface methods for validation
ITokenService.requiredMethods = [
  'generateAccessToken',
  'generateRefreshToken',
  'generateVerificationToken',
  'verifyToken',
  'decodeToken',
  'revokeToken',
  'isTokenRevoked'
];

module.exports = ITokenService;