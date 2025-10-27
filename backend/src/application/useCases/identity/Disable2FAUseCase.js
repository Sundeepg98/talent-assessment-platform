/**
 * Disable2FAUseCase
 * Handles 2FA disablement
 */
class Disable2FAUseCase {
  constructor(dependencies = {}) {
    this._userRepository = dependencies.userRepository || {
      findById: async () => ({ id: '123', twoFactorEnabled: true }),
      update: async () => true
    };
    this._twoFactorService = dependencies.twoFactorService || {
      verify: () => true
    };
  }

  async execute(dto) {
    try {
      if (!dto || !dto.userId || !dto.code) {
        return { success: false, message: 'User ID and code required' };
      }

      // Find user
      const user = await this._userRepository.findById(dto.userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.twoFactorEnabled) {
        return { success: false, message: '2FA not enabled' };
      }

      // Verify 2FA code
      const valid = this._twoFactorService.verify(user.twoFactorSecret, dto.code);
      if (!valid) {
        return { success: false, message: 'Invalid 2FA code' };
      }

      // Disable 2FA
      await this._userRepository.update(user.id, {
        twoFactorEnabled: false,
        twoFactorSecret: null
      });

      return { success: true, message: '2FA disabled successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = Disable2FAUseCase;
