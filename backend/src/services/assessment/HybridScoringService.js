/**
 * HybridScoringService
 * Combines Docker execution results (60%) with Gemini AI quality analysis (40%)
 * Provides intelligent grading beyond simple pass/fail
 *
 * Scoring Breakdown:
 * - 60% Test Cases (Docker execution)
 * - 40% Code Quality (Gemini AI)
 *
 * Features:
 * - Partial credit for good code that fails tests
 * - Quality assessment even when tests pass
 * - Educational feedback
 * - Industry-standard evaluation
 */
class HybridScoringService {
  constructor(dockerService, codeQualityService) {
    this._dockerService = dockerService;
    this._codeQualityService = codeQualityService;
    console.log('Hybrid Scoring Service initialized (Docker + Local Quality Analysis)');
  }

  /**
   * Execute and score code submission with hybrid approach
   * @param {Object} submission - Code submission details
   * @returns {Object} Comprehensive scoring result
   */
  async evaluateSubmission(submission) {
    const {
      sourceCode,
      languageId,
      testCases = [],
      problemDescription = 'Solve the given problem'
    } = submission;

    try {
      // Phase 1: Execute code with Docker (60% of grade)
      const executionResults = await this._runTestCases(sourceCode, languageId, testCases);

      // Phase 2: Analyze code quality locally (40% of grade)
      const qualityAnalysis = await this._codeQualityService.analyzeCodeQuality(
        sourceCode,
        problemDescription,
        this._getLanguageName(languageId)
      );

      // Phase 3: Calculate hybrid score
      const scoring = this._calculateHybridScore(executionResults, qualityAnalysis);

      // Phase 4: Generate comprehensive feedback
      const feedback = this._generateFeedback(executionResults, qualityAnalysis, scoring);

      return {
        success: true,
        score: scoring.totalScore,
        breakdown: {
          testCases: {
            score: scoring.testCaseScore,
            weight: '60%',
            passed: executionResults.passed,
            total: executionResults.total
          },
          codeQuality: {
            score: scoring.qualityScore,
            weight: '40%',
            metrics: {
              readability: qualityAnalysis.readability,
              efficiency: qualityAnalysis.efficiency,
              correctness: qualityAnalysis.correctness,
              bestPractices: qualityAnalysis.bestPractices
            }
          }
        },
        execution: {
          results: executionResults.details,
          totalTime: executionResults.totalTime
        },
        quality: {
          strengths: qualityAnalysis.strengths,
          weaknesses: qualityAnalysis.weaknesses,
          suggestions: qualityAnalysis.suggestions
        },
        feedback: feedback,
        grade: this._getLetterGrade(scoring.totalScore)
      };

    } catch (error) {
      console.error('Hybrid scoring error:', error);
      return {
        success: false,
        error: error.message,
        score: 0,
        feedback: 'Failed to evaluate submission'
      };
    }
  }

  /**
   * Run all test cases using Docker
   * @private
   */
  async _runTestCases(sourceCode, languageId, testCases) {
    const results = {
      passed: 0,
      total: testCases.length,
      details: [],
      totalTime: 0
    };

    // If no test cases provided, run code once with empty input
    if (testCases.length === 0) {
      const result = await this._dockerService.submitCode(sourceCode, languageId, '');
      results.total = 1;
      results.passed = result.status?.id === 3 ? 1 : 0;
      results.totalTime = parseFloat(result.time || 0);
      results.details.push({
        input: '',
        expectedOutput: result.stdout,
        actualOutput: result.stdout,
        passed: result.status?.id === 3,
        executionTime: result.time
      });
      return results;
    }

    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await this._dockerService.submitCode(
        sourceCode,
        languageId,
        testCase.input || ''
      );

      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = (testCase.expectedOutput || '').trim();
      const passed = actualOutput === expectedOutput && result.status?.id === 3;

      if (passed) results.passed++;
      results.totalTime += parseFloat(result.time || 0);

      results.details.push({
        testCase: i + 1,
        input: testCase.input,
        expectedOutput: expectedOutput,
        actualOutput: actualOutput,
        passed: passed,
        executionTime: result.time,
        status: result.status?.description,
        stderr: result.stderr
      });
    }

    return results;
  }

  /**
   * Calculate hybrid score (60% tests + 40% quality)
   * @private
   */
  _calculateHybridScore(executionResults, qualityAnalysis) {
    // Test case score (60% weight)
    const testPassRate = executionResults.passed / executionResults.total;
    const testCaseScore = Math.round(testPassRate * 60);

    // Quality score (40% weight)
    const qualityScore = Math.round((qualityAnalysis.qualityScore / 100) * 40);

    // Total score
    const totalScore = testCaseScore + qualityScore;

    return {
      testCaseScore,
      qualityScore,
      totalScore: Math.min(100, totalScore)
    };
  }

  /**
   * Generate comprehensive feedback
   * @private
   */
  _generateFeedback(executionResults, qualityAnalysis, scoring) {
    const feedback = [];

    // Execution feedback
    if (executionResults.passed === executionResults.total) {
      feedback.push(`✅ Excellent! All ${executionResults.total} test cases passed.`);
    } else if (executionResults.passed > 0) {
      feedback.push(`⚠️ Partial success: ${executionResults.passed}/${executionResults.total} test cases passed.`);
    } else {
      feedback.push(`❌ No test cases passed. Review the logic and try again.`);
    }

    // Performance feedback
    if (executionResults.totalTime < 0.1) {
      feedback.push('⚡ Excellent execution time!');
    } else if (executionResults.totalTime > 1.0) {
      feedback.push('🐌 Consider optimizing for better performance.');
    }

    // Quality feedback
    if (qualityAnalysis.qualityScore >= 80) {
      feedback.push('🌟 Outstanding code quality!');
    } else if (qualityAnalysis.qualityScore >= 60) {
      feedback.push('✨ Good code quality with room for improvement.');
    } else {
      feedback.push('📚 Code quality needs improvement. Review best practices.');
    }

    // Add AI feedback
    if (qualityAnalysis.feedback) {
      feedback.push(`AI Analysis: ${qualityAnalysis.feedback}`);
    }

    return feedback.join('\n');
  }

  /**
   * Get letter grade
   * @private
   */
  _getLetterGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get language name from ID
   * @private
   */
  _getLanguageName(languageId) {
    const languageMap = {
      63: 'javascript',
      71: 'python',
      62: 'java',
      54: 'cpp',
      50: 'c'
    };
    return languageMap[languageId] || 'python';
  }
}

module.exports = HybridScoringService;
