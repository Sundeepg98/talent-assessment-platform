const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

class EmailVerificationService {
  constructor(config = {}) {
    // Allow dependency injection of configuration
    this.config = {
      emailService: config.emailService || process.env.EMAIL_SERVICE || 'gmail',
      emailUser: config.emailUser || process.env.EMAIL_USER,
      emailPass: config.emailPass || process.env.EMAIL_PASS,
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
      frontendUrl: config.frontendUrl || process.env.FRONTEND_URL
    };
    
    // Allow injection of transporter for testing
    this.transporter = config.transporter || this._createTransporter();
  }

  _createTransporter() {
    return nodemailer.createTransport({
      service: this.config.emailService,
      auth: {
        user: this.config.emailUser,
        pass: this.config.emailPass
      }
    });
  }

  generateVerificationToken(userId, email) {
    const token = jwt.sign(
      { userId, email, type: 'email-verification' },
      this.config.jwtSecret,
      { expiresIn: '24h' }
    );
    return token;
  }

  async sendVerificationEmail(email, name, token) {
    const verificationUrl = `${this.config.frontendUrl}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: this.config.emailUser,
      to: email,
      subject: 'Verify Your Email - Talent Assessment Platform',
      html: `
        <h2>Welcome ${name}!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      if (decoded.type !== 'email-verification') {
        throw new Error('Invalid token type');
      }
      return { valid: true, userId: decoded.userId, email: decoded.email };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// Export the class, not an instance
module.exports = EmailVerificationService;

// For backward compatibility, also export a default instance
// This can be removed once all imports are updated
module.exports.default = new EmailVerificationService();