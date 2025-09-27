// Mock Judge0 Service for development/testing
// This simulates code execution without requiring a Judge0 API subscription

class MockJudge0Service {
  constructor() {
    this.submissions = new Map();
    this.tokenCounter = 1000;
    console.log('Mock Judge0 Service initialized (development mode)');
  }

  encodeBase64(str) {
    return Buffer.from(str).toString('base64');
  }

  decodeBase64(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  // Language mappings
  getLanguageName(languageId) {
    const languages = {
      63: 'javascript',
      71: 'python',
      50: 'c',
      54: 'cpp',
      62: 'java',
      78: 'kotlin',
      79: 'scala',
      80: 'swift',
      74: 'typescript',
      72: 'ruby',
      68: 'php',
      73: 'rust',
      60: 'go',
      51: 'csharp'
    };
    return languages[languageId] || 'unknown';
  }

  // Simulate code execution
  simulateExecution(sourceCode, languageId, stdin = '') {
    const language = this.getLanguageName(languageId);
    
    // Mock responses based on common patterns
    const responses = {
      'javascript': {
        'console.log': {
          stdout: sourceCode.includes('"Hello World"') 
            ? 'Hello World\n' 
            : sourceCode.match(/console\.log\(["'](.+?)["']\)/)?.[1] + '\n' || 'Output\n',
          stderr: '',
          status: { id: 3, description: 'Accepted' },
          time: '0.015',
          memory: 2048
        }
      },
      'python': {
        'print': {
          stdout: sourceCode.includes('"Integration Test"') 
            ? 'Integration Test\n'
            : sourceCode.includes('"Hello World"') 
            ? 'Hello World\n' 
            : sourceCode.match(/print\(["'](.+?)["']\)/)?.[1] + '\n' || 'Output\n',
          stderr: '',
          status: { id: 3, description: 'Accepted' },
          time: '0.025',
          memory: 3072
        }
      },
      'default': {
        stdout: 'Hello World\n',
        stderr: '',
        status: { id: 3, description: 'Accepted' },
        time: '0.010',
        memory: 1024
      }
    };

    // Determine response based on language and code patterns
    let result;
    if (language === 'javascript' && sourceCode.includes('console.log')) {
      result = responses.javascript['console.log'];
    } else if (language === 'python' && sourceCode.includes('print')) {
      result = responses.python['print'];
    } else {
      result = responses.default;
    }

    // Add syntax error simulation for malformed code
    if (sourceCode.includes('syntax_error') || sourceCode.includes('SyntaxError')) {
      result = {
        stdout: '',
        stderr: `SyntaxError: Unexpected token\n    at line 1\n`,
        status: { id: 6, description: 'Compilation Error' },
        compile_output: 'Compilation failed',
        time: '0.000',
        memory: 0
      };
    }

    // Add runtime error simulation
    if (sourceCode.includes('throw') || sourceCode.includes('raise')) {
      result = {
        stdout: '',
        stderr: 'Runtime Error: Exception occurred during execution\n',
        status: { id: 11, description: 'Runtime Error' },
        time: '0.005',
        memory: 512
      };
    }

    // Add infinite loop detection
    if (sourceCode.includes('while(true)') || sourceCode.includes('while True')) {
      result = {
        stdout: '',
        stderr: 'Time Limit Exceeded\n',
        status: { id: 5, description: 'Time Limit Exceeded' },
        time: '1.000',
        memory: 8192
      };
    }

    return result;
  }

  async submitCode(sourceCode, languageId, stdin = '') {
    try {
      console.log('Mock Judge0: Simulating code submission...');
      console.log('Source code:', sourceCode);
      console.log('Language ID:', languageId);
      
      // Generate a unique token
      const token = `mock-token-${this.tokenCounter++}`;
      
      // Simulate async execution delay
      setTimeout(() => {
        const result = this.simulateExecution(sourceCode, languageId, stdin);
        this.submissions.set(token, result);
      }, 100);

      // Return submission response
      return {
        token,
        status: {
          id: 2,
          description: 'Processing'
        },
        language_id: languageId,
        source_code: this.encodeBase64(sourceCode),
        stdin: stdin ? this.encodeBase64(stdin) : null
      };
      
    } catch (error) {
      console.error('Mock Judge0 error:', error);
      throw new Error('Mock Judge0 submission failed: ' + error.message);
    }
  }

  async getSubmission(token) {
    try {
      console.log('Mock Judge0: Fetching submission:', token);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get stored result or return processing status
      const result = this.submissions.get(token);
      
      if (!result) {
        return {
          token,
          status: {
            id: 2,
            description: 'Processing'
          }
        };
      }

      // Return the simulated result
      return {
        token,
        ...result,
        finished_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 1000).toISOString()
      };
    } catch (error) {
      console.error('Mock Judge0 get error:', error);
      throw new Error('Mock Judge0 fetch failed: ' + error.message);
    }
  }
}

module.exports = MockJudge0Service;