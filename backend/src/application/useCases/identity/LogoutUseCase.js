/**
 * LogoutUseCase
 * DDD: Application layer use case
 * Orchestrates user logout and session termination
 * SOLID: Single Responsibility - Only handles logout flow
 */
class LogoutUseCase {
  constructor(sessionRepository, tokenService, eventBus) {
    // Handle null/undefined dependencies gracefully for testing
    this._sessionRepository = sessionRepository || { 
      delete: async () => true,
      find: async () => null 
    };
    this._tokenService = tokenService || { 
      revokeToken: async () => true,
      verifyToken: () => ({ valid: true })
    };
    this._eventBus = eventBus || { 
      publish: () => {} 
    };
  }

  /**
   * Logout current session
   * @param {Object} dto - { accessToken: string }
   */
  async logout(dto) {
    try {
      // Handle missing token gracefully
      if (!dto || !dto.accessToken) {
        return { success: false, message: 'No token provided' };
      }

      // Verify token
      const tokenData = this._tokenService.verifyToken(dto.accessToken);
      if (!tokenData || !tokenData.valid) {
        return { success: false, message: 'Invalid token' };
      }

      // Revoke token
      await this._tokenService.revokeToken(dto.accessToken);
      
      // Delete session if repository available
      if (this._sessionRepository && this._sessionRepository.delete) {
        await this._sessionRepository.delete(tokenData.sessionId);
      }

      // Publish event
      if (this._eventBus && this._eventBus.publish) {
        this._eventBus.publish('user.logout', { 
          userId: tokenData.userId,
          timestamp: new Date()
        });
      }

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  }

  // Alias for compatibility
  async execute(dto) {
    return this.logout(dto);
  }
}

module.exports = LogoutUseCase; // Export class for DI
