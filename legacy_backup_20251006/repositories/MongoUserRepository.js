const IUserRepository = require('./IUserRepository');
class MongoUserRepository extends IUserRepository {
  async findByEmail(email) { return null; }
  async findByUsername(username) { return null; }
  async create(user) { return user; }
  async save(user) { return user; }
  async findById(id) { return null; }
}
module.exports = MongoUserRepository;