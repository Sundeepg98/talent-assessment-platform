/**
 * IAssessmentRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for assessment persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class IAssessmentRepository {
  /**
   * Create assessment
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise<Object>} Created assessment
   */
  async create(assessmentData) {
    throw new Error('IAssessmentRepository.create must be implemented');
  }

  /**
   * Find assessment by ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object|null>} Assessment or null
   */
  async findById(assessmentId) {
    throw new Error('IAssessmentRepository.findById must be implemented');
  }

  /**
   * Find assessments by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object[]>} List of assessments
   */
  async findByCandidateId(candidateId) {
    throw new Error('IAssessmentRepository.findByCandidateId must be implemented');
  }

  /**
   * Find assessments by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object[]>} List of assessments
   */
  async findByJobId(jobId) {
    throw new Error('IAssessmentRepository.findByJobId must be implemented');
  }

  /**
   * Update assessment
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise<Object>} Updated assessment
   */
  async update(assessmentData) {
    throw new Error('IAssessmentRepository.update must be implemented');
  }

  /**
   * Update assessment status
   * @param {string} assessmentId - Assessment ID
   * @param {string} status - New status
   * @returns {Promise<boolean>} Success status
   */
  async updateStatus(assessmentId, status) {
    throw new Error('IAssessmentRepository.updateStatus must be implemented');
  }

  /**
   * Save assessment results
   * @param {string} assessmentId - Assessment ID
   * @param {Object} results - Assessment results
   * @returns {Promise<boolean>} Success status
   */
  async saveResults(assessmentId, results) {
    throw new Error('IAssessmentRepository.saveResults must be implemented');
  }

  /**
   * Delete assessment
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(assessmentId) {
    throw new Error('IAssessmentRepository.delete must be implemented');
  }

  /**
   * Find assessments by status
   * @param {string} status - Assessment status
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} List of assessments
   */
  async findByStatus(status, options = {}) {
    throw new Error('IAssessmentRepository.findByStatus must be implemented');
  }

  /**
   * Count assessments
   * @param {Object} filter - Optional filter
   * @returns {Promise<number>} Assessment count
   */
  async count(filter = {}) {
    throw new Error('IAssessmentRepository.count must be implemented');
  }

  /**
   * Find expiring assessments
   * @param {Date} beforeDate - Date threshold
   * @returns {Promise<Object[]>} List of expiring assessments
   */
  async findExpiring(beforeDate) {
    throw new Error('IAssessmentRepository.findExpiring must be implemented');
  }
}

module.exports = IAssessmentRepository;