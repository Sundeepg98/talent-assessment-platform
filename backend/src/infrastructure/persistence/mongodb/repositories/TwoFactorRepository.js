const ITwoFactorRepository = require('../../../../domain/identity/repositories/ITwoFactorRepository');
const TwoFactorSecret = require('../../../../domain/identity/valueObjects/TwoFactorSecret');
const TwoFactorModel = require('../models/TwoFactorModel');

/**
 * TwoFactorRepository MongoDB Implementation
 * Infrastructure layer - Concrete implementation of ITwoFactorRepository
 * SOLID: Dependency Inversion - Implements domain interface
 * DDD: Infrastructure layer handling persistence details
 */
class TwoFactorRepository extends ITwoFactorRepository {
  /**
   * Save 2FA configuration
   */
  async save(twoFactorData) {
    try {
      const data = {
        userId: twoFactorData.userId,
        secret: twoFactorData.secret,
        backupCodes: twoFactorData.backupCodes,
        isEnabled: twoFactorData.isEnabled,
        enabledAt: twoFactorData.enabledAt,
        lastUsedAt: twoFactorData.lastUsedAt,
        method: twoFactorData.method || 'totp'
      };
      
      const saved = await TwoFactorModel.findOneAndUpdate(
        { userId: twoFactorData.userId },
        data,
        { 
          upsert: true, 
          new: true,
          runValidators: true 
        }
      ).lean();
      
      return this._toDomainEntity(saved);
    } catch (error) {
      throw new Error(`Failed to save 2FA configuration: ${error.message}`);
    }
  }

  /**
   * Find by user ID
   */
  async findByUserId(userId) {
    try {
      const config = await TwoFactorModel.findOne({ userId }).lean();
      if (!config) return null;
      
      return this._toDomainEntity(config);
    } catch (error) {
      throw new Error(`Failed to find 2FA configuration: ${error.message}`);
    }
  }

  /**
   * Enable 2FA
   */
  async enable(userId) {
    try {
      const result = await TwoFactorModel.updateOne(
        { userId },
        { 
          isEnabled: true,
          enabledAt: new Date()
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to enable 2FA: ${error.message}`);
    }
  }

  /**
   * Disable 2FA
   */
  async disable(userId) {
    try {
      const result = await TwoFactorModel.updateOne(
        { userId },
        { 
          isEnabled: false,
          disabledAt: new Date()
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Use backup code
   */
  async useBackupCode(userId, code) {
    try {
      const config = await TwoFactorModel.findOne({ 
        userId,
        backupCodes: code
      });
      
      if (!config) return false;
      
      // Remove used backup code
      config.backupCodes = config.backupCodes.filter(c => c !== code);
      config.lastUsedAt = new Date();
      
      // Track used backup codes
      if (!config.usedBackupCodes) {
        config.usedBackupCodes = [];
      }
      config.usedBackupCodes.push({
        code,
        usedAt: new Date()
      });
      
      await config.save();
      
      return true;
    } catch (error) {
      throw new Error(`Failed to use backup code: ${error.message}`);
    }
  }

  /**
   * Generate new backup codes
   */
  async generateBackupCodes(userId) {
    try {
      const codes = [];
      for (let i = 0; i < 10; i++) {
        codes.push(this._generateBackupCode());
      }
      
      const result = await TwoFactorModel.updateOne(
        { userId },
        { 
          backupCodes: codes,
          backupCodesGeneratedAt: new Date()
        }
      );
      
      if (result.modifiedCount > 0) {
        return codes;
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to generate backup codes: ${error.message}`);
    }
  }

  /**
   * Update last used time
   */
  async updateLastUsed(userId) {
    try {
      const result = await TwoFactorModel.updateOne(
        { userId },
        { lastUsedAt: new Date() }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to update last used: ${error.message}`);
    }
  }

  /**
   * Delete 2FA configuration
   */
  async delete(userId) {
    try {
      const result = await TwoFactorModel.deleteOne({ userId });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete 2FA configuration: ${error.message}`);
    }
  }

  /**
   * Check if 2FA is enabled
   */
  async isEnabled(userId) {
    try {
      const config = await TwoFactorModel.findOne(
        { userId },
        { isEnabled: 1 }
      ).lean();
      
      return config ? config.isEnabled : false;
    } catch (error) {
      throw new Error(`Failed to check 2FA status: ${error.message}`);
    }
  }

  /**
   * Get backup codes count
   */
  async getBackupCodesCount(userId) {
    try {
      const config = await TwoFactorModel.findOne(
        { userId },
        { backupCodes: 1 }
      ).lean();
      
      return config ? config.backupCodes.length : 0;
    } catch (error) {
      throw new Error(`Failed to get backup codes count: ${error.message}`);
    }
  }

  /**
   * Count configurations
   */
  async count(filter = {}) {
    try {
      return await TwoFactorModel.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count 2FA configurations: ${error.message}`);
    }
  }

  /**
   * Generate backup code
   * @private
   */
  _generateBackupCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Convert database model to domain entity
   * @private
   */
  _toDomainEntity(persistenceModel) {
    if (!persistenceModel) return null;
    
    return {
      userId: persistenceModel.userId,
      secret: persistenceModel.secret,
      backupCodes: persistenceModel.backupCodes || [],
      isEnabled: persistenceModel.isEnabled,
      enabledAt: persistenceModel.enabledAt,
      disabledAt: persistenceModel.disabledAt,
      lastUsedAt: persistenceModel.lastUsedAt,
      method: persistenceModel.method,
      backupCodesGeneratedAt: persistenceModel.backupCodesGeneratedAt,
      usedBackupCodes: persistenceModel.usedBackupCodes || [],
      createdAt: persistenceModel.createdAt,
      updatedAt: persistenceModel.updatedAt
    };
  }
}

module.exports = TwoFactorRepository;