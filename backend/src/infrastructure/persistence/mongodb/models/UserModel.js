const mongoose = require('mongoose');

/**
 * User MongoDB Schema
 * Infrastructure layer - Database model
 * Maps to User domain entity
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  roles: [{
    type: String,
    enum: ['user', 'candidate', 'interviewer', 'recruiter', 'admin'],
    default: 'user'
  }],
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    bio: String,
    company: String,
    position: String,
    location: String,
    skills: [String],
    experience: Number,
    linkedIn: String,
    github: String,
    portfolio: String
  },
  passwordChangedAt: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String
  },
  loginCount: {
    type: Number,
    default: 0
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLoginAt: {
    type: Date
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ isActive: 1, isEmailVerified: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;