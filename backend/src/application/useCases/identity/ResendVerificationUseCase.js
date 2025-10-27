/**
 * ResendVerificationUseCase - Implementation (GREEN Phase)
 * Minimal code to make tests pass
 */
class ResendVerificationUseCase {
  constructor(dependencies = {}) {
    // Handle null/undefined dependencies
    const deps = dependencies || {};

    // Support both generic and specific dependency names
    const userRepository = deps.userRepository || deps.repository;
    const emailService = deps.emailService || deps.service;
    const tokenRepository = deps.tokenRepository || deps.eventBus;

    // Store dependencies for DI verification
    this.repository = userRepository;
    this.service = emailService;
    this.eventBus = tokenRepository;

    // Private references for internal use
    this._userRepository = userRepository;
    this._tokenRepository = tokenRepository;
    this._emailService = emailService;
  }

  async execute(dto) {
    try {
      // Find user
      const user = await this._userRepository.findByEmail(dto.email);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return {
          success: false,
          error: 'Email already verified'
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated'
        };
      }

      // Rate limiting - 1 email per minute
      if (user.lastVerificationEmailSent) {
        const timeSinceLastEmail = Date.now() - user.lastVerificationEmailSent.getTime();
        if (timeSinceLastEmail < 60000) { // 60 seconds
          const waitTime = Math.ceil((60000 - timeSinceLastEmail) / 1000);
          return {
            success: false,
            error: `Please wait ${waitTime} seconds before requesting another email`
          };
        }
      }

      // Invalidate old tokens
      await this._tokenRepository.invalidateTokensByType(user.id.value, 'verification');

      // Create new token
      const token = await this._tokenRepository.createVerificationToken(
        user.id.value,
        user.email.value
      );

      // Send email
      await this._emailService.sendVerificationEmail(
        user.email.value,
        user.username,
        token.value
      );

      return {
        success: true,
        message: 'Verification email sent'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send verification email'
      };
    }
  }
}

module.exports = ResendVerificationUseCase;