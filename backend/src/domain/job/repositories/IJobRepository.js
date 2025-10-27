/**
 * IJobRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for job persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class IJobRepository {
  /**
   * Create job
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Created job
   */
  async create(jobData) {
    throw new Error('IJobRepository.create must be implemented');
  }

  /**
   * Find job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Job or null
   */
  async findById(jobId) {
    throw new Error('IJobRepository.findById must be implemented');
  }

  /**
   * Find jobs by company ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object[]>} List of jobs
   */
  async findByCompanyId(companyId) {
    throw new Error('IJobRepository.findByCompanyId must be implemented');
  }

  /**
   * Find jobs by recruiter ID
   * @param {string} recruiterId - Recruiter ID
   * @returns {Promise<Object[]>} List of jobs
   */
  async findByRecruiterId(recruiterId) {
    throw new Error('IJobRepository.findByRecruiterId must be implemented');
  }

  /**
   * Find active jobs
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} List of active jobs
   */
  async findActive(options = {}) {
    throw new Error('IJobRepository.findActive must be implemented');
  }

  /**
   * Find jobs by status
   * @param {string} status - Job status
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} List of jobs
   */
  async findByStatus(status, options = {}) {
    throw new Error('IJobRepository.findByStatus must be implemented');
  }

  /**
   * Search jobs
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Object[]>} Search results
   */
  async search(criteria, options = {}) {
    throw new Error('IJobRepository.search must be implemented');
  }

  /**
   * Update job
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Updated job
   */
  async update(jobData) {
    throw new Error('IJobRepository.update must be implemented');
  }

  /**
   * Update job status
   * @param {string} jobId - Job ID
   * @param {string} status - New status
   * @returns {Promise<boolean>} Success status
   */
  async updateStatus(jobId, status) {
    throw new Error('IJobRepository.updateStatus must be implemented');
  }

  /**
   * Publish job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async publish(jobId) {
    throw new Error('IJobRepository.publish must be implemented');
  }

  /**
   * Unpublish job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async unpublish(jobId) {
    throw new Error('IJobRepository.unpublish must be implemented');
  }

  /**
   * Archive job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async archive(jobId) {
    throw new Error('IJobRepository.archive must be implemented');
  }

  /**
   * Delete job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(jobId) {
    throw new Error('IJobRepository.delete must be implemented');
  }

  /**
   * Add candidate to job
   * @param {string} jobId - Job ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<boolean>} Success status
   */
  async addCandidate(jobId, candidateId) {
    throw new Error('IJobRepository.addCandidate must be implemented');
  }

  /**
   * Remove candidate from job
   * @param {string} jobId - Job ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<boolean>} Success status
   */
  async removeCandidate(jobId, candidateId) {
    throw new Error('IJobRepository.removeCandidate must be implemented');
  }

  /**
   * Get job candidates
   * @param {string} jobId - Job ID
   * @returns {Promise<Object[]>} List of candidates
   */
  async getCandidates(jobId) {
    throw new Error('IJobRepository.getCandidates must be implemented');
  }

  /**
   * Count jobs
   * @param {Object} filter - Optional filter
   * @returns {Promise<number>} Job count
   */
  async count(filter = {}) {
    throw new Error('IJobRepository.count must be implemented');
  }

  /**
   * Get job statistics
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job statistics
   */
  async getStatistics(jobId) {
    throw new Error('IJobRepository.getStatistics must be implemented');
  }
}

module.exports = IJobRepository;