const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class RefreshTokenService {
  constructor() {
    this.refreshTokens = new Map(); // In production, use Redis or database
    this.tokenFamily = new Map(); // Track token families for rotation
  }

  generateTokenPair(userId, userData) {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { userId, ...userData },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // 15 minutes
    );

    // Generate refresh token (long-lived)
    const refreshTokenId = crypto.randomBytes(32).toString('hex');
    const refreshToken = jwt.sign(
      { 
        tokenId: refreshTokenId,
        userId,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 days
    );

    // Create token family for rotation detection
    const familyId = crypto.randomBytes(16).toString('hex');
    
    // Store refresh token
    this.refreshTokens.set(refreshTokenId, {
      userId,
      familyId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      used: false,
      revoked: false
    });

    // Track token family
    this.tokenFamily.set(familyId, {
      userId,
      tokens: [refreshTokenId],
      createdAt: new Date()
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer'
    };
  }

  async rotateTokens(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const tokenData = this.refreshTokens.get(decoded.tokenId);

      if (!tokenData) {
        throw new Error('Token not found');
      }

      if (tokenData.revoked) {
        // Possible token reuse attack - revoke entire family
        this.revokeTokenFamily(tokenData.familyId);
        throw new Error('Token has been revoked - possible security breach');
      }

      if (tokenData.used) {
        // Token reuse detected - revoke entire family
        this.revokeTokenFamily(tokenData.familyId);
        throw new Error('Token reuse detected - all tokens revoked');
      }

      if (new Date() > tokenData.expiresAt) {
        throw new Error('Token has expired');
      }

      // Mark current token as used
      tokenData.used = true;
      this.refreshTokens.set(decoded.tokenId, tokenData);

      // Generate new token pair
      const newTokenPair = this.generateTokenPair(decoded.userId, {});
      
      // Add new token to same family
      const family = this.tokenFamily.get(tokenData.familyId);
      if (family) {
        // Extract tokenId from the new refresh token
        const newDecoded = jwt.decode(newTokenPair.refreshToken);
        family.tokens.push(newDecoded.tokenId);
        this.tokenFamily.set(tokenData.familyId, family);

        // Update new token with family ID
        const newTokenData = this.refreshTokens.get(newDecoded.tokenId);
        if (newTokenData) {
          newTokenData.familyId = tokenData.familyId;
          this.refreshTokens.set(newDecoded.tokenId, newTokenData);
        }
      }

      return {
        success: true,
        ...newTokenPair
      };

    } catch (error) {
      console.error('Token rotation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  revokeToken(tokenId) {
    const tokenData = this.refreshTokens.get(tokenId);
    
    if (tokenData) {
      tokenData.revoked = true;
      tokenData.revokedAt = new Date();
      this.refreshTokens.set(tokenId, tokenData);
      return true;
    }

    return false;
  }

  revokeTokenFamily(familyId) {
    const family = this.tokenFamily.get(familyId);
    
    if (family) {
      // Revoke all tokens in the family
      for (const tokenId of family.tokens) {
        this.revokeToken(tokenId);
      }
      
      // Mark family as compromised
      family.compromised = true;
      family.compromisedAt = new Date();
      this.tokenFamily.set(familyId, family);

      return family.tokens.length;
    }

    return 0;
  }

  revokeAllUserTokens(userId) {
    let revokedCount = 0;

    // Revoke all refresh tokens for user
    for (const [tokenId, tokenData] of this.refreshTokens.entries()) {
      if (tokenData.userId === userId && !tokenData.revoked) {
        tokenData.revoked = true;
        tokenData.revokedAt = new Date();
        this.refreshTokens.set(tokenId, tokenData);
        revokedCount++;
      }
    }

    return revokedCount;
  }

  cleanExpiredTokens() {
    const now = new Date();
    let cleaned = 0;

    // Clean expired and revoked tokens older than 30 days
    const cleanupThreshold = new Date(now - 30 * 24 * 60 * 60 * 1000);

    for (const [tokenId, tokenData] of this.refreshTokens.entries()) {
      if (tokenData.expiresAt < now || 
          (tokenData.revoked && tokenData.revokedAt < cleanupThreshold)) {
        this.refreshTokens.delete(tokenId);
        cleaned++;
      }
    }

    // Clean old token families
    for (const [familyId, family] of this.tokenFamily.entries()) {
      const allTokensClean = family.tokens.every(
        tokenId => !this.refreshTokens.has(tokenId)
      );

      if (allTokensClean) {
        this.tokenFamily.delete(familyId);
      }
    }

    return cleaned;
  }

  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { valid: true, userId: decoded.userId, data: decoded };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, expired: true, error: 'Token expired' };
      }
      return { valid: false, error: error.message };
    }
  }

  // Get token statistics
  getStatistics() {
    let active = 0;
    let used = 0;
    let revoked = 0;
    let expired = 0;
    const now = new Date();

    for (const tokenData of this.refreshTokens.values()) {
      if (tokenData.revoked) revoked++;
      else if (tokenData.used) used++;
      else if (tokenData.expiresAt < now) expired++;
      else active++;
    }

    return {
      total: this.refreshTokens.size,
      active,
      used,
      revoked,
      expired,
      families: this.tokenFamily.size
    };
  }
}

module.exports = RefreshTokenService;