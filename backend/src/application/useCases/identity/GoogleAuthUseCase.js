const User = require('../../../domain/identity/entities/User');
const UserId = require('../../../domain/identity/valueObjects/UserId');
const Email = require('../../../domain/identity/valueObjects/Email');
const Password = require('../../../domain/identity/valueObjects/Password');

/**
 * GoogleAuthUseCase
 * DDD: Application service for Google OAuth authentication
 * SOLID: Single Responsibility - Google auth only
 */
class GoogleAuthUseCase {
  constructor(userRepository, sessionRepository, jwtService) {
    this._userRepository = userRepository;
    this._sessionRepository = sessionRepository;
    this._jwtService = jwtService;
  }

  async execute(dto) {
    try {
      // Find or create user
      let user = await this._userRepository.findByEmail(dto.email);
      
      if (!user) {
        // Create new user from Google data
        const userId = new UserId();
        const email = new Email(dto.email);
        const randomPassword = await Password.create(this._generateRandomPassword());
        
        user = new User({
          id: userId,
          email,
          password: randomPassword,
          username: dto.email.split('@')[0],
          isEmailVerified: true, // Google accounts are pre-verified
          roles: ['candidate'],
          profile: {
            firstName: dto.name?.split(' ')[0],
            lastName: dto.name?.split(' ').slice(1).join(' '),
            avatar: dto.picture
          },
          googleId: dto.googleId
        });
        
        user = await this._userRepository.save(user);
      } else {
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = dto.googleId;
          user = await this._userRepository.save(user);
        }
      }

      // Create session
      const sessionId = this._generateSessionId();
      await this._sessionRepository.create({
        id: sessionId,
        userId: user.id.value,
        refreshToken: this._jwtService.generateRefreshToken({
          sessionId,
          userId: user.id.value
        }),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        fingerprint: `google-${dto.googleId}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Generate tokens
      const accessToken = this._jwtService.generateAccessToken({
        userId: user.id.value,
        email: user.email.value,
        roles: user.roles
      });

      const refreshToken = this._jwtService.generateRefreshToken({
        sessionId,
        userId: user.id.value
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: this._mapUserToDTO(user)
      };

    } catch (error) {
      console.error('Google auth error:', error);
      return {
        success: false,
        error: error.message || 'Google authentication failed'
      };
    }
  }

  _generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 20; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  _generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  _mapUserToDTO(user) {
    return {
      id: user.id.value,
      email: user.email.value,
      username: user.username,
      roles: user.roles,
      profile: user.profile,
      isEmailVerified: user.isEmailVerified
    };
  }
}

module.exports = GoogleAuthUseCase;