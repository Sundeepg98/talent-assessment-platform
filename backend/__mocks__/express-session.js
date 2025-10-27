const session = jest.fn(() => (req, res, next) => {
  req.session = {
    save: jest.fn((cb) => cb && cb()),
    destroy: jest.fn((cb) => cb && cb()),
    regenerate: jest.fn((cb) => cb && cb()),
    reload: jest.fn((cb) => cb && cb()),
    cookie: {}
  };
  req.sessionID = 'test-session-id';
  if (next) next();
});
session.Store = class Store {};
session.MemoryStore = class MemoryStore extends session.Store {};
module.exports = session;