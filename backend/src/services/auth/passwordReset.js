const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

class PasswordResetService {
  constructor() {
    this.resetTokens = new Map(); // In production, use Redis
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  generateResetToken(userId, email) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Store with expiry (1 hour)
    this.resetTokens.set(hashedToken, {
      userId,
      email,
      expiry: Date.now() + 3600000
    });

    return resetToken;
  }

  async sendResetEmail(email, name, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Talent Assessment Platform',
      html: `
        <h2>Hello ${name},</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }
  }

  validateResetToken(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tokenData = this.resetTokens.get(hashedToken);

    if (!tokenData) {
      return { valid: false, error: 'Invalid token' };
    }

    if (Date.now() > tokenData.expiry) {
      this.resetTokens.delete(hashedToken);
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, userId: tokenData.userId, email: tokenData.email };
  }

  async resetPassword(token, newPassword) {
    const validation = this.validateResetToken(token);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Delete used token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetTokens.delete(hashedToken);

    return { 
      success: true, 
      userId: validation.userId, 
      hashedPassword 
    };
  }

  // Clean expired tokens (run periodically)
  cleanExpiredTokens() {
    const now = Date.now();
    for (const [key, value] of this.resetTokens.entries()) {
      if (now > value.expiry) {
        this.resetTokens.delete(key);
      }
    }
  }
}

module.exports = PasswordResetService;