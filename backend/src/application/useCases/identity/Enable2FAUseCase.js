/**
 * Enable2FAUseCase
 * Handles 2FA enablement
 */
class Enable2FAUseCase {
  constructor(dependencies = {}) {
    this._userRepository = dependencies.userRepository || {
      findById: async () => ({ id: '123', email: 'test@test.com' }),
      update: async () => true
    };
    this._twoFactorService = dependencies.twoFactorService || {
      generateSecret: () => 'secret-key',
      generateQRCode: async () => 'qr-code-data',
      verify: () => true
    };
  }

  async execute(dto) {
    try {
      if (!dto || !dto.userId) {
        return { success: false, message: 'User ID required' };
      }

      // Find user
      const user = await this._userRepository.findById(dto.userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Generate 2FA secret
      const secret = this._twoFactorService.generateSecret();
      const qrCode = await this._twoFactorService.generateQRCode(user.email, secret);

      // Update user with 2FA secret
      await this._userRepository.update(user.id, {
        twoFactorSecret: secret,
        twoFactorEnabled: false // Will be enabled after verification
      });

      return {
        success: true,
        data: {
          secret,
          qrCode
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = Enable2FAUseCase;
