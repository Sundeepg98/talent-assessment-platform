class IUserRepository {
  async findByEmail(email) { throw new Error('Not implemented'); }
  async findByUsername(username) { throw new Error('Not implemented'); }
  async create(user) { throw new Error('Not implemented'); }
  async save(user) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
}
module.exports = IUserRepository;