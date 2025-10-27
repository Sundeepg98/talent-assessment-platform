const ISessionRepository = require('../../../../domain/identity/repositories/ISessionRepository');
const SessionId = require('../../../../domain/identity/valueObjects/SessionId');
const SessionModel = require('../models/SessionModel');

/**
 * SessionRepository MongoDB Implementation
 * Infrastructure layer - Concrete implementation of ISessionRepository
 * SOLID: Dependency Inversion - Implements domain interface
 * DDD: Infrastructure layer handling persistence details
 */
class SessionRepository extends ISessionRepository {
  /**
   * Create session
   */
  async create(sessionData) {
    try {
      const session = await SessionModel.create({
        _id: sessionData.id,
        userId: sessionData.userId,
        refreshToken: sessionData.refreshToken,
        deviceInfo: sessionData.deviceInfo,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        fingerprint: sessionData.fingerprint,
        expiresAt: sessionData.expiresAt,
        lastAccessedAt: new Date(),
        isActive: true
      });
      
      return this._toDomainEntity(session.toObject());
    } catch (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Find session by ID
   */
  async findById(sessionId) {
    try {
      const session = await SessionModel.findById(sessionId).lean();
      if (!session) return null;
      
      return this._toDomainEntity(session);
    } catch (error) {
      throw new Error(`Failed to find session: ${error.message}`);
    }
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken) {
    try {
      const session = await SessionModel.findOne({
        refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).lean();
      
      if (!session) return null;
      
      return this._toDomainEntity(session);
    } catch (error) {
      throw new Error(`Failed to find session by refresh token: ${error.message}`);
    }
  }

  /**
   * Find active sessions by user
   */
  async findActiveByUserId(userId) {
    try {
      const sessions = await SessionModel.find({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      })
      .sort({ lastAccessedAt: -1 })
      .lean();
      
      return sessions.map(s => this._toDomainEntity(s));
    } catch (error) {
      throw new Error(`Failed to find user sessions: ${error.message}`);
    }
  }

  /**
   * Update session
   */
  async update(sessionData) {
    try {
      const updateData = {
        refreshToken: sessionData.refreshToken,
        refreshTokenUsedAt: sessionData.refreshTokenUsedAt,
        refreshTokenRotatedAt: sessionData.refreshTokenRotatedAt,
        lastAccessedAt: sessionData.lastAccessedAt || new Date(),
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive
      };
      
      const updated = await SessionModel.findByIdAndUpdate(
        sessionData.id,
        updateData,
        { new: true, runValidators: true }
      ).lean();
      
      if (!updated) {
        throw new Error('Session not found for update');
      }
      
      return this._toDomainEntity(updated);
    } catch (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  /**
   * Invalidate session
   */
  async invalidate(sessionId) {
    try {
      const result = await SessionModel.updateOne(
        { _id: sessionId },
        { 
          isActive: false,
          invalidatedAt: new Date()
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to invalidate session: ${error.message}`);
    }
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllByUserId(userId) {
    try {
      const result = await SessionModel.updateMany(
        { 
          userId,
          isActive: true
        },
        { 
          isActive: false,
          invalidatedAt: new Date()
        }
      );
      
      return result.modifiedCount;
    } catch (error) {
      throw new Error(`Failed to invalidate user sessions: ${error.message}`);
    }
  }

  /**
   * Delete session
   */
  async delete(sessionId) {
    try {
      const result = await SessionModel.deleteOne({ _id: sessionId });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  /**
   * Delete expired sessions
   */
  async deleteExpiredSessions() {
    try {
      const result = await SessionModel.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Failed to delete expired sessions: ${error.message}`);
    }
  }

  /**
   * Update last accessed time
   */
  async updateLastAccessed(sessionId) {
    try {
      const result = await SessionModel.updateOne(
        { _id: sessionId },
        { lastAccessedAt: new Date() }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to update last accessed: ${error.message}`);
    }
  }

  /**
   * Count sessions
   */
  async count(filter = {}) {
    try {
      return await SessionModel.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count sessions: ${error.message}`);
    }
  }

  /**
   * Convert database model to domain entity
   * @private
   */
  _toDomainEntity(persistenceModel) {
    if (!persistenceModel) return null;
    
    return {
      id: persistenceModel._id,
      userId: persistenceModel.userId,
      refreshToken: persistenceModel.refreshToken,
      refreshTokenUsedAt: persistenceModel.refreshTokenUsedAt,
      refreshTokenRotatedAt: persistenceModel.refreshTokenRotatedAt,
      deviceInfo: persistenceModel.deviceInfo,
      ipAddress: persistenceModel.ipAddress,
      userAgent: persistenceModel.userAgent,
      fingerprint: persistenceModel.fingerprint,
      expiresAt: persistenceModel.expiresAt,
      lastAccessedAt: persistenceModel.lastAccessedAt,
      isActive: persistenceModel.isActive,
      createdAt: persistenceModel.createdAt,
      invalidatedAt: persistenceModel.invalidatedAt
    };
  }
}

module.exports = SessionRepository;