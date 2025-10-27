const ITokenRepository = require('../../../../domain/identity/repositories/ITokenRepository');
const VerificationToken = require('../../../../domain/identity/valueObjects/VerificationToken');
const ResetToken = require('../../../../domain/identity/valueObjects/ResetToken');
const TokenModel = require('../models/TokenModel');

/**
 * TokenRepository MongoDB Implementation
 * Infrastructure layer - Concrete implementation of ITokenRepository
 * SOLID: Dependency Inversion - Implements domain interface
 * DDD: Infrastructure layer handling persistence details
 */
class TokenRepository extends ITokenRepository {
  /**
   * Create verification token
   */
  async createVerificationToken(userId, email) {
    try {
      const token = new VerificationToken();
      
      await TokenModel.create({
        userId,
        email,
        type: 'verification',
        token: token.value,
        expiresAt: token.expiresAt
      });
      
      return token;
    } catch (error) {
      throw new Error(`Failed to create verification token: ${error.message}`);
    }
  }

  /**
   * Create password reset token
   */
  async createResetToken(userId, email) {
    try {
      const token = new ResetToken();
      
      await TokenModel.create({
        userId,
        email,
        type: 'reset',
        token: token.value,
        code: token.code,
        expiresAt: token.expiresAt
      });
      
      return token;
    } catch (error) {
      throw new Error(`Failed to create reset token: ${error.message}`);
    }
  }

  /**
   * Verify token
   */
  async verifyToken(token, type) {
    try {
      const tokenData = await TokenModel.findOne({
        token,
        type,
        used: false,
        expiresAt: { $gt: new Date() }
      }).lean();
      
      if (!tokenData) return null;
      
      return {
        userId: tokenData.userId,
        email: tokenData.email,
        type: tokenData.type
      };
    } catch (error) {
      throw new Error(`Failed to verify token: ${error.message}`);
    }
  }

  /**
   * Verify reset code
   */
  async verifyResetCode(email, code) {
    try {
      const tokenData = await TokenModel.findOne({
        email: email.toLowerCase(),
        code,
        type: 'reset',
        used: false,
        expiresAt: { $gt: new Date() }
      }).lean();
      
      if (!tokenData) return null;
      
      return {
        userId: tokenData.userId,
        email: tokenData.email,
        token: tokenData.token
      };
    } catch (error) {
      throw new Error(`Failed to verify reset code: ${error.message}`);
    }
  }

  /**
   * Mark token as used
   */
  async markTokenAsUsed(token) {
    try {
      const result = await TokenModel.updateOne(
        { token },
        { 
          used: true, 
          usedAt: new Date() 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to mark token as used: ${error.message}`);
    }
  }

  /**
   * Delete expired tokens
   */
  async deleteExpiredTokens() {
    try {
      const result = await TokenModel.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Failed to delete expired tokens: ${error.message}`);
    }
  }

  /**
   * Delete tokens by user
   */
  async deleteTokensByUserId(userId) {
    try {
      const result = await TokenModel.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Failed to delete user tokens: ${error.message}`);
    }
  }

  /**
   * Find active tokens by user
   */
  async findActiveTokensByUserId(userId) {
    try {
      const tokens = await TokenModel.find({
        userId,
        used: false,
        expiresAt: { $gt: new Date() }
      }).lean();
      
      return tokens.map(t => ({
        token: t.token,
        type: t.type,
        expiresAt: t.expiresAt
      }));
    } catch (error) {
      throw new Error(`Failed to find active tokens: ${error.message}`);
    }
  }

  /**
   * Invalidate all tokens by type for user
   */
  async invalidateTokensByType(userId, type) {
    try {
      const result = await TokenModel.updateMany(
        { 
          userId,
          type,
          used: false
        },
        { 
          used: true,
          invalidatedAt: new Date()
        }
      );
      
      return result.modifiedCount;
    } catch (error) {
      throw new Error(`Failed to invalidate tokens: ${error.message}`);
    }
  }

  /**
   * Count tokens
   */
  async count(filter = {}) {
    try {
      return await TokenModel.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count tokens: ${error.message}`);
    }
  }
}

module.exports = TokenRepository;