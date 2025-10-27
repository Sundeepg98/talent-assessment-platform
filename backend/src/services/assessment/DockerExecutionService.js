const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * DockerExecutionService
 * FREE alternative to Judge0 API
 * Executes code in isolated Docker containers with security constraints
 *
 * Features:
 * - Zero cost (no API subscription)
 * - Unlimited executions
 * - Multi-language support
 * - Secure sandboxing
 * - Resource limits
 */
class DockerExecutionService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../../temp');
    this.supportedLanguages = this._initializeLanguages();
    console.log('Docker Execution Service initialized (FREE, unlimited)');

    // Ensure temp directory exists
    this._ensureTempDir();
  }

  _initializeLanguages() {
    return {
      // Language ID mapping (compatible with Judge0)
      63: {
        name: 'JavaScript (Node.js)',
        image: 'node:18-slim',
        extension: 'js',
        cmd: 'node'
      },
      71: {
        name: 'Python (3.9)',
        image: 'python:3.9-slim',
        extension: 'py',
        cmd: 'python'
      },
      62: {
        name: 'Java (OpenJDK 17)',
        image: 'openjdk:17-slim',
        extension: 'java',
        cmd: 'javac',
        runCmd: 'java'
      },
      54: {
        name: 'C++ (GCC)',
        image: 'gcc:11',
        extension: 'cpp',
        cmd: 'g++',
        runCmd: './a.out'
      },
      50: {
        name: 'C (GCC)',
        image: 'gcc:11',
        extension: 'c',
        cmd: 'gcc',
        runCmd: './a.out'
      }
    };
  }

  async _ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Get supported languages (compatible with Judge0 API)
   */
  async getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([id, lang]) => ({
      id: parseInt(id),
      name: lang.name
    }));
  }

  /**
   * Submit code for execution
   * @param {string} sourceCode - The code to execute
   * @param {number} languageId - Language ID (Judge0 compatible)
   * @param {string} stdin - Standard input for the program
   * @returns {Object} Execution result with token
   */
  async submitCode(sourceCode, languageId, stdin = '') {
    const language = this.supportedLanguages[languageId];

    if (!language) {
      throw new Error(`Unsupported language ID: ${languageId}`);
    }

    // Generate unique token for this submission
    const token = crypto.randomBytes(16).toString('hex');

    try {
      // Execute immediately (no async queue like Judge0)
      const result = await this._executeCode(sourceCode, language, stdin);

      return {
        token,
        ...result
      };
    } catch (error) {
      console.error('Docker execution error:', error);
      return {
        token,
        stdout: '',
        stderr: error.message,
        status: { id: 13, description: 'Internal Error' },
        time: '0.000',
        memory: 0
      };
    }
  }

  /**
   * Get submission result (compatible with Judge0 API)
   * @param {string} token - Submission token
   * @returns {Object} Execution result
   */
  async getSubmission(token) {
    // Docker executes immediately, so this is just for API compatibility
    return {
      token,
      status: { id: 3, description: 'Accepted' },
      message: 'Execution completed'
    };
  }

  /**
   * Execute code in Docker container
   * @private
   */
  async _executeCode(sourceCode, language, stdin) {
    const startTime = Date.now();
    const fileId = crypto.randomBytes(8).toString('hex');
    const fileName = `code_${fileId}.${language.extension}`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      // Write code to temp file
      await fs.writeFile(filePath, sourceCode);

      // Build Docker command with security constraints
      const dockerCmd = this._buildDockerCommand(language, fileName, stdin);

      // Execute in Docker with timeout
      const { stdout, stderr } = await this._executeWithTimeout(dockerCmd, 5000);

      const executionTime = ((Date.now() - startTime) / 1000).toFixed(3);

      // Determine status based on output
      const status = this._determineStatus(stdout, stderr);

      return {
        stdout: stdout || '',
        stderr: stderr || '',
        status,
        time: executionTime,
        memory: 0, // Docker doesn't easily report memory in simple mode
        compile_output: stderr ? stderr.substring(0, 500) : null
      };

    } catch (error) {
      return {
        stdout: '',
        stderr: error.message || 'Execution failed',
        status: { id: 11, description: 'Runtime Error' },
        time: '0.000',
        memory: 0
      };
    } finally {
      // Cleanup temp file
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Build secure Docker command
   * @private
   */
  _buildDockerCommand(language, fileName, stdin) {
    const tempDirAbsolute = path.resolve(this.tempDir);

    // Base security options
    const securityOpts = [
      '--rm',                    // Auto-remove container
      '--network none',          // No network access
      '--memory="128m"',         // 128MB memory limit
      '--cpus="0.5"',           // 0.5 CPU limit
      '--pids-limit 50',        // Limit processes
      `-v "${tempDirAbsolute}:/code"`,  // Mount code directory
      '-w /code'                // Working directory
    ].join(' ');

    let execCmd;

    if (language.extension === 'java') {
      // Java requires compilation first
      const className = 'Main'; // Assume class name is Main
      execCmd = `sh -c "javac ${fileName} && java ${className}"`;
    } else if (language.extension === 'cpp' || language.extension === 'c') {
      // C/C++ requires compilation
      execCmd = `sh -c "${language.cmd} ${fileName} -o /tmp/a.out && /tmp/a.out"`;
    } else {
      // Interpreted languages (Python, JavaScript)
      execCmd = `${language.cmd} ${fileName}`;
    }

    // Only use stdin if provided
    if (stdin && stdin.trim()) {
      return `echo "${stdin}" | docker run -i ${securityOpts} ${language.image} ${execCmd}`;
    } else {
      return `docker run ${securityOpts} ${language.image} ${execCmd}`;
    }
  }

  /**
   * Execute command with timeout
   * @private
   */
  async _executeWithTimeout(command, timeoutMs) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Time Limit Exceeded'));
      }, timeoutMs);

      try {
        const result = await execAsync(command, {
          maxBuffer: 1024 * 1024 // 1MB buffer
        });
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        // Non-zero exit code - still resolve with stderr
        resolve({
          stdout: error.stdout || '',
          stderr: error.stderr || error.message
        });
      }
    });
  }

  /**
   * Determine execution status
   * @private
   */
  _determineStatus(stdout, stderr) {
    if (!stderr || stderr.trim() === '') {
      return { id: 3, description: 'Accepted' };
    }

    // Check for common error types
    if (stderr.includes('SyntaxError') || stderr.includes('compilation terminated')) {
      return { id: 6, description: 'Compilation Error' };
    }

    if (stderr.includes('Time Limit Exceeded') || stderr.includes('Killed')) {
      return { id: 5, description: 'Time Limit Exceeded' };
    }

    if (stderr.includes('MemoryError') || stderr.includes('out of memory')) {
      return { id: 4, description: 'Memory Limit Exceeded' };
    }

    // Default to runtime error
    return { id: 11, description: 'Runtime Error' };
  }
}

module.exports = DockerExecutionService;
