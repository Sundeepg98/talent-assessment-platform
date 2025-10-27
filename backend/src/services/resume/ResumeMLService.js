/**
 * Resume ML Service - 3-Level Hybrid ML (DDD-Compatible with Dependency Injection)
 *
 * Level 1: NLTK Text Quality Analysis
 * Level 2: BERT Semantic Matching
 * Level 3: Gemini AI Feedback
 *
 * Replaces external ai_services4 dependency with integrated Python ML
 */
const { spawn } = require('child_process');
const path = require('path');

class ResumeMLService {
  constructor(config = {}) {
    this.pythonPath = config.pythonPath || 'python3';
    this.scriptPath = config.scriptPath || path.join(__dirname, 'resumeMLAnalyzer.py');
    this.geminiKey = config.geminiKey || process.env.GEMINI_API_KEY || '';
    this.timeout = config.timeout || 30000; // 30 seconds
  }

  /**
   * Analyze resume against job description using 3-Level Hybrid ML
   * @param {string} resumeText - Extracted resume text
   * @param {string} jobDescription - Optional job description
   * @returns {Promise<Object>} Analysis results with score, skills, recommendations
   */
  analyzeResume(resumeText, jobDescription = '') {
    return this._executeML({
      resume_text: resumeText,
      job_description: jobDescription,
      gemini_key: this.geminiKey,  // ✅ Pass Gemini key for Level 3
      operation: 'analyze'
    });
  }

  /**
   * Generate optimization suggestions for resume
   * @param {string} resumeText - Extracted resume text
   * @param {string} jobDescription - Job description to optimize for
   * @returns {Promise<Object>} Optimization suggestions
   */
  optimizeResume(resumeText, jobDescription) {
    return this._executeML({
      resume_text: resumeText,
      job_description: jobDescription,
      gemini_key: this.geminiKey,  // ✅ Pass Gemini key for Level 3
      operation: 'optimize'
    });
  }

  /**
   * Execute ML analyzer via subprocess
   * @private
   */
  _executeML(inputData) {
    return new Promise((resolve, reject) => {
      // Run as Python module to enable relative imports for core/ components
      const python = spawn(this.pythonPath, ['-m', 'src.services.resume.resumeMLAnalyzer'], {
        cwd: path.join(__dirname, '../../..')  // Navigate to backend root
      });
      let dataString = '';
      let errorString = '';
      let timeoutId;

      // Set timeout
      timeoutId = setTimeout(() => {
        python.kill();
        reject(new Error('ML analysis timeout'));
      }, this.timeout);

      // Send input data
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();

      // Collect output
      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      python.on('close', (code) => {
        clearTimeout(timeoutId);

        if (code !== 0) {
          console.error('Python ML error:', errorString);
          // Return fallback instead of failing
          resolve(this._getFallbackResult(inputData));
          return;
        }

        try {
          const result = JSON.parse(dataString);

          // Transform to backend-expected format (supports both old and new 3-level format)
          const transformed = {
            score: result.score || 0,
            rating: result.rating || 'Fair',

            // Level 1: Text Quality (NEW)
            textQuality: result.text_quality || null,
            textQualityScore: result.text_quality_score || null,

            // Level 2: Semantic Analysis
            semanticAnalysis: result.semantic_analysis || {
              resume_skills: result.resume_skills || [],
              matching_skills: result.matching_skills || [],
              missing_skills: result.missing_skills || [],
              similarity: result.similarity || 0
            },

            // Level 3: LLM Feedback (NEW)
            llmFeedback: result.llm_feedback || null,

            // Backward compatibility fields
            strengths: result.semantic_analysis?.resume_skills || result.resume_skills || [],
            improvements: result.semantic_analysis?.missing_skills || result.missing_skills || [],
            skillsMatch: result.semantic_analysis?.matching_skills || result.matching_skills || [],
            recommendations: result.recommendations || [],
            similarity: result.semantic_analysis?.similarity || result.similarity || 0,

            // Meta information
            mlModel: result.ml_model || 'unknown',
            hybridMlEnabled: result.hybrid_ml_enabled || false,
            geminiEnabled: result.gemini_enabled || false,

            // Full analysis (for debugging)
            fullAnalysis: result
          };

          resolve(transformed);
        } catch (e) {
          console.error('JSON parse error:', e);
          resolve(this._getFallbackResult(inputData));
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeoutId);
        console.error('Cannot start Python ML:', err.message);
        resolve(this._getFallbackResult(inputData));
      });
    });
  }

  /**
   * Fallback result when ML fails
   * @private
   */
  _getFallbackResult(inputData) {
    return {
      score: 50,
      rating: 'Fair',
      strengths: ['Resume processed'],
      improvements: ['Manual review recommended'],
      skillsMatch: [],
      recommendations: ['ML analysis temporarily unavailable - using fallback'],
      similarity: 0.5,
      fullAnalysis: {
        ml_powered: false,
        model: 'fallback',
        error: 'ML processing unavailable'
      }
    };
  }

  /**
   * Health check for ML service
   * @returns {Promise<boolean>} Service availability
   */
  async healthCheck() {
    try {
      const result = await this.analyzeResume('test resume', 'test job');
      return result.fullAnalysis.ml_powered === true;
    } catch (error) {
      console.error('ML health check failed:', error);
      return false;
    }
  }
}

module.exports = ResumeMLService;
