module.exports = {
  hash: jest.fn((password, saltOrRounds, callback) => {
    const hashed = 'hashed_' + password;
    if (callback) return callback(null, hashed);
    return Promise.resolve(hashed);
  }),
  compare: jest.fn((data, encrypted, callback) => {
    const match = encrypted === 'hashed_' + data;
    if (callback) return callback(null, match);
    return Promise.resolve(match);
  }),
  genSalt: jest.fn((rounds, callback) => {
    if (callback) return callback(null, 'salt');
    return Promise.resolve('salt');
  }),
  hashSync: jest.fn((password) => 'hashed_' + password),
  compareSync: jest.fn((data, encrypted) => encrypted === 'hashed_' + data)
};