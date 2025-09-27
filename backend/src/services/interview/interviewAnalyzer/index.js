// Interview Analyzer Service - Node.js wrapper for Python analyzer
const { spawn } = require('child_process');
const path = require('path');

class InterviewAnalyzerService {
  constructor() {
    this.pythonPath = 'python3';
    this.scriptPath = path.join(__dirname, 'analyzer.py');
  }

  /**
   * Analyze interview response using integrated Python service
   * @param {string} question - Interview question
   * @param {string} response - Candidate's response
   * @param {string} role - Job role/position
   * @returns {Promise<Object>} Analysis results
   */
  analyzeResponse(question, response, role = 'Software Engineer') {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [this.scriptPath]);
      let dataString = '';
      let errorString = '';

      // Send input data
      python.stdin.write(JSON.stringify({
        question,
        response,
        role
      }));
      python.stdin.end();

      // Collect output
      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          // Use fallback if Python fails
          console.warn('Python analyzer failed, using fallback');
          resolve(this.analyzeFallback(question, response, role));
          return;
        }

        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (e) {
          // Use fallback on parse error
          resolve(this.analyzeFallback(question, response, role));
        }
      });

      python.on('error', (err) => {
        // Use fallback if can't start Python
        console.warn('Cannot start Python, using fallback:', err.message);
        resolve(this.analyzeFallback(question, response, role));
      });
    });
  }

  /**
   * Fallback analyzer using pure JavaScript
   * Used when Python is not available or Gemini API fails
   */
  analyzeFallback(question, response, role) {
    // Basic analysis logic
    const responseLength = response.split(' ').length;
    const hasKeywords = this.checkKeywords(response, role);
    const clarity = this.assessClarity(response);
    
    // Calculate scores
    const relevance = hasKeywords ? 75 : 50;
    const completeness = Math.min(100, (responseLength / 50) * 100);
    const score = Math.round((relevance + completeness + clarity) / 3);
    
    return {
      score: Math.min(95, score),
      feedback: {
        strengths: this.generateStrengths(response, score),
        improvements: this.generateImprovements(response, score),
        relevance,
        clarity,
        completeness
      },
      analysis: {
        wordCount: responseLength,
        keywordsFound: hasKeywords,
        sentiment: 'neutral'
      }
    };
  }

  /**
   * Check for role-specific keywords
   */
  checkKeywords(response, role) {
    const keywords = {
      'Software Engineer': ['code', 'development', 'software', 'programming', 'debug', 
                           'algorithm', 'design', 'architecture', 'test', 'solution'],
      'Data Scientist': ['data', 'analysis', 'model', 'statistics', 'machine learning',
                        'python', 'visualization', 'insights', 'prediction'],
      'Product Manager': ['strategy', 'roadmap', 'stakeholder', 'requirements', 'user',
                         'market', 'metrics', 'prioritize', 'launch']
    };
    
    const roleKeywords = keywords[role] || keywords['Software Engineer'];
    const responseLower = response.toLowerCase();
    
    return roleKeywords.some(keyword => responseLower.includes(keyword));
  }

  /**
   * Assess response clarity
   */
  assessClarity(response) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = response.split(' ').length / Math.max(sentences.length, 1);
    
    // Good clarity: 10-20 words per sentence
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
      return 85;
    } else if (avgWordsPerSentence < 10) {
      return 60; // Too brief
    } else {
      return 70; // Too verbose
    }
  }

  /**
   * Generate strengths based on analysis
   */
  generateStrengths(response, score) {
    const strengths = [];
    
    if (score > 70) {
      strengths.push("Clear and well-structured response");
    }
    if (response.split(' ').length > 30) {
      strengths.push("Comprehensive answer with good detail");
    }
    if (response.includes('example') || response.includes('instance')) {
      strengths.push("Used concrete examples");
    }
    
    if (strengths.length === 0) {
      strengths.push("Attempted to address the question");
    }
    
    return strengths;
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovements(response, score) {
    const improvements = [];
    
    if (score < 60) {
      improvements.push("Provide more specific details and examples");
    }
    if (response.split(' ').length < 30) {
      improvements.push("Expand your answer with more comprehensive coverage");
    }
    if (!response.includes('example')) {
      improvements.push("Include specific examples from your experience");
    }
    if (score < 80) {
      improvements.push("Structure your response with clear beginning, middle, and conclusion");
    }
    
    return improvements;
  }

  /**
   * Main analyze method with Gemini integration (when available)
   */
  async analyzeInterview(question, response, options = {}) {
    const { 
      role = 'Software Engineer',
      useGemini = false,  // Set to true when Gemini API is configured
      geminiApiKey = process.env.GEMINI_API_KEY
    } = options;

    try {
      if (useGemini && geminiApiKey) {
        // Try Gemini API first (if configured)
        return await this.analyzeWithGemini(question, response, role, geminiApiKey);
      } else {
        // Use Python subprocess or fallback
        return await this.analyzeResponse(question, response, role);
      }
    } catch (error) {
      console.error('Interview analysis error:', error);
      // Always return fallback rather than throwing
      return this.analyzeFallback(question, response, role);
    }
  }

  /**
   * Analyze using Gemini API (placeholder for future implementation)
   */
  async analyzeWithGemini(question, response, role, apiKey) {
    // This would call the Gemini API directly from Node.js
    // For now, delegates to Python service which has Gemini integration
    return this.analyzeResponse(question, response, role);
  }
}

// Export singleton instance
module.exports = new InterviewAnalyzerService();