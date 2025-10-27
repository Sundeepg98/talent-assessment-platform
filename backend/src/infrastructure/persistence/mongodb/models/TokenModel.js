const mongoose = require('mongoose');

/**
 * Token MongoDB Schema
 * Infrastructure layer - Database model
 * Handles verification, reset, and other token types
 */
const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['verification', 'reset', 'invitation', 'magic-link'],
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    // Only for reset tokens (6-digit code)
    sparse: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for auto-deletion
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  invalidatedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'tokens'
});

// Indexes for performance
tokenSchema.index({ token: 1, type: 1 });
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ email: 1, type: 1 });
tokenSchema.index({ code: 1, type: 1, email: 1 });
tokenSchema.index({ used: 1, expiresAt: 1 });

// Ensure tokens are unique per user and type for active tokens
tokenSchema.index(
  { userId: 1, type: 1, used: 1 },
  { 
    unique: true,
    partialFilterExpression: { used: false }
  }
);

const TokenModel = mongoose.model('Token', tokenSchema);

module.exports = TokenModel;