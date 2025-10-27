/**
 * @interface IRepository
 * @description Base repository interface following Interface Segregation Principle
 * SOLID: Interface Segregation - Separate read and write operations
 */

/**
 * @interface IReadRepository
 * @template T - Entity type
 */
class IReadRepository {
  /**
   * Find entity by ID
   * @param {string} id 
   * @returns {Promise<T>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all entities
   * @param {Object} filter 
   * @param {Object} options 
   * @returns {Promise<T[]>}
   */
  async findAll(filter = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find one entity by criteria
   * @param {Object} criteria 
   * @returns {Promise<T>}
   */
  async findOne(criteria) {
    throw new Error('Method not implemented');
  }

  /**
   * Count entities
   * @param {Object} filter 
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if entity exists
   * @param {Object} criteria 
   * @returns {Promise<boolean>}
   */
  async exists(criteria) {
    throw new Error('Method not implemented');
  }
}

/**
 * @interface IWriteRepository
 * @template T - Entity type
 */
class IWriteRepository {
  /**
   * Save new entity
   * @param {T} entity 
   * @returns {Promise<T>}
   */
  async save(entity) {
    throw new Error('Method not implemented');
  }

  /**
   * Update entity
   * @param {string} id 
   * @param {Partial<T>} data 
   * @returns {Promise<T>}
   */
  async update(id, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete entity
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Save multiple entities
   * @param {T[]} entities 
   * @returns {Promise<T[]>}
   */
  async saveMany(entities) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete multiple entities
   * @param {Object} criteria 
   * @returns {Promise<number>}
   */
  async deleteMany(criteria) {
    throw new Error('Method not implemented');
  }
}

/**
 * @interface IRepository
 * @description Complete repository interface combining read and write
 * @template T - Entity type
 */
class IRepository extends IReadRepository {
  constructor() {
    super();
    // Compose write operations
    const writeRepo = new IWriteRepository();
    this.save = writeRepo.save;
    this.update = writeRepo.update;
    this.delete = writeRepo.delete;
    this.saveMany = writeRepo.saveMany;
    this.deleteMany = writeRepo.deleteMany;
  }
}

module.exports = {
  IReadRepository,
  IWriteRepository,
  IRepository
};