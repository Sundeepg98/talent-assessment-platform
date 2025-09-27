const axios = require('axios');

class RealJudge0Service {
  constructor() {
    this.apiKey = process.env.JUDGE0_API_KEY;
    this.apiHost = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';
    this.baseURL = `https://${this.apiHost}`;
    
    // Language IDs for Judge0
    this.languages = {
      'javascript': 63,
      'python': 71,
      'java': 62,
      'cpp': 54,
      'c': 50,
      'csharp': 51,
      'go': 60,
      'rust': 73,
      'ruby': 72,
      'php': 68,
      'swift': 83,
      'kotlin': 78,
      'typescript': 74,
      'sql': 82
    };

    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.apiHost,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds
    });
  }

  getLanguageId(language) {
    const lang = language.toLowerCase();
    return this.languages[lang] || this.languages['javascript'];
  }

  async submitCode(code, language, stdin = '', expectedOutput = '') {
    try {
      const languageId = this.getLanguageId(language);
      
      const submission = {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: stdin ? Buffer.from(stdin).toString('base64') : '',
        expected_output: expectedOutput ? Buffer.from(expectedOutput).toString('base64') : '',
        cpu_time_limit: 2,
        cpu_extra_time: 0.5,
        wall_time_limit: 5,
        memory_limit: 128000,
        stack_limit: 64000,
        max_processes_and_or_threads: 30,
        enable_per_process_and_thread_time_limit: false,
        enable_per_process_and_thread_memory_limit: false,
        max_file_size: 1024
      };

      const response = await this.client.post('/submissions', submission);
      
      return {
        success: true,
        token: response.data.token
      };
    } catch (error) {
      console.error('Judge0 submission error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getSubmission(token) {
    try {
      const response = await this.client.get(`/submissions/${token}`);
      const submission = response.data;
      
      // Decode base64 fields
      const result = {
        status: submission.status,
        stdout: submission.stdout ? Buffer.from(submission.stdout, 'base64').toString() : '',
        stderr: submission.stderr ? Buffer.from(submission.stderr, 'base64').toString() : '',
        compile_output: submission.compile_output ? Buffer.from(submission.compile_output, 'base64').toString() : '',
        message: submission.message,
        time: submission.time,
        memory: submission.memory,
        token: submission.token
      };

      // Determine execution status
      const statusId = submission.status.id;
      
      if (statusId === 1 || statusId === 2) {
        // In Queue or Processing
        result.finished = false;
        result.success = false;
      } else if (statusId === 3) {
        // Accepted
        result.finished = true;
        result.success = true;
      } else if (statusId === 4) {
        // Wrong Answer
        result.finished = true;
        result.success = false;
        result.error = 'Wrong Answer';
      } else if (statusId === 5) {
        // Time Limit Exceeded
        result.finished = true;
        result.success = false;
        result.error = 'Time Limit Exceeded';
      } else if (statusId === 6) {
        // Compilation Error
        result.finished = true;
        result.success = false;
        result.error = result.compile_output || 'Compilation Error';
      } else if (statusId >= 7 && statusId <= 12) {
        // Runtime Errors
        result.finished = true;
        result.success = false;
        result.error = result.stderr || submission.status.description;
      } else {
        // Other errors
        result.finished = true;
        result.success = false;
        result.error = submission.status.description;
      }

      return result;
    } catch (error) {
      console.error('Judge0 get submission error:', error.response?.data || error.message);
      return {
        success: false,
        finished: true,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async executeCode(code, language, stdin = '') {
    try {
      // Submit code
      const submission = await this.submitCode(code, language, stdin);
      
      if (!submission.success) {
        return submission;
      }

      // Poll for result
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 2000; // 2 seconds

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const result = await this.getSubmission(submission.token);
        
        if (result.finished) {
          return result;
        }

        attempts++;
      }

      return {
        success: false,
        error: 'Execution timeout - took too long to complete'
      };
    } catch (error) {
      console.error('Judge0 execute error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async batchExecute(testCases) {
    try {
      const submissions = [];
      
      // Submit all test cases
      for (const testCase of testCases) {
        const submission = await this.submitCode(
          testCase.code,
          testCase.language,
          testCase.stdin,
          testCase.expectedOutput
        );
        
        if (submission.success) {
          submissions.push({
            ...testCase,
            token: submission.token
          });
        } else {
          submissions.push({
            ...testCase,
            error: submission.error
          });
        }
      }

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get all results
      const results = [];
      
      for (const submission of submissions) {
        if (submission.token) {
          const result = await this.getSubmission(submission.token);
          results.push({
            testCase: submission.name || 'Test Case',
            ...result
          });
        } else {
          results.push({
            testCase: submission.name || 'Test Case',
            success: false,
            error: submission.error
          });
        }
      }

      return {
        success: true,
        results,
        summary: {
          total: results.length,
          passed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      };
    } catch (error) {
      console.error('Batch execute error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getLanguages() {
    try {
      const response = await this.client.get('/languages');
      return {
        success: true,
        languages: response.data
      };
    } catch (error) {
      console.error('Get languages error:', error);
      return {
        success: false,
        error: error.message,
        languages: Object.keys(this.languages) // Fallback to local list
      };
    }
  }

  async getStatuses() {
    try {
      const response = await this.client.get('/statuses');
      return {
        success: true,
        statuses: response.data
      };
    } catch (error) {
      console.error('Get statuses error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSystemInfo() {
    try {
      const response = await this.client.get('/system_info');
      return {
        success: true,
        info: response.data
      };
    } catch (error) {
      console.error('Get system info error:', error);
      // Return mock info if API fails
      return {
        success: true,
        info: {
          version: '1.13.0',
          languages: Object.keys(this.languages).length,
          status: 'operational'
        }
      };
    }
  }

  // Helper method to run code with multiple test cases
  async runWithTestCases(code, language, testCases) {
    const results = [];
    
    for (const [index, testCase] of testCases.entries()) {
      const result = await this.executeCode(
        code,
        language,
        testCase.input || ''
      );

      const testResult = {
        testCase: index + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.stdout,
        passed: result.success && result.stdout?.trim() === testCase.expectedOutput?.trim(),
        error: result.error,
        time: result.time,
        memory: result.memory
      };

      results.push(testResult);
    }

    const summary = {
      totalTests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      results
    };

    return summary;
  }
}

module.exports = RealJudge0Service;