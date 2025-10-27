module.exports = jest.fn(() => ({
  post: jest.fn(() => ({
    send: jest.fn(() => ({
      expect: jest.fn(() => ({
        end: jest.fn(cb => cb(null, { body: { token: 'test-token' }, statusCode: 200 }))
      }))
    }))
  })),
  get: jest.fn(() => ({
    expect: jest.fn(() => ({
      end: jest.fn(cb => cb(null, { body: {}, statusCode: 200 }))
    }))
  }))
}));