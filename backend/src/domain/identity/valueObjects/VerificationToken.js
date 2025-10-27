class VerificationToken {
  constructor(value) {
    if (!value) throw new Error('Verification token cannot be empty');
    this.value = value;
  }
  static generate() {
    return new VerificationToken('verify-' + Date.now() + '-' + Math.random().toString(36));
  }
  isExpired() {
    return false; // Simplified for testing
  }
}
module.exports = VerificationToken;