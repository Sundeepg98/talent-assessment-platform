const mongoose = require('mongoose');

/**
 * Two-Factor Authentication MongoDB Schema
 * Infrastructure layer - Database model
 * Stores 2FA configuration for users
 */
const twoFactorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  secret: {
    type: String,
    required: true
  },
  backupCodes: [{
    type: String
  }],
  usedBackupCodes: [{
    code: String,
    usedAt: Date
  }],
  isEnabled: {
    type: Boolean,
    default: false
  },
  enabledAt: {
    type: Date
  },
  disabledAt: {
    type: Date
  },
  lastUsedAt: {
    type: Date
  },
  method: {
    type: String,
    enum: ['totp', 'sms', 'email'],
    default: 'totp'
  },
  backupCodesGeneratedAt: {
    type: Date
  },
  phoneNumber: {
    type: String,
    // For SMS-based 2FA (future feature)
  },
  backupEmail: {
    type: String,
    // For email-based 2FA backup
  },
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    addedAt: Date,
    lastUsedAt: Date,
    fingerprint: String
  }],
  recoveryQuestions: [{
    question: String,
    answerHash: String,
    createdAt: Date
  }]
}, {
  timestamps: true,
  collection: 'twofactor'
});

// Indexes for performance
twoFactorSchema.index({ userId: 1 });
twoFactorSchema.index({ isEnabled: 1 });
twoFactorSchema.index({ lastUsedAt: -1 });
twoFactorSchema.index({ backupCodes: 1 });

// Virtual for remaining backup codes count
twoFactorSchema.virtual('remainingBackupCodes').get(function() {
  return this.backupCodes ? this.backupCodes.length : 0;
});

// Virtual to check if backup codes are low
twoFactorSchema.virtual('lowBackupCodes').get(function() {
  return this.backupCodes && this.backupCodes.length < 3;
});

const TwoFactorModel = mongoose.model('TwoFactor', twoFactorSchema);

module.exports = TwoFactorModel;