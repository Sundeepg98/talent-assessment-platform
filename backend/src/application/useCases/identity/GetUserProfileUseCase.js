/**
 * GetUserProfileUseCase
 * DDD: Application service for retrieving user profile
 * SOLID: Single Responsibility - User profile retrieval
 */
class GetUserProfileUseCase {
  constructor(dependencies = {}) {
    // Handle null/undefined dependencies
    const deps = dependencies || {};

    // Support both generic and specific dependency names
    const userRepository = deps.userRepository || deps.repository;

    // Store dependency for DI verification
    this.repository = userRepository;
    this.service = deps.service || null; // No service needed typically
    this.eventBus = deps.eventBus || null; // No event bus needed typically

    // Private reference for internal use
    this._userRepository = userRepository;
  }

  async execute(dto) {
    try {
      // Validate input - handle null/undefined dto
      if (!dto || !dto.userId) {
        return {
          success: false,
          error: 'User ID is required'
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

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated'
        };
      }

      return {
        success: true,
        user: this._mapUserToDTO(user)
      };

    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get profile'
      };
    }
  }

  _mapUserToDTO(user) {
    return {
      id: user.id.value,
      email: user.email.value,
      username: user.username,
      roles: user.roles,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      profile: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        phone: user.profile?.phone,
        avatar: user.profile?.avatar,
        bio: user.profile?.bio,
        company: user.profile?.company,
        position: user.profile?.position,
        location: user.profile?.location,
        skills: user.profile?.skills || [],
        experience: user.profile?.experience,
        linkedIn: user.profile?.linkedIn,
        github: user.profile?.github,
        portfolio: user.profile?.portfolio
      },
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

module.exports = GetUserProfileUseCase;