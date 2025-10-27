/**
 * DeleteAccountUseCase - IMPLEMENTATION (GREEN Phase)
 * Written AFTER the test to make it pass
 * This is the minimal code needed to satisfy the test
 */
class DeleteAccountUseCase {
  constructor(userRepository, sessionRepository, tokenRepository) {
    this._userRepository = userRepository;
    this._sessionRepository = sessionRepository;
    this._tokenRepository = tokenRepository;
  }

  async execute(dto) {
    try {
      // Check confirmation
      if (dto.confirmation !== 'DELETE') {
        return {
          success: false,
          error: 'Confirmation does not match. Type "DELETE" to confirm'
        };
      }

      // Find user
      const user = await this._userRepository.findById(dto.userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify password
      const isValidPassword = await user.password.compare(dto.password);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid password'
        };
      }

      // Delete all user data
      await this._sessionRepository.invalidateAllByUserId(dto.userId);
      await this._tokenRepository.deleteTokensByUserId(dto.userId);
      await this._userRepository.delete(dto.userId);

      return {
        success: true,
        message: 'Account deleted successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DeleteAccountUseCase;