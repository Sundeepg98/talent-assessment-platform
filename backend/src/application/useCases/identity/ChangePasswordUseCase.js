const Password = require('../../../domain/identity/valueObjects/Password');

/**
 * ChangePasswordUseCase
 * DDD: Application service for password change
 * SOLID: Single Responsibility - Password change for authenticated users
 */
class ChangePasswordUseCase {
  constructor(userRepository, sessionRepository) {
    this._userRepository = userRepository;
    this._sessionRepository = sessionRepository;
  }

  async execute(dto) {
    try {
      // Validate input
      if (!dto.userId || !dto.currentPassword || !dto.newPassword) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      // Get user
      const user = await this._userRepository.findById(dto.userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify current password
      const isValidPassword = await user.password.compare(dto.currentPassword);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Validate new password strength
      if (!Password.isValid(dto.newPassword)) {
        return {
          success: false,
          error: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character'
        };
      }

      // Check password history (prevent reuse)
      if (await user.password.compare(dto.newPassword)) {
        return {
          success: false,
          error: 'New password must be different from current password'
        };
      }

      // Change password
      const newPassword = await Password.create(dto.newPassword);
      user.changePassword(newPassword);

      // Save user
      await this._userRepository.save(user);

      // Invalidate all sessions except current (optional)
      if (dto.invalidateOtherSessions) {
        await this._sessionRepository.invalidateAllByUserId(dto.userId);
      }

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to change password'
      };
    }
  }
}

module.exports = ChangePasswordUseCase;