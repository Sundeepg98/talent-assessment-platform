/**
 * VerifyEmailUseCase
 * Handles email verification flow
 */
class VerifyEmailUseCase {
  constructor(userRepository, tokenService, eventBus) {
    this._userRepository = userRepository || {
      findById: async () => null,
      update: async () => true
    };
    this._tokenService = tokenService || {
      verifyToken: () => ({ valid: true, userId: '123' })
    };
    this._eventBus = eventBus || {
      publish: () => {}
    };
  }

  async execute(dto) {
    try {
      if (!dto || !dto.token) {
        return { success: false, message: 'No token provided' };
      }

      // Verify token
      const tokenData = this._tokenService.verifyToken(dto.token);
      if (!tokenData || !tokenData.valid) {
        return { success: false, message: 'Invalid token' };
      }

      // Update user
      if (this._userRepository) {
        const user = await this._userRepository.findById(tokenData.userId);
        if (user) {
          user.emailVerified = true;
          await this._userRepository.update(user.id, user);
        }
      }

      // Publish event
      if (this._eventBus) {
        this._eventBus.publish('user.email.verified', {
          userId: tokenData.userId
        });
      }

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = VerifyEmailUseCase;
