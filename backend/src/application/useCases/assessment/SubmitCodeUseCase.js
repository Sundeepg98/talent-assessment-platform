/**
 * SubmitCodeUseCase
 * DDD: Application service for code submission and evaluation
 * SOLID: Single Responsibility - Code submission handling
 */
class SubmitCodeUseCase {
  constructor(assessmentRepository, codeExecutionService, resultRepository) {
    this._assessmentRepository = assessmentRepository;
    this._codeExecutionService = codeExecutionService;
    this._resultRepository = resultRepository;
  }

  async execute(dto) {
    try {
      // Validate input
      if (!dto.userId || !dto.problemId || !dto.code || !dto.language) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      // Get assessment/problem
      const assessment = await this._assessmentRepository.findById(dto.problemId);
      
      if (!assessment) {
        return {
          success: false,
          error: 'Problem not found'
        };
      }

      // Check if language is supported
      if (!assessment.supportedLanguages.includes(dto.language)) {
        return {
          success: false,
          error: `Language ${dto.language} not supported for this problem`
        };
      }

      // Execute code against test cases
      const executionResults = await this._codeExecutionService.execute({
        code: dto.code,
        language: dto.language,
        testCases: assessment.testCases,
        timeLimit: assessment.timeLimit || 2000,
        memoryLimit: assessment.memoryLimit || 128
      });

      // Calculate score
      const totalTests = assessment.testCases.length;
      const passedTests = executionResults.filter(r => r.passed).length;
      const score = Math.round((passedTests / totalTests) * 100);

      // Create result entity
      const result = {
        userId: dto.userId,
        assessmentId: dto.problemId,
        code: dto.code,
        language: dto.language,
        testResults: executionResults,
        score,
        passedTests,
        totalTests,
        executionTime: executionResults.reduce((acc, r) => acc + (r.executionTime || 0), 0),
        memoryUsed: Math.max(...executionResults.map(r => r.memoryUsed || 0)),
        status: this._determineStatus(score, executionResults),
        submittedAt: new Date()
      };

      // Save result
      const savedResult = await this._resultRepository.save(result);

      // Update user's assessment progress
      await this._assessmentRepository.updateUserProgress(dto.userId, dto.problemId, {
        lastSubmission: new Date(),
        bestScore: Math.max(score, assessment.userProgress?.bestScore || 0),
        attempts: (assessment.userProgress?.attempts || 0) + 1
      });

      return {
        success: true,
        result: {
          id: savedResult.id,
          score,
          passedTests,
          totalTests,
          testResults: this._sanitizeTestResults(executionResults, assessment.showDetailedResults),
          status: result.status,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed
        }
      };

    } catch (error) {
      console.error('Submit code error:', error);
      return {
        success: false,
        error: error.message || 'Code submission failed'
      };
    }
  }

  _determineStatus(score, executionResults) {
    if (score === 100) return 'accepted';
    if (score >= 80) return 'partially_accepted';
    if (executionResults.some(r => r.error === 'compilation_error')) return 'compilation_error';
    if (executionResults.some(r => r.error === 'runtime_error')) return 'runtime_error';
    if (executionResults.some(r => r.error === 'time_limit_exceeded')) return 'time_limit_exceeded';
    if (executionResults.some(r => r.error === 'memory_limit_exceeded')) return 'memory_limit_exceeded';
    return 'wrong_answer';
  }

  _sanitizeTestResults(results, showDetailed) {
    return results.map((result, index) => {
      const sanitized = {
        testCase: index + 1,
        passed: result.passed,
        status: result.passed ? 'passed' : 'failed',
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed
      };

      if (showDetailed && !result.passed) {
        sanitized.input = result.input;
        sanitized.expectedOutput = result.expectedOutput;
        sanitized.actualOutput = result.actualOutput;
        sanitized.error = result.error;
      }

      return sanitized;
    });
  }
}

module.exports = SubmitCodeUseCase;