const IUserRepository = require('../../../../domain/identity/repositories/IUserRepository');
const User = require('../../../../domain/identity/entities/User');
const UserId = require('../../../../domain/identity/valueObjects/UserId');
const Email = require('../../../../domain/identity/valueObjects/Email');
const Password = require('../../../../domain/identity/valueObjects/Password');
const UserModel = require('../models/UserModel');

/**
 * UserRepository MongoDB Implementation
 * Infrastructure layer - Concrete implementation of IUserRepository
 * SOLID: Dependency Inversion - Implements domain interface
 * DDD: Infrastructure layer handling persistence details
 */
class UserRepository extends IUserRepository {
  /**
   * Find user by ID
   */
  async findById(userId) {
    try {
      const userData = await UserModel.findById(userId).lean();
      if (!userData) return null;
      
      return this._toDomainEntity(userData);
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Find user by email (accepts string or Email VO)
   */
  async findByEmail(email) {
    try {
      // Accept both Email VO and plain string for backward compatibility
      const emailString = typeof email === 'string' ? email : email.value;

      const userData = await UserModel.findOne({
        email: emailString.toLowerCase()
      }).lean();

      if (!userData) return null;

      return this._toDomainEntity(userData);
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    try {
      const userData = await UserModel.findOne({ 
        username: username.toLowerCase() 
      }).lean();
      
      if (!userData) return null;
      
      return this._toDomainEntity(userData);
    } catch (error) {
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  }

  /**
   * Create user from plain object (backward compatibility)
   * TODO: Migrate to save() with domain entities
   */
  async create(userData) {
    try {
      const user = new UserModel({
        email: userData.email,
        password: userData.password,
        username: userData.name?.toLowerCase().replace(/\s+/g, '_') || userData.email.split('@')[0],
        profile: {
          firstName: userData.name || '',
          ...userData.profile
        },
        roles: userData.roles || ['candidate'],
        isActive: true
      });

      const savedUser = await user.save();
      return this._toDomainEntity(savedUser.toObject());
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Save user (create or update) - Proper DDD method
   */
  async save(user) {
    try {
      const userData = this._toPersistenceModel(user);

      const savedData = await UserModel.findByIdAndUpdate(
        userData._id,
        userData,
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      ).lean();

      return this._toDomainEntity(savedData);
    } catch (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  /**
   * Update user
   */
  async update(user) {
    try {
      const userData = this._toPersistenceModel(user);
      
      const updatedData = await UserModel.findByIdAndUpdate(
        userData._id,
        userData,
        { 
          new: true,
          runValidators: true 
        }
      ).lean();
      
      if (!updatedData) {
        throw new Error('User not found for update');
      }
      
      return this._toDomainEntity(updatedData);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user
   */
  async delete(userId) {
    try {
      const result = await UserModel.deleteOne({ _id: userId });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    try {
      const count = await UserModel.countDocuments({ 
        email: email.toLowerCase() 
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username) {
    try {
      const count = await UserModel.countDocuments({ 
        username: username.toLowerCase() 
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check username existence: ${error.message}`);
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role, options = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      const users = await UserModel.find({ roles: role })
        .limit(limit)
        .skip(skip)
        .sort(sort)
        .lean();
      
      return users.map(userData => this._toDomainEntity(userData));
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  /**
   * Count total users
   */
  async count(filter = {}) {
    try {
      return await UserModel.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }

  /**
   * Convert database model to domain entity
   * @private
   */
  _toDomainEntity(persistenceModel) {
    if (!persistenceModel) return null;

    return new User({
      id: new UserId(persistenceModel._id.toString()),
      email: Email.create(persistenceModel.email),
      password: Password.fromHash(persistenceModel.password),
      username: persistenceModel.username,
      isEmailVerified: persistenceModel.isEmailVerified || false,
      emailVerifiedAt: persistenceModel.emailVerifiedAt,
      isTwoFactorEnabled: persistenceModel.isTwoFactorEnabled || false,
      twoFactorSecret: persistenceModel.twoFactorSecret,
      isActive: persistenceModel.isActive !== undefined ? persistenceModel.isActive : true,
      roles: persistenceModel.roles || ['user'],
      profile: persistenceModel.profile || {},
      createdAt: persistenceModel.createdAt,
      updatedAt: persistenceModel.updatedAt,
      passwordChangedAt: persistenceModel.passwordChangedAt,
      lastLoginAt: persistenceModel.lastLoginAt,
      lastLoginIp: persistenceModel.lastLoginIp,
      loginCount: persistenceModel.loginCount || 0,
      failedLoginAttempts: persistenceModel.failedLoginAttempts || 0,
      lastFailedLoginAt: persistenceModel.lastFailedLoginAt,
      isLocked: persistenceModel.isLocked || false,
      lockedUntil: persistenceModel.lockedUntil
    });
  }

  /**
   * Convert domain entity to database model
   * @private
   */
  _toPersistenceModel(domainEntity) {
    return {
      _id: domainEntity.id.value,
      email: domainEntity.email.value.toLowerCase(),
      password: domainEntity.password.value,
      username: domainEntity.username.toLowerCase(),
      isEmailVerified: domainEntity.isEmailVerified,
      emailVerifiedAt: domainEntity.emailVerifiedAt,
      isTwoFactorEnabled: domainEntity.isTwoFactorEnabled,
      twoFactorSecret: domainEntity.twoFactorSecret,
      isActive: domainEntity.isActive,
      roles: domainEntity.roles,
      profile: domainEntity.profile,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt || new Date(),
      passwordChangedAt: domainEntity.passwordChangedAt,
      lastLoginAt: domainEntity.lastLoginAt,
      lastLoginIp: domainEntity.lastLoginIp,
      loginCount: domainEntity.loginCount,
      failedLoginAttempts: domainEntity.failedLoginAttempts,
      lastFailedLoginAt: domainEntity.lastFailedLoginAt,
      isLocked: domainEntity.isLocked,
      lockedUntil: domainEntity.lockedUntil
    };
  }
}

module.exports = UserRepository;