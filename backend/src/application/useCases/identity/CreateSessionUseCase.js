/**
 * CreateSessionUseCase
 * Creates new user session
 */
class CreateSessionUseCase {
  constructor(dependencies = {}) {
    this._userRepository = dependencies.userRepository || {
      findByEmail: async () => ({ id: '123', email: 'test@test.com' })
    };
    this._sessionService = dependencies.sessionService || {
      create: async () => ({ sessionId: 'session-123' })
    };
    this._tokenService = dependencies.tokenService || {
      generateAccessToken: () => 'access-token',
      generateRefreshToken: () => 'refresh-token'
    };
    this._passwordService = dependencies.passwordService || {
      verify: async () => true
    };
  }

  async execute(dto) {
    try {
      if (!dto || !dto.email || !dto.password) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Find user
      const user = await this._userRepository.findByEmail(dto.email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify password
      const validPassword = await this._passwordService.verify(dto.password, user.password);
      if (!validPassword) {
        return { success: false, message: 'Invalid password' };
      }

      // Create session
      const session = await this._sessionService.create(user.id);
      
      // Generate tokens
      const accessToken = this._tokenService.generateAccessToken({ 
        userId: user.id,
        sessionId: session.sessionId 
      });
      const refreshToken = this._tokenService.generateRefreshToken({ 
        userId: user.id 
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email
          }
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = CreateSessionUseCase;
