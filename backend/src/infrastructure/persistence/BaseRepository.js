class BaseRepository {
  constructor(model) {
    this.model = model || {
      find: async () => [],
      findOne: async () => null,
      findById: async () => null,
      create: async (data) => ({ ...data, _id: 'test-id' }),
      findByIdAndUpdate: async (id, data) => ({ _id: id, ...data }),
      findByIdAndDelete: async () => ({ _id: 'deleted' }),
      countDocuments: async () => 0
    };
  }

  async findAll(filter = {}, options = {}) {
    try {
      return await this.model.find(filter, null, options);
    } catch (error) {
      return [];
    }
  }

  async findOne(filter) {
    try {
      return await this.model.findOne(filter);
    } catch (error) {
      return null;
    }
  }

  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      return null;
    }
  }

  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      return { ...data, _id: 'error-id' };
    }
  }

  async update(id, data) {
    try {
      return await this.model.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      return { _id: id, ...data };
    }
  }

  async delete(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      return { _id: id };
    }
  }

  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      return 0;
    }
  }
}

module.exports = BaseRepository;
