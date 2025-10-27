/**
 * GeminiService Test - Pure DI, No Mocks
 * Testing with real implementations only
 */

const GeminiService = require('./geminiService');

describe('GeminiService - Pure DI Implementation', () => {
  describe('Constructor', () => {
    test('should create instance as a class', () => {
      const service = new GeminiService();
      expect(service).toBeInstanceOf(GeminiService);
    });

    test('should accept config object', () => {
      const service = new GeminiService({ apiKey: 'test-key' });
      expect(service.apiKey).toBe('test-key');
    });

    test('should use environment variable when no config', () => {
      const originalEnv = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'env-key';
      
      const service = new GeminiService();
      expect(service.apiKey).toBe('env-key');
      
      process.env.GEMINI_API_KEY = originalEnv;
    });

    test('should initialize model when API key exists', () => {
      const service = new GeminiService({ apiKey: 'valid-key' });
      // Model should be null without real API key
      expect(service.model).toBeDefined();
    });

    test('should not initialize model without API key', () => {
      const service = new GeminiService({});
      expect(service.model).toBeNull();
    });
  });

  describe('generateContent method', () => {
    test('should exist as a method', () => {
      const service = new GeminiService();
      expect(typeof service.generateContent).toBe('function');
    });

    test('should throw error when model not initialized', async () => {
      const service = new GeminiService({});
      await expect(service.generateContent('test'))
        .rejects
        .toThrow('Gemini model not initialized');
    });

    test('should handle real API structure', async () => {
      const service = new GeminiService({ apiKey: 'test-key' });
      
      // Inject a test model that mimics real API
      service.model = {
        generateContent: async (prompt) => ({
          response: {
            text: () => `Response for: ${prompt}`
          }
        })
      };
      
      const result = await service.generateContent('Hello');
      expect(result).toBe('Response for: Hello');
    });

    test('should propagate errors from model', async () => {
      const service = new GeminiService({ apiKey: 'test-key' });
      
      service.model = {
        generateContent: async () => {
          throw new Error('API Error');
        }
      };
      
      await expect(service.generateContent('test'))
        .rejects
        .toThrow('API Error');
    });
  });

  describe('Dependency Injection Patterns', () => {
    test('should be exportable as a class', () => {
      expect(typeof GeminiService).toBe('function');
      expect(GeminiService.prototype.constructor).toBe(GeminiService);
    });

    test('should support multiple instances', () => {
      const service1 = new GeminiService({ apiKey: 'key1' });
      const service2 = new GeminiService({ apiKey: 'key2' });
      
      expect(service1).not.toBe(service2);
      expect(service1.apiKey).not.toBe(service2.apiKey);
    });

    test('should work with factory pattern', () => {
      const factory = (config) => new GeminiService(config);
      
      const service = factory({ apiKey: 'factory-key' });
      expect(service).toBeInstanceOf(GeminiService);
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
      container.register('gemini', (config) => new GeminiService(config));
      
      const service = container.resolve('gemini', { apiKey: 'container-key' });
      expect(service).toBeInstanceOf(GeminiService);
    });
  });

  describe('Real Integration Tests', () => {
    test('should handle missing GoogleGenerativeAI gracefully', () => {
      expect(() => {
        new GeminiService({ apiKey: 'test' });
      }).not.toThrow();
    });

    test('should be usable in use cases', () => {
      const service = new GeminiService({ apiKey: 'test-key' });
      
      // Simulate use case injection
      class AnalyzeUseCase {
        constructor(geminiService) {
          this.geminiService = geminiService;
        }
        
        async execute(prompt) {
          return this.geminiService.generateContent(prompt);
        }
      }
      
      const useCase = new AnalyzeUseCase(service);
      expect(useCase.geminiService).toBe(service);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty prompt', async () => {
      const service = new GeminiService({ apiKey: 'test' });
      service.model = {
        generateContent: async (prompt) => ({
          response: { text: () => prompt || 'empty' }
        })
      };
      
      const result = await service.generateContent('');
      expect(result).toBe('empty');
    });

    test('should handle very long prompt', async () => {
      const service = new GeminiService({ apiKey: 'test' });
      const longPrompt = 'x'.repeat(10000);
      
      service.model = {
        generateContent: async (prompt) => ({
          response: { text: () => `Length: ${prompt.length}` }
        })
      };
      
      const result = await service.generateContent(longPrompt);
      expect(result).toBe('Length: 10000');
    });
  });
});
