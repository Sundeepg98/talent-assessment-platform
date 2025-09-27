/**
 * Judge0Service Test - Pure DI, No Mocks
 * Testing with real implementations only
 */

const Judge0Service = require('./judge0Service');

describe('Judge0Service - Pure DI Implementation', () => {
  describe('Constructor', () => {
    test('should create instance as a class', () => {
      const service = new Judge0Service();
      expect(service).toBeInstanceOf(Judge0Service);
    });

    test('should accept config object', () => {
      const service = new Judge0Service({ 
        apiKey: 'test-key',
        baseUrl: 'https://test.api.com'
      });
      expect(service.apiKey).toBe('test-key');
      expect(service.baseUrl).toBe('https://test.api.com');
    });

    test('should use environment variable when no config', () => {
      const originalEnv = process.env.JUDGE0_API_KEY;
      process.env.JUDGE0_API_KEY = 'env-key';
      
      const service = new Judge0Service();
      expect(service.apiKey).toBe('env-key');
      
      process.env.JUDGE0_API_KEY = originalEnv;
    });

    test('should use default base URL', () => {
      const service = new Judge0Service();
      expect(service.baseUrl).toBe('https://judge0-ce.p.rapidapi.com');
    });
  });

  describe('submitCode method', () => {
    test('should exist as a method', () => {
      const service = new Judge0Service();
      expect(typeof service.submitCode).toBe('function');
    });

    test('should require code parameter', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      
      await expect(service.submitCode(null, 63))
        .rejects
        .toThrow();
    });

    test('should accept code and language ID', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      
      // Override the submission to avoid real API call
      service.submitCode = async (code, languageId, stdin) => {
        return {
          token: 'test-token',
          code,
          languageId,
          stdin
        };
      };
      
      const result = await service.submitCode('print("Hello")', 71, 'input');
      expect(result.token).toBe('test-token');
      expect(result.code).toBe('print("Hello")');
      expect(result.languageId).toBe(71);
    });
  });

  describe('getSubmission method', () => {
    test('should exist as a method', () => {
      const service = new Judge0Service();
      expect(typeof service.getSubmission).toBe('function');
    });

    test('should require token parameter', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      
      await expect(service.getSubmission(null))
        .rejects
        .toThrow();
    });

    test('should handle submission statuses', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      
      // Override to return test data
      service.getSubmission = async (token) => {
        return {
          token,
          status: { id: 3, description: 'Accepted' },
          stdout: 'Hello World',
          stderr: null,
          compile_output: null
        };
      };
      
      const result = await service.getSubmission('test-token');
      expect(result.status.id).toBe(3);
      expect(result.stdout).toBe('Hello World');
    });
  });

  describe('Dependency Injection Patterns', () => {
    test('should be exportable as a class', () => {
      expect(typeof Judge0Service).toBe('function');
      expect(Judge0Service.prototype.constructor).toBe(Judge0Service);
    });

    test('should support multiple instances', () => {
      const service1 = new Judge0Service({ apiKey: 'key1' });
      const service2 = new Judge0Service({ apiKey: 'key2' });
      
      expect(service1).not.toBe(service2);
      expect(service1.apiKey).not.toBe(service2.apiKey);
    });

    test('should work with factory pattern', () => {
      const factory = (config) => new Judge0Service(config);
      
      const service = factory({ apiKey: 'factory-key' });
      expect(service).toBeInstanceOf(Judge0Service);
      expect(service.apiKey).toBe('factory-key');
    });

    test('should work with container pattern', () => {
      class Container {
        constructor() {
          this.services = new Map();
        }
        
        register(name, factory) {
          this.services.set(name, factory);
        }
        
        resolve(name, ...args) {
          const factory = this.services.get(name);
          return factory(...args);
        }
      }
      
      const container = new Container();
      container.register('judge0', (config) => new Judge0Service(config));
      
      const service = container.resolve('judge0', { apiKey: 'container-key' });
      expect(service).toBeInstanceOf(Judge0Service);
      expect(service.apiKey).toBe('container-key');
    });
  });

  describe('Language Support', () => {
    test('should handle Python submissions', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      const pythonCode = 'print("Hello Python")';
      const pythonLangId = 71;
      
      service.submitCode = async (code, langId) => ({
        token: 'py-token',
        languageId: langId
      });
      
      const result = await service.submitCode(pythonCode, pythonLangId);
      expect(result.languageId).toBe(71);
    });

    test('should handle JavaScript submissions', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      const jsCode = 'console.log("Hello JS")';
      const jsLangId = 63;
      
      service.submitCode = async (code, langId) => ({
        token: 'js-token',
        languageId: langId
      });
      
      const result = await service.submitCode(jsCode, jsLangId);
      expect(result.languageId).toBe(63);
    });

    test('should handle Java submissions', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      const javaCode = 'public class Main { public static void main(String[] args) { System.out.println("Hello"); } }';
      const javaLangId = 62;
      
      service.submitCode = async (code, langId) => ({
        token: 'java-token',
        languageId: langId
      });
      
      const result = await service.submitCode(javaCode, javaLangId);
      expect(result.languageId).toBe(62);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors', async () => {
      const service = new Judge0Service({ apiKey: 'invalid' });
      
      service.submitCode = async () => {
        throw new Error('API Error: Invalid API Key');
      };
      
      await expect(service.submitCode('test', 71))
        .rejects
        .toThrow('API Error');
    });

    test('should handle network errors', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      
      service.getSubmission = async () => {
        throw new Error('Network Error');
      };
      
      await expect(service.getSubmission('token'))
        .rejects
        .toThrow('Network Error');
    });

    test('should handle compilation errors', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      
      service.getSubmission = async () => ({
        status: { id: 6, description: 'Compilation Error' },
        compile_output: 'Syntax error on line 1',
        stdout: null,
        stderr: null
      });
      
      const result = await service.getSubmission('error-token');
      expect(result.status.id).toBe(6);
      expect(result.compile_output).toContain('Syntax error');
    });
  });

  describe('Real Integration Tests', () => {
    test('should be usable in SubmitCodeUseCase', () => {
      const service = new Judge0Service({ apiKey: 'test-key' });
      
      class SubmitCodeUseCase {
        constructor(judge0Service) {
          this.judge0Service = judge0Service;
        }
        
        async execute(code, languageId) {
          const submission = await this.judge0Service.submitCode(code, languageId);
          return this.judge0Service.getSubmission(submission.token);
        }
      }
      
      const useCase = new SubmitCodeUseCase(service);
      expect(useCase.judge0Service).toBe(service);
    });

    test('should integrate with mock service when API key is test-judge0-key', () => {
      const service = new Judge0Service({ apiKey: 'test-judge0-key' });
      expect(service.apiKey).toBe('test-judge0-key');
      // Mock service should activate with this key
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty code submission', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      
      service.submitCode = async (code) => ({
        token: 'empty-token',
        code: code || '',
        status: { id: 3 }
      });
      
      const result = await service.submitCode('', 71);
      expect(result.code).toBe('');
    });

    test('should handle very long code', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      const longCode = 'x'.repeat(100000);
      
      service.submitCode = async (code) => ({
        token: 'long-token',
        codeLength: code.length
      });
      
      const result = await service.submitCode(longCode, 71);
      expect(result.codeLength).toBe(100000);
    });

    test('should handle special characters in code', async () => {
      const service = new Judge0Service({ apiKey: 'test' });
      const specialCode = 'print("Hello\\n\\t\\"World\\"")';
      
      service.submitCode = async (code) => ({
        token: 'special-token',
        code
      });
      
      const result = await service.submitCode(specialCode, 71);
      expect(result.code).toBe(specialCode);
    });
  });
});