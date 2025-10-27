let counter = 0;
module.exports = {
  v4: jest.fn(() => 'uuid-' + (++counter)),
  v1: jest.fn(() => 'uuid-v1-' + (++counter)),
  validate: jest.fn(() => true)
};