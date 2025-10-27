const mongoose = require('mongoose');

/**
 * Session MongoDB Schema
 * Infrastructure layer - Database model
 * Manages user sessions with JWT refresh tokens
 */
const sessionSchema = new mongoose.Schema({
  _id: {
    type: String, // Use string ID for sessions
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true
  },
  refreshTokenUsedAt: {
    type: Date
  },
  refreshTokenRotatedAt: {
    type: Date
  },
  deviceInfo: {
    type: {
      type: String,
      browser: String,
      version: String,
      os: String,
      platform: String,
      mobile: Boolean
    }
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  fingerprint: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for auto-deletion
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  invalidatedAt: {
    type: Date
  },
  invalidationReason: {
    type: String,
    enum: ['logout', 'token-reuse', 'manual', 'expired', 'security']
  }
}, {
  timestamps: true,
  collection: 'sessions',
  _id: false // Use custom _id
});

// Indexes for performance
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ fingerprint: 1, userId: 1 });
sessionSchema.index({ expiresAt: 1 });
sessionSchema.index({ lastAccessedAt: -1 });
sessionSchema.index({ isActive: 1, expiresAt: 1 });

// Compound index for finding active sessions
sessionSchema.index({ 
  userId: 1, 
  isActive: 1, 
  expiresAt: 1 
});

const SessionModel = mongoose.model('Session', sessionSchema);

module.exports = SessionModel;