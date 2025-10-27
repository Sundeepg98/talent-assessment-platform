const express = () => {
  const app = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn((port, cb) => cb && cb()),
    set: jest.fn()
  };
  return app;
};
express.Router = () => ({
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
});
express.json = jest.fn(() => (req, res, next) => next());
express.urlencoded = jest.fn(() => (req, res, next) => next());
express.static = jest.fn(() => (req, res, next) => next());
module.exports = express;