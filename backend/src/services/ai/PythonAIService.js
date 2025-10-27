/**
 * Python AI Service - Interfaces with the Python ML service on port 8000
 * Real ML-powered resume analysis using scikit-learn and sentence-transformers
 */
const axios = require('axios');

class PythonAIService {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.PYTHON_AI_URL || 'http://localhost:8000';
    this.timeout = config.timeout || 30000; // 30 seconds

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Analyze resume against job description
   * @param {string} resumeText - Extracted resume text
   * @param {string} jobDescription - Optional job description
   * @returns {Promise<Object>} Analysis results with score, strengths, improvements
   */
  async analyzeResume(resumeText, jobDescription = '') {
    try {
      const response = await this.client.post('/analyze', {
        resume_text: resumeText,
        job_description: jobDescription
      });

      const data = response.data;

      return {
        score: data.score || 0,
        rating: data.rating || 'Fair',
        strengths: data.strengths || [],
        improvements: data.areas_for_improvement || [],
        skillsMatch: data.skills_found || [],
        recommendations: data.recommendations || [],
        fullAnalysis: data
      };
    } catch (error) {
      console.error('Python AI Service - analyze error:', error.message);
      throw new Error('Failed to analyze resume: ' + error.message);
    }
  }

  /**
   * Optimize resume for job description
   * @param {string} resumeText - Extracted resume text
   * @param {string} jobDescription - Job description to optimize for
   * @returns {Promise<Object>} Optimization suggestions
   */
  async optimizeResume(resumeText, jobDescription = '') {
    try {
      const response = await this.client.post('/optimize', {
        resume_text: resumeText,
        job_description: jobDescription
      });

      const data = response.data;

      return {
        suggestions: data.optimization_suggestions || [],
        keywords: data.missing_skills || [],
        improvements: data.improvements || [],
        similarity: data.similarity_score || 0,
        fullOptimization: data
      };
    } catch (error) {
      console.error('Python AI Service - optimize error:', error.message);
      throw new Error('Failed to optimize resume: ' + error.message);
    }
  }

  /**
   * Health check for Python AI service
   * @returns {Promise<boolean>} Service availability
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data.healthy === true;
    } catch (error) {
      console.error('Python AI Service - health check failed:', error.message);
      return false;
    }
  }
}

module.exports = PythonAIService;
