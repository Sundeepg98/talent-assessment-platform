const session = require('express-session');
const MongoStore = require('connect-mongo');
const crypto = require('crypto');

class SessionManager {
  constructor(config = {}) {
    this.activeSessions = new Map();
    
    // Allow dependency injection of configuration
    this.config = {
      sessionSecret: config.sessionSecret || process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
      nodeEnv: config.nodeEnv || process.env.NODE_ENV,
      mongoUri: config.mongoUri || process.env.MONGO_URI,
      cookieMaxAge: config.cookieMaxAge || 1000 * 60 * 60 * 24, // 24 hours
      sessionTtl: config.sessionTtl || 24 * 60 * 60, // TTL in seconds
      maxInactivity: config.maxInactivity || 1000 * 60 * 60 * 24 // 24 hours in ms
    };
    
    this.sessionConfig = this._createSessionConfig();
  }

  _createSessionConfig() {
    const config = {
      secret: this.config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: this.config.nodeEnv === 'production',
        httpOnly: true,
        maxAge: this.config.cookieMaxAge,
        sameSite: 'strict'
      }
    };

    // Only create MongoStore if mongoUri is provided
    if (this.config.mongoUri) {
      config.store = MongoStore.create({
        mongoUrl: this.config.mongoUri,
        collectionName: 'sessions',
        ttl: this.config.sessionTtl,
        autoRemove: 'native',
        crypto: {
          secret: this.config.sessionSecret || 'session-encryption-key'
        }
      });
    } else {
      config.store = null;
    }

    return config;
  }

  getMiddleware() {
    return session(this.sessionConfig);
  }

  createSession(userId, userInfo) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      userId,
      ...userInfo,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: null,
      userAgent: null
    };

    this.activeSessions.set(sessionId, sessionData);
    
    // Clean old sessions
    this.cleanInactiveSessions();
    
    return sessionId;
  }

  getSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session expired
    const now = new Date();
    const lastActivity = new Date(session.lastActivity);

    if (now - lastActivity > this.config.maxInactivity) {
      this.destroySession(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    this.activeSessions.set(sessionId, session);

    return session;
  }

  updateSession(sessionId, updates) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: new Date()
    };

    this.activeSessions.set(sessionId, updatedSession);
    return true;
  }

  destroySession(sessionId) {
    return this.activeSessions.delete(sessionId);
  }

  destroyAllUserSessions(userId) {
    let count = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  getUserActiveSessions(userId) {
    const userSessions = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({
          sessionId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent
        });
      }
    }

    return userSessions;
  }

  cleanInactiveSessions() {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const lastActivity = new Date(session.lastActivity);
      
      if (now - lastActivity > this.config.maxInactivity) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Session security checks
  validateSession(sessionId, ipAddress, userAgent) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    // Check IP address change (optional, might be too strict)
    if (session.ipAddress && session.ipAddress !== ipAddress) {
      return { valid: false, reason: 'IP address mismatch' };
    }

    // Check user agent change
    if (session.userAgent && session.userAgent !== userAgent) {
      return { valid: false, reason: 'User agent mismatch' };
    }

    return { valid: true };
  }

  // Get session statistics
  getStatistics() {
    const stats = {
      totalSessions: this.activeSessions.size,
      uniqueUsers: new Set(
        Array.from(this.activeSessions.values()).map(s => s.userId)
      ).size,
      sessions: []
    };

    for (const [sessionId, session] of this.activeSessions.entries()) {
      stats.sessions.push({
        userId: session.userId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      });
    }

    return stats;
  }
}

// Export the class, not an instance
module.exports = SessionManager;

// For backward compatibility, also export a default instance
// This can be removed once all imports are updated
module.exports.default = new SessionManager();