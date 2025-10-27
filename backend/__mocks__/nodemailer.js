module.exports = {
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ 
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: [],
      response: '250 OK'
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn()
  }))
};