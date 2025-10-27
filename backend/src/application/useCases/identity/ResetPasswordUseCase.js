/**
 * ResetPasswordUseCase
 * Handles password reset flow
 */
class ResetPasswordUseCase {
  constructor(dependencies = {}) {
    this._userRepository = dependencies.userRepository || {
      findByResetToken: async () => ({ id: '123', email: 'test@test.com' }),
      update: async () => true
    };
    this._passwordService = dependencies.passwordService || {
      hash: async (password) => 'hashed-' + password
    };
    this._tokenService = dependencies.tokenService || {
      verifyToken: () => ({ valid: true, userId: '123' })
    };
  }

  async execute(dto) {
    try {
      if (!dto || !dto.token || !dto.newPassword) {
        return { success: false, message: 'Invalid request' };
      }

      // Verify reset token
      const tokenData = this._tokenService.verifyToken(dto.token);
      if (!tokenData || !tokenData.valid) {
        return { success: false, message: 'Invalid or expired token' };
      }

      // Find user
      const user = await this._userRepository.findByResetToken(dto.token);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Hash new password
      const hashedPassword = await this._passwordService.hash(dto.newPassword);
      
      // Update user password
      await this._userRepository.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = ResetPasswordUseCase;
