/**
 * IQuestionRepository Interface
 * DDD: Domain layer repository interface
 * Defines contract for question persistence without implementation details
 * SOLID: Interface Segregation & Dependency Inversion
 */
class IQuestionRepository {
  /**
   * Create question
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} Created question
   */
  async create(questionData) {
    throw new Error('IQuestionRepository.create must be implemented');
  }

  /**
   * Find question by ID
   * @param {string} questionId - Question ID
   * @returns {Promise<Object|null>} Question or null
   */
  async findById(questionId) {
    throw new Error('IQuestionRepository.findById must be implemented');
  }

  /**
   * Find questions by assessment ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object[]>} List of questions
   */
  async findByAssessmentId(assessmentId) {
    throw new Error('IQuestionRepository.findByAssessmentId must be implemented');
  }

  /**
   * Find questions by category
   * @param {string} category - Question category
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} List of questions
   */
  async findByCategory(category, options = {}) {
    throw new Error('IQuestionRepository.findByCategory must be implemented');
  }

  /**
   * Find questions by difficulty
   * @param {string} difficulty - Difficulty level
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} List of questions
   */
  async findByDifficulty(difficulty, options = {}) {
    throw new Error('IQuestionRepository.findByDifficulty must be implemented');
  }

  /**
   * Find questions by tags
   * @param {string[]} tags - Question tags
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} List of questions
   */
  async findByTags(tags, options = {}) {
    throw new Error('IQuestionRepository.findByTags must be implemented');
  }

  /**
   * Update question
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} Updated question
   */
  async update(questionData) {
    throw new Error('IQuestionRepository.update must be implemented');
  }

  /**
   * Delete question
   * @param {string} questionId - Question ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(questionId) {
    throw new Error('IQuestionRepository.delete must be implemented');
  }

  /**
   * Get random questions
   * @param {Object} criteria - Selection criteria
   * @param {number} count - Number of questions
   * @returns {Promise<Object[]>} Random questions
   */
  async getRandomQuestions(criteria, count) {
    throw new Error('IQuestionRepository.getRandomQuestions must be implemented');
  }

  /**
   * Search questions
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object[]>} Search results
   */
  async search(query, options = {}) {
    throw new Error('IQuestionRepository.search must be implemented');
  }

  /**
   * Count questions
   * @param {Object} filter - Optional filter
   * @returns {Promise<number>} Question count
   */
  async count(filter = {}) {
    throw new Error('IQuestionRepository.count must be implemented');
  }

  /**
   * Bulk create questions
   * @param {Object[]} questions - Array of question data
   * @returns {Promise<Object[]>} Created questions
   */
  async bulkCreate(questions) {
    throw new Error('IQuestionRepository.bulkCreate must be implemented');
  }
}

module.exports = IQuestionRepository;