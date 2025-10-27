// Real Test Implementations for DI
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

class TestDatabase {
  constructor() {
    this.mongoServer = null;
    this.connection = null;
  }

  async connect() {
    this.mongoServer = new MongoMemoryServer();
    await this.mongoServer.start();
    const uri = this.mongoServer.getUri();
    this.connection = await mongoose.connect(uri);
    return this.connection;
  }

  async disconnect() {
    if (this.connection) await mongoose.disconnect();
    if (this.mongoServer) await this.mongoServer.stop();
  }

  getModel(name, schema) {
    return mongoose.model(name, schema);
  }
}

class TestEmailService {
  constructor() {
    this.sentEmails = [];
  }

  async sendEmail(to, subject, body) {
    const email = { to, subject, body, timestamp: new Date() };
    this.sentEmails.push(email);
    return { success: true, messageId: 'test-' + Date.now() };
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  clear() {
    this.sentEmails = [];
  }
}

class TestTokenService {
  constructor(secret = 'test-secret') {
    this.secret = secret;
    this.tokens = new Map();
  }

  generateToken(payload) {
    const token = 'token-' + Date.now() + '-' + Math.random();
    this.tokens.set(token, payload);
    return token;
  }

  verifyToken(token) {
    const payload = this.tokens.get(token);
    if (!payload) throw new Error('Invalid token');
    return payload;
  }

  revokeToken(token) {
    return this.tokens.delete(token);
  }
}

class TestPasswordService {
  async hash(password) {
    return 'hashed-' + password;
  }

  async verify(password, hashedPassword) {
    return hashedPassword === 'hashed-' + password;
  }
}

module.exports = {
  TestDatabase,
  TestEmailService,
  TestTokenService,
  TestPasswordService
};
