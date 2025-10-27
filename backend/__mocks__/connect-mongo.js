module.exports = jest.fn(() => {
  return class MongoStore {
    constructor(options) {}
    get(sid, callback) { callback(null, null); }
    set(sid, session, callback) { callback(null); }
    destroy(sid, callback) { callback(null); }
    touch(sid, session, callback) { callback(null); }
  };
});