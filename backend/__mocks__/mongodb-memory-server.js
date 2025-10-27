
class MongoMemoryServer {
  constructor() {}
  async start() {}
  async stop() {}
  getUri() { return 'mongodb://localhost:27017/test'; }
}
module.exports = { MongoMemoryServer };
