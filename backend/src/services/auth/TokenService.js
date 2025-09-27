/**
 * TokenService Implementation
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles token operations
 * - Open/Closed: Extensible through inheritance, closed for modification
 * - Liskov Substitution: Can be replaced with any ITokenService implementation
 * - Interface Segregation: Implements focused ITokenService interface
 * - Dependency Inversion: Depends on abstractions (jwt library injected)
 */

const crypto = require('crypto');
const ITokenService = require('../../core/contracts/ITokenService');

class TokenService extends ITokenService {
  constructor(config = {}) {
    super();
    
    // Dependency Injection for all external dependencies
    this.jwt = config.jwt || require('jsonwebtoken');
    this.crypto = config.crypto || crypto;
    
    // Configuration injection (no direct process.env access)
    this.config = {
      accessTokenSecret: config.accessTokenSecret || 'default-access-secret',
      refreshTokenSecret: config.refreshTokenSecret || config.accessTokenSecret || 'default-refresh-secret',
      accessTokenExpiry: config.accessTokenExpiry || '15m',
      refreshTokenExpiry: config.refreshTokenExpiry || '7d',
      verificationTokenExpiry: config.verificationTokenExpiry || '24h',
      algorithm: config.algorithm || 'HS256',
      issuer: config.issuer || 'talent-assessment-platform',
      audience: config.audience || 'talent-assessment-users'
    };
    
    // Token blacklist storage (can be replaced with Redis/DB)
    this.blacklistedTokens = config.blacklistStore || new Set();
    
    // Token metadata storage
    this.tokenMetadata = config.metadataStore || new Map();
  }

  /**
   * Generate access token with standard claims
   * @param {Object} payload - Token payload
   * @returns {string} Generated JWT token
   */
  generateAccessToken(payload) {
    if (!payload) {
      throw new Error('Payload is required for token generation');
    }

    const tokenId = this.crypto.randomBytes(16).toString('hex');
    
    const tokenPayload = {
      ...payload,
      jti: tokenId, // JWT ID for tracking
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      iss: this.config.issuer,
      aud: this.config.audience
    };

    const token = this.jwt.sign(
      tokenPayload,
      this.config.accessTokenSecret,
      {
        expiresIn: this.config.accessTokenExpiry,
        algorithm: this.config.algorithm
      }
    );

    // Store metadata for tracking
    this.tokenMetadata.set(tokenId, {
      type: 'access',
      userId: payload.userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this._parseExpiry(this.config.accessTokenExpiry))
    });

    return token;
  }

  /**
   * Generate refresh token with rotation support
   * @param {Object} payload - Token payload
   * @returns {string} Generated refresh token
   */
  generateRefreshToken(payload) {
    if (!payload) {
      throw new Error('Payload is required for refresh token generation');
    }

    const tokenId = this.crypto.randomBytes(32).toString('hex');
    const familyId = payload.familyId || this.crypto.randomBytes(16).toString('hex');
    
    const tokenPayload = {
      ...payload,
      jti: tokenId,
      familyId, // For token rotation detection
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      iss: this.config.issuer,
      aud: this.config.audience
    };

    const token = this.jwt.sign(
      tokenPayload,
      this.config.refreshTokenSecret,
      {
        expiresIn: this.config.refreshTokenExpiry,
        algorithm: this.config.algorithm
      }
    );

    // Store metadata for rotation tracking
    this.tokenMetadata.set(tokenId, {
      type: 'refresh',
      userId: payload.userId,
      familyId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this._parseExpiry(this.config.refreshTokenExpiry)),
      used: false
    });

    return token;
  }

  /**
   * Generate email verification token
   * @param {string} userId - User identifier
   * @param {string} email - User email
   * @returns {string} Generated verification token
   */
  generateVerificationToken(userId, email) {
    if (!userId || !email) {
      throw new Error('User ID and email are required for verification token');
    }

    const verificationCode = this.crypto.randomBytes(32).toString('hex');
    
    const tokenPayload = {
      userId,
      email,
      code: verificationCode,
      type: 'email-verification',
      iat: Math.floor(Date.now() / 1000),
      iss: this.config.issuer
    };

    const token = this.jwt.sign(
      tokenPayload,
      this.config.accessTokenSecret,
      {
        expiresIn: this.config.verificationTokenExpiry,
        algorithm: this.config.algorithm
      }
    );

    return token;
  }

  /**
   * Verify any token and return validation result
   * @param {string} token - Token to verify
   * @param {Object} options - Verification options
   * @returns {{valid: boolean, payload?: Object, error?: string}}
   */
  verifyToken(token, options = {}) {
    if (!token) {
      return { valid: false, error: 'Token is required' };
    }

    try {
      // Determine which secret to use based on token type
      const decoded = this.jwt.decode(token, { complete: false });
      const secret = decoded?.type === 'refresh' 
        ? this.config.refreshTokenSecret 
        : this.config.accessTokenSecret;

      const verifyOptions = {
        algorithms: [this.config.algorithm],
        issuer: this.config.issuer,
        ...options
      };

      if (!options.ignoreExpiration) {
        verifyOptions.clockTolerance = 30; // 30 seconds clock skew tolerance
      }

      const payload = this.jwt.verify(token, secret, verifyOptions);

      // Check if token is blacklisted
      if (payload.jti && this.blacklistedTokens.has(payload.jti)) {
        return { valid: false, error: 'Token has been revoked' };
      }

      // Check token family for refresh tokens
      if (payload.type === 'refresh' && payload.jti) {
        const metadata = this.tokenMetadata.get(payload.jti);
        if (metadata?.used) {
          // Token reuse detected - security breach
          this._revokeTokenFamily(payload.familyId);
          return { valid: false, error: 'Token reuse detected - possible security breach' };
        }
      }

      return { valid: true, payload };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, error: 'Token has expired', expired: true };
      }
      if (error.name === 'JsonWebTokenError') {
        return { valid: false, error: 'Invalid token format' };
      }
      return { valid: false, error: error.message };
    }
  }

  /**
   * Decode token without verification (for debugging/inspection)
   * @param {string} token - Token to decode
   * @returns {Object|null} Decoded payload or null
   */
  decodeToken(token) {
    if (!token) {
      return null;
    }

    try {
      return this.jwt.decode(token, { complete: false });
    } catch {
      return null;
    }
  }

  /**
   * Revoke a token by adding to blacklist
   * @param {string} token - Token to revoke
   * @returns {Promise<boolean>} Success status
   */
  async revokeToken(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (decoded?.jti) {
        this.blacklistedTokens.add(decoded.jti);
        
        // Update metadata if exists
        const metadata = this.tokenMetadata.get(decoded.jti);
        if (metadata) {
          metadata.revoked = true;
          metadata.revokedAt = new Date();
          this.tokenMetadata.set(decoded.jti, metadata);
        }

        // In production, persist to database
        if (this.config.persistRevocation) {
          await this._persistRevocation(decoded.jti);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }

  /**
   * Check if token is revoked
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} True if revoked
   */
  async isTokenRevoked(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (decoded?.jti) {
        // Check in-memory blacklist
        if (this.blacklistedTokens.has(decoded.jti)) {
          return true;
        }

        // In production, check database
        if (this.config.checkPersistentRevocation) {
          return await this._checkPersistentRevocation(decoded.jti);
        }
      }

      return false;
    } catch {
      return true; // Treat invalid tokens as revoked
    }
  }

  /**
   * Verify access token specifically
   * @param {string} token - Access token
   * @returns {Object} Verification result
   */
  verifyAccessToken(token) {
    const result = this.verifyToken(token);
    
    if (result.valid && result.payload?.type !== 'access') {
      return { valid: false, error: 'Invalid token type' };
    }

    return result;
  }

  /**
   * Verify refresh token specifically
   * @param {string} token - Refresh token
   * @returns {Object} Verification result
   */
  verifyRefreshToken(token) {
    const result = this.verifyToken(token);
    
    if (result.valid && result.payload?.type !== 'refresh') {
      return { valid: false, error: 'Invalid token type' };
    }

    return result;
  }

  /**
   * Rotate refresh token (mark old as used, generate new)
   * @param {string} oldToken - Current refresh token
   * @returns {Promise<{success: boolean, newToken?: string, error?: string}>}
   */
  async rotateRefreshToken(oldToken) {
    const verification = this.verifyRefreshToken(oldToken);
    
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    const payload = verification.payload;
    
    // Mark old token as used
    if (payload.jti) {
      const metadata = this.tokenMetadata.get(payload.jti);
      if (metadata) {
        metadata.used = true;
        metadata.usedAt = new Date();
        this.tokenMetadata.set(payload.jti, metadata);
      }
    }

    // Generate new token with same family ID
    const newToken = this.generateRefreshToken({
      userId: payload.userId,
      familyId: payload.familyId
    });

    return { success: true, newToken };
  }

  /**
   * Cleanup expired tokens from storage
   * @returns {number} Number of tokens cleaned
   */
  cleanupExpiredTokens() {
    let cleaned = 0;
    const now = Date.now();

    for (const [tokenId, metadata] of this.tokenMetadata.entries()) {
      if (metadata.expiresAt && metadata.expiresAt.getTime() < now) {
        this.tokenMetadata.delete(tokenId);
        this.blacklistedTokens.delete(tokenId);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Private helper methods

  /**
   * Parse expiry string to milliseconds
   * @private
   */
  _parseExpiry(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const [, value, unit] = match;
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    return parseInt(value) * (multipliers[unit] || 0);
  }

  /**
   * Revoke entire token family (for security breach)
   * @private
   */
  _revokeTokenFamily(familyId) {
    for (const [tokenId, metadata] of this.tokenMetadata.entries()) {
      if (metadata.familyId === familyId) {
        this.blacklistedTokens.add(tokenId);
        metadata.revoked = true;
        metadata.revokedAt = new Date();
        this.tokenMetadata.set(tokenId, metadata);
      }
    }
  }

  /**
   * Persist revocation to database (override in production)
   * @private
   */
  async _persistRevocation(tokenId) {
    // Override this method to persist to database
    return true;
  }

  /**
   * Check persistent revocation from database (override in production)
   * @private
   */
  async _checkPersistentRevocation(tokenId) {
    // Override this method to check database
    return false;
  }

  /**
   * Get token statistics for monitoring
   */
  getStatistics() {
    const stats = {
      total: this.tokenMetadata.size,
      blacklisted: this.blacklistedTokens.size,
      active: 0,
      expired: 0,
      used: 0
    };

    const now = Date.now();

    for (const metadata of this.tokenMetadata.values()) {
      if (metadata.revoked) continue;
      
      if (metadata.expiresAt && metadata.expiresAt.getTime() < now) {
        stats.expired++;
      } else if (metadata.used) {
        stats.used++;
      } else {
        stats.active++;
      }
    }

    return stats;
  }
}

module.exports = TokenService;