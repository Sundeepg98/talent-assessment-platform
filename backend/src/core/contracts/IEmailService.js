/**
 * Email Service Interface
 * Defines the contract that all email services must implement
 */

class IEmailService {
  /**
   * Send verification email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} token - Verification token
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendVerificationEmail(email, name, token) {
    throw new Error('Method sendVerificationEmail must be implemented');
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Password reset token
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPasswordResetEmail(email, resetToken) {
    throw new Error('Method sendPasswordResetEmail must be implemented');
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendWelcomeEmail(email, name) {
    throw new Error('Method sendWelcomeEmail must be implemented');
  }

  /**
   * Send notification email
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendNotificationEmail(email, subject, body) {
    throw new Error('Method sendNotificationEmail must be implemented');
  }
}

// Define the interface methods for validation
IEmailService.requiredMethods = [
  'sendVerificationEmail',
  'sendPasswordResetEmail',
  'sendWelcomeEmail',
  'sendNotificationEmail'
];

module.exports = IEmailService;