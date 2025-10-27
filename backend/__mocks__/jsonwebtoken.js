module.exports = {
  sign: jest.fn((payload, secret, options, callback) => {
    const token = 'jwt_' + Buffer.from(JSON.stringify(payload)).toString('base64');
    if (callback) return callback(null, token);
    return token;
  }),
  verify: jest.fn((token, secret, options, callback) => {
    try {
      if (!token || !token.startsWith('jwt_')) {
        throw new Error('invalid token');
      }
      const decoded = JSON.parse(Buffer.from(token.slice(4), 'base64').toString());
      if (callback) return callback(null, decoded);
      return decoded;
    } catch (err) {
      if (callback) return callback(err);
      throw err;
    }
  }),
  decode: jest.fn((token) => {
    if (!token || !token.startsWith('jwt_')) return null;
    return JSON.parse(Buffer.from(token.slice(4), 'base64').toString());
  })
};