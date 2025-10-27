/**
 * IResultRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for assessment result persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class IResultRepository {
  /**
   * Save assessment result
   * @param {Object} resultData - Result data
   * @returns {Promise<Object>} Saved result
   */
  async save(resultData) {
    throw new Error('IResultRepository.save must be implemented');
  }

  /**
   * Find result by ID
   * @param {string} resultId - Result ID
   * @returns {Promise<Object|null>} Result or null
   */
  async findById(resultId) {
    throw new Error('IResultRepository.findById must be implemented');
  }

  /**
   * Find result by assessment ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object|null>} Result or null
   */
  async findByAssessmentId(assessmentId) {
    throw new Error('IResultRepository.findByAssessmentId must be implemented');
  }

  /**
   * Find results by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object[]>} List of results
   */
  async findByCandidateId(candidateId) {
    throw new Error('IResultRepository.findByCandidateId must be implemented');
  }

  /**
   * Find results by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object[]>} List of results
   */
  async findByJobId(jobId) {
    throw new Error('IResultRepository.findByJobId must be implemented');
  }

  /**
   * Update result
   * @param {Object} resultData - Result data
   * @returns {Promise<Object>} Updated result
   */
  async update(resultData) {
    throw new Error('IResultRepository.update must be implemented');
  }

  /**
   * Calculate statistics
   * @param {Object} criteria - Criteria for statistics
   * @returns {Promise<Object>} Statistics
   */
  async calculateStatistics(criteria) {
    throw new Error('IResultRepository.calculateStatistics must be implemented');
  }

  /**
   * Get top performers
   * @param {string} jobId - Job ID
   * @param {number} limit - Number of top performers
   * @returns {Promise<Object[]>} Top performers
   */
  async getTopPerformers(jobId, limit = 10) {
    throw new Error('IResultRepository.getTopPerformers must be implemented');
  }

  /**
   * Get average scores
   * @param {Object} criteria - Criteria for averaging
   * @returns {Promise<Object>} Average scores
   */
  async getAverageScores(criteria) {
    throw new Error('IResultRepository.getAverageScores must be implemented');
  }

  /**
   * Delete result
   * @param {string} resultId - Result ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(resultId) {
    throw new Error('IResultRepository.delete must be implemented');
  }

  /**
   * Bulk save results
   * @param {Object[]} results - Array of result data
   * @returns {Promise<Object[]>} Saved results
   */
  async bulkSave(results) {
    throw new Error('IResultRepository.bulkSave must be implemented');
  }

  /**
   * Archive old results
   * @param {Date} beforeDate - Date threshold
   * @returns {Promise<number>} Number of archived results
   */
  async archiveOld(beforeDate) {
    throw new Error('IResultRepository.archiveOld must be implemented');
  }
}

module.exports = IResultRepository;