module.exports = {
  login: jest.fn((req, res) => res.json({ 
    token: 'mock-jwt-token',
    user: { id: '123', email: req.body.email }
  })),
  register: jest.fn((req, res) => res.json({
    token: 'mock-jwt-token',
    user: { id: '123', email: req.body.email },
    message: 'User registered successfully'
  })),
  logout: jest.fn((req, res) => res.json({ message: 'Logged out' })),
  refreshToken: jest.fn((req, res) => res.json({ token: 'new-token' }))
};