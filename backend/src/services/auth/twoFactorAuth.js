const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorAuthService {
  constructor() {
    this.backupCodes = new Map(); // In production, store in database
  }

  generateSecret(email) {
    const secret = speakeasy.generateSecret({
      name: `Talent Assessment (${email})`,
      issuer: 'Talent Assessment Platform',
      length: 32
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      backup_codes: backupCodes
    };
  }

  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  async generateQRCode(otpauth_url) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
      return { success: true, qrCode: qrCodeDataURL };
    } catch (error) {
      console.error('QR Code generation error:', error);
      return { success: false, error: error.message };
    }
  }

  verifyToken(secret, token) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps tolerance
      });
      
      return { valid: verified };
    } catch (error) {
      console.error('2FA verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  verifyBackupCode(userId, code) {
    const userBackupCodes = this.backupCodes.get(userId) || [];
    const index = userBackupCodes.indexOf(code);
    
    if (index > -1) {
      // Remove used backup code
      userBackupCodes.splice(index, 1);
      this.backupCodes.set(userId, userBackupCodes);
      return { valid: true, remaining: userBackupCodes.length };
    }
    
    return { valid: false };
  }

  async enable2FA(userId, secret, backupCodes) {
    // Store secret and backup codes for user
    // In production, encrypt the secret before storing
    this.backupCodes.set(userId, backupCodes);
    
    return {
      success: true,
      message: '2FA enabled successfully',
      backupCodesRemaining: backupCodes.length
    };
  }

  async disable2FA(userId) {
    // Remove 2FA data for user
    this.backupCodes.delete(userId);
    
    return {
      success: true,
      message: '2FA disabled successfully'
    };
  }

  generateRecoveryCodes(userId) {
    const newCodes = this.generateBackupCodes();
    this.backupCodes.set(userId, newCodes);
    return newCodes;
  }
}

module.exports = new TwoFactorAuthService();