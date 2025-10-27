/**
 * UpdateProfileUseCase
 * DDD: Application service for updating user profile
 * SOLID: Single Responsibility - Profile updates only
 */
class UpdateProfileUseCase {
  constructor(userRepository) {
    this._userRepository = userRepository;
  }

  async execute(dto) {
    try {
      // Validate input
      if (!dto.userId) {
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

      // Validate updates
      const validation = this._validateUpdates(dto.updates);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Update profile fields
      if (dto.updates.username && dto.updates.username !== user.username) {
        // Check username availability
        const existingUsername = await this._userRepository.usernameExists(dto.updates.username);
        if (existingUsername) {
          return {
            success: false,
            error: 'Username already taken'
          };
        }
        user.username = dto.updates.username.toLowerCase();
      }

      // Update profile object
      const profileUpdates = {};
      const profileFields = [
        'firstName', 'lastName', 'phone', 'avatar', 'bio',
        'company', 'position', 'location', 'skills', 'experience',
        'linkedIn', 'github', 'portfolio'
      ];

      profileFields.forEach(field => {
        if (dto.updates[field] !== undefined) {
          profileUpdates[field] = dto.updates[field];
        }
      });

      if (Object.keys(profileUpdates).length > 0) {
        user.updateProfile(profileUpdates);
      }

      // Update roles if admin
      if (dto.updates.roles && dto.isAdmin) {
        user.roles = dto.updates.roles;
      }

      // Save user
      const updatedUser = await this._userRepository.save(user);

      return {
        success: true,
        user: this._mapUserToDTO(updatedUser),
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  _validateUpdates(updates) {
    // Username validation
    if (updates.username) {
      if (updates.username.length < 3 || updates.username.length > 30) {
        return { valid: false, error: 'Username must be between 3 and 30 characters' };
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(updates.username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
      }
    }

    // Phone validation
    if (updates.phone) {
      if (!/^\+?[\d\s-()]+$/.test(updates.phone)) {
        return { valid: false, error: 'Invalid phone number format' };
      }
    }

    // URL validations
    const urlFields = ['avatar', 'linkedIn', 'github', 'portfolio'];
    for (const field of urlFields) {
      if (updates[field]) {
        try {
          new URL(updates[field]);
        } catch {
          return { valid: false, error: `Invalid ${field} URL` };
        }
      }
    }

    // Skills validation
    if (updates.skills) {
      if (!Array.isArray(updates.skills)) {
        return { valid: false, error: 'Skills must be an array' };
      }
      if (updates.skills.length > 50) {
        return { valid: false, error: 'Maximum 50 skills allowed' };
      }
    }

    return { valid: true };
  }

  _mapUserToDTO(user) {
    return {
      id: user.id.value,
      email: user.email.value,
      username: user.username,
      roles: user.roles,
      profile: user.profile,
      updatedAt: user.updatedAt
    };
  }
}

module.exports = UpdateProfileUseCase;