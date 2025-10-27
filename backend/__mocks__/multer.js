const multer = jest.fn(() => ({
  single: jest.fn(() => (req, res, next) => {
    req.file = { filename: 'test.pdf', path: '/tmp/test.pdf' };
    next();
  }),
  array: jest.fn(() => (req, res, next) => {
    req.files = [{ filename: 'test.pdf' }];
    next();
  })
}));
multer.diskStorage = jest.fn();
module.exports = multer;