class TwoFactorSecret {
  constructor(value) {
    if (!value) throw new Error('2FA secret cannot be empty');
    this.value = value;
  }
  static generate() {
    return new TwoFactorSecret('secret-' + Math.random().toString(36).substr(2, 16));
  }
}
module.exports = TwoFactorSecret;