const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../src/models/User');

let mongoServer;

describe('User Model Test', () => {
  // Setup in-memory MongoDB
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a user with valid fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
        role: 'candidate'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.password).toBeDefined();
      expect(savedUser.createdAt).toBeDefined();
    });

    it('should fail to create user without required fields', async () => {
      const user = new User({});
      let err;
      
      try {
        await user.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.email).toBeDefined();
    });

    it('should not save duplicate emails', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
        role: 'candidate'
      };

      await User.create(userData);
      
      let err;
      try {
        await User.create(userData);
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // MongoDB duplicate key error
    });

    it('should validate email format', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'securePassword123',
        role: 'candidate'
      });

      let err;
      try {
        await user.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.email).toBeDefined();
    });

    it('should accept valid roles', async () => {
      const roles = ['admin', 'hr', 'candidate'];
      
      for (const role of roles) {
        const user = new User({
          name: `User ${role}`,
          email: `${role}@example.com`,
          password: 'password123',
          role: role
        });
        
        const savedUser = await user.save();
        expect(savedUser.role).toBe(role);
        await User.deleteOne({ _id: savedUser._id });
      }
    });

    it('should reject invalid roles', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalidRole'
      });

      let err;
      try {
        await user.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.errors.role).toBeDefined();
    });
  });

  describe('Google OAuth fields', () => {
    it('should save Google ID for OAuth users', async () => {
      const user = new User({
        name: 'Google User',
        email: 'google@example.com',
        googleId: 'google-oauth-id-123',
        role: 'candidate'
      });

      const savedUser = await user.save();
      expect(savedUser.googleId).toBe('google-oauth-id-123');
      expect(savedUser.password).toBeUndefined();
    });
  });
});
