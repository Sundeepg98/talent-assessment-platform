/**
 * IInterviewRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for interview persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class IInterviewRepository {
  /**
   * Create interview
   * @param {Object} interviewData - Interview data
   * @returns {Promise<Object>} Created interview
   */
  async create(interviewData) {
    throw new Error('IInterviewRepository.create must be implemented');
  }

  /**
   * Find interview by ID
   * @param {string} interviewId - Interview ID
   * @returns {Promise<Object|null>} Interview or null
   */
  async findById(interviewId) {
    throw new Error('IInterviewRepository.findById must be implemented');
  }

  /**
   * Find interviews by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object[]>} List of interviews
   */
  async findByCandidateId(candidateId) {
    throw new Error('IInterviewRepository.findByCandidateId must be implemented');
  }

  /**
   * Find interviews by interviewer ID
   * @param {string} interviewerId - Interviewer ID
   * @returns {Promise<Object[]>} List of interviews
   */
  async findByInterviewerId(interviewerId) {
    throw new Error('IInterviewRepository.findByInterviewerId must be implemented');
  }

  /**
   * Find interviews by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object[]>} List of interviews
   */
  async findByJobId(jobId) {
    throw new Error('IInterviewRepository.findByJobId must be implemented');
  }

  /**
   * Find interviews by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object[]>} List of interviews
   */
  async findByDateRange(startDate, endDate) {
    throw new Error('IInterviewRepository.findByDateRange must be implemented');
  }

  /**
   * Update interview
   * @param {Object} interviewData - Interview data
   * @returns {Promise<Object>} Updated interview
   */
  async update(interviewData) {
    throw new Error('IInterviewRepository.update must be implemented');
  }

  /**
   * Update interview status
   * @param {string} interviewId - Interview ID
   * @param {string} status - New status
   * @returns {Promise<boolean>} Success status
   */
  async updateStatus(interviewId, status) {
    throw new Error('IInterviewRepository.updateStatus must be implemented');
  }

  /**
   * Schedule interview
   * @param {string} interviewId - Interview ID
   * @param {Date} scheduledAt - Schedule time
   * @returns {Promise<boolean>} Success status
   */
  async schedule(interviewId, scheduledAt) {
    throw new Error('IInterviewRepository.schedule must be implemented');
  }

  /**
   * Reschedule interview
   * @param {string} interviewId - Interview ID
   * @param {Date} newScheduledAt - New schedule time
   * @param {string} reason - Reschedule reason
   * @returns {Promise<boolean>} Success status
   */
  async reschedule(interviewId, newScheduledAt, reason) {
    throw new Error('IInterviewRepository.reschedule must be implemented');
  }

  /**
   * Cancel interview
   * @param {string} interviewId - Interview ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<boolean>} Success status
   */
  async cancel(interviewId, reason) {
    throw new Error('IInterviewRepository.cancel must be implemented');
  }

  /**
   * Save interview feedback
   * @param {string} interviewId - Interview ID
   * @param {Object} feedback - Interview feedback
   * @returns {Promise<boolean>} Success status
   */
  async saveFeedback(interviewId, feedback) {
    throw new Error('IInterviewRepository.saveFeedback must be implemented');
  }

  /**
   * Save interview recording
   * @param {string} interviewId - Interview ID
   * @param {string} recordingUrl - Recording URL
   * @returns {Promise<boolean>} Success status
   */
  async saveRecording(interviewId, recordingUrl) {
    throw new Error('IInterviewRepository.saveRecording must be implemented');
  }

  /**
   * Delete interview
   * @param {string} interviewId - Interview ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(interviewId) {
    throw new Error('IInterviewRepository.delete must be implemented');
  }

  /**
   * Find upcoming interviews
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} List of upcoming interviews
   */
  async findUpcoming(options = {}) {
    throw new Error('IInterviewRepository.findUpcoming must be implemented');
  }

  /**
   * Count interviews
   * @param {Object} filter - Optional filter
   * @returns {Promise<number>} Interview count
   */
  async count(filter = {}) {
    throw new Error('IInterviewRepository.count must be implemented');
  }
}

module.exports = IInterviewRepository;