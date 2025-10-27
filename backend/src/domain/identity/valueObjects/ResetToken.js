class ResetToken {
  constructor(value) {
    if (!value) throw new Error('Reset token cannot be empty');
    this.value = value;
  }
  static generate() {
    return new ResetToken('reset-' + Date.now() + '-' + Math.random().toString(36));
  }
}
module.exports = ResetToken;