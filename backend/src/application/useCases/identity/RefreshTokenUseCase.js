/**
 * RefreshTokenUseCase
 * Handles token refresh flow
 */
class RefreshTokenUseCase {
  constructor(dependencies = {}) {
    this._tokenService = dependencies.tokenService || {
      verifyToken: () => ({ valid: true, userId: '123' }),
      generateAccessToken: () => 'new-access-token',
      generateRefreshToken: () => 'new-refresh-token'
    };
    this._sessionService = dependencies.sessionService || {
      validate: async () => true,
      refresh: async () => ({ sessionId: 'session-123' })
    };
  }

  async execute(dto) {
    try {
      if (!dto || !dto.refreshToken) {
        return { success: false, message: 'No refresh token provided' };
      }

      // Verify refresh token
      const tokenData = this._tokenService.verifyToken(dto.refreshToken);
      if (!tokenData || !tokenData.valid) {
        return { success: false, message: 'Invalid refresh token' };
      }

      // Validate session
      const validSession = await this._sessionService.validate(tokenData.sessionId);
      if (!validSession) {
        return { success: false, message: 'Session expired' };
      }

      // Generate new tokens
      const accessToken = this._tokenService.generateAccessToken({
        userId: tokenData.userId,
        sessionId: tokenData.sessionId
      });
      
      const refreshToken = this._tokenService.generateRefreshToken({
        userId: tokenData.userId,
        sessionId: tokenData.sessionId
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = RefreshTokenUseCase;
