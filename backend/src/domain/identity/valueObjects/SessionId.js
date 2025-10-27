class SessionId {
  constructor(value) {
    if (!value) throw new Error('Session ID cannot be empty');
    this.value = value;
  }
  static generate() {
    return new SessionId('session-' + Date.now() + '-' + Math.random().toString(36));
  }
}
module.exports = SessionId;