const ResetToken = require('../../../domain/identity/valueObjects/ResetToken');

/**
 * ForgotPasswordUseCase
 * DDD: Application service for password reset request
 * SOLID: Single Responsibility - Password reset initiation
 */
class ForgotPasswordUseCase {
  constructor(userRepository, tokenRepository, emailService) {
    this._userRepository = userRepository;
    this._tokenRepository = tokenRepository;
    this._emailService = emailService;
  }

  async execute(dto) {
    try {
      // Always return success to prevent email enumeration
      const defaultResponse = {
        success: true,
        message: 'If the email exists, a reset link has been sent'
      };

      // Find user by email
      const user = await this._userRepository.findByEmail(dto.email);
      
      if (!user) {
        // Return success even if user doesn't exist (security)
        return defaultResponse;
      }

      // Check if user is active
      if (!user.isActive) {
        return defaultResponse;
      }

      // Invalidate any existing reset tokens
      await this._tokenRepository.invalidateTokensByType(
        user.id.value,
        'reset'
      );

      // Create new reset token
      const resetToken = await this._tokenRepository.createResetToken(
        user.id.value,
        user.email.value
      );

      // Send reset email
      await this._emailService.sendPasswordResetEmail(
        user.email.value,
        user.username || user.profile?.firstName || 'User',
        resetToken.value,
        resetToken.code
      );

      // Log the reset request for security
      user.recordPasswordResetRequest(dto.ipAddress);
      await this._userRepository.save(user);

      return defaultResponse;

    } catch (error) {
      console.error('Forgot password error:', error);
      // Still return success to prevent information leakage
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent'
      };
    }
  }
}

module.exports = ForgotPasswordUseCase;