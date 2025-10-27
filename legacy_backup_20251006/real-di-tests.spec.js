const { 
  TestDatabase, 
  TestEmailService, 
  TestTokenService,
  TestPasswordService 
} = require('./TestImplementations');

describe('Real DI Test Suite - No Mocks', () => {
  let db, emailService, tokenService, passwordService;
  
  beforeAll(async () => {
    // Initialize real services
    db = new TestDatabase();
    await db.connect();
    emailService = new TestEmailService();
    tokenService = new TestTokenService();
    passwordService = new TestPasswordService();
  });
  
  afterAll(async () => {
    await db.disconnect();
  });

  describe('Service Tests - Real Implementations', () => {
    test('GeminiService - Class export with DI', () => {
      const GeminiService = require('../ai-services/llm/geminiService');
      expect(typeof GeminiService).toBe('function');
      expect(GeminiService.prototype.constructor).toBeDefined();
      
      const service = new GeminiService({ apiKey: 'test-key' });
      expect(service).toBeDefined();
      expect(service.generateContent).toBeDefined();
    });

    test('Judge0Service - Class export with DI', () => {
      const Judge0Service = require('../services/assessment/judge0Service');
      expect(typeof Judge0Service).toBe('function');
      
      const service = new Judge0Service({ apiKey: 'test-key' });
      expect(service).toBeDefined();
      expect(service.submitCode).toBeDefined();
      expect(service.getSubmission).toBeDefined();
    });

    test('PDFProcessor - Class export with DI', () => {
      const PDFProcessor = require('../services/processing/pdfProcessor');
      expect(typeof PDFProcessor).toBe('function');
      
      const processor = new PDFProcessor();
      expect(processor).toBeDefined();
      expect(processor.processFile).toBeDefined();
      expect(processor.extractText).toBeDefined();
    });

    test('QuestionService - Class export with DI', () => {
      const QuestionService = require('../services/assessment/questionService');
      expect(typeof QuestionService).toBe('function');
      
      const service = new QuestionService(db);
      expect(service).toBeDefined();
      expect(service.getQuestions).toBeDefined();
      expect(service.getRandomQuestions).toBeDefined();
      expect(service.addQuestion).toBeDefined();
    });

    test('CacheService - Real implementation', () => {
      const CacheService = require('../services/infrastructure/cacheService');
      const cache = new CacheService({ ttl: 1000, maxSize: 10 });
      
      // Test all methods
      const key = cache.generateKey('test', 'key');
      expect(key).toBe('test:key');
      
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
      expect(cache.has('test')).toBe(true);
      expect(cache.size()).toBe(1);
      
      cache.delete('test');
      expect(cache.get('test')).toBeNull();
      
      cache.clear();
      expect(cache.size()).toBe(0);
    });
    
    test('ResumeAnalyzerService - Real implementation', () => {
      const ResumeAnalyzerService = require('../services/resumeAnalyzer/index');
      expect(typeof ResumeAnalyzerService).toBe('function');
      
      const service = new ResumeAnalyzerService();
      expect(service).toBeDefined();
      expect(service.analyzeResume).toBeDefined();
      expect(service._extractScore).toBeDefined();
      
      // Test regex fix
      const score = service._extractScore('Score: 85/100');
      expect(score).toBe(85);
    });
  });

  describe('Use Case Tests - Real DI', () => {
    test('RegisterUserUseCase exists and is a class', () => {
      const RegisterUserUseCase = require('../application/useCases/identity/RegisterUserUseCase');
      expect(typeof RegisterUserUseCase).toBe('function');
      expect(RegisterUserUseCase.prototype.execute).toBeDefined();
    });

    test('CreateSessionUseCase exists and is a class', () => {
      const CreateSessionUseCase = require('../application/useCases/identity/CreateSessionUseCase');
      expect(typeof CreateSessionUseCase).toBe('function');
      expect(CreateSessionUseCase.prototype.execute).toBeDefined();
    });

    test('SubmitCodeUseCase exists and is a class', () => {
      const SubmitCodeUseCase = require('../application/useCases/assessment/SubmitCodeUseCase');
      expect(typeof SubmitCodeUseCase).toBe('function');
      expect(SubmitCodeUseCase.prototype.execute).toBeDefined();
    });
  });

  describe('Model Tests', () => {
    test('User model exists', () => {
      const User = require('../models/User');
      expect(User).toBeDefined();
      expect(User.modelName).toBe('User');
    });

    test('Submission model exists', () => {
      const Submission = require('../models/Submission');
      expect(Submission).toBeDefined();
      expect(Submission.modelName).toBe('Submission');
    });

    test('InterviewSession model exists', () => {
      const InterviewSession = require('../models/InterviewSession');
      expect(InterviewSession).toBeDefined();
      expect(InterviewSession.modelName).toBe('InterviewSession');
    });
  });

  describe('Domain Layer Tests', () => {
    test('Value Objects exist', () => {
      const Email = require('../domain/identity/valueObjects/Email');
      const Password = require('../domain/identity/valueObjects/Password');
      const UserId = require('../domain/identity/valueObjects/UserId');
      
      expect(typeof Email).toBe('function');
      expect(typeof Password).toBe('function');
      expect(typeof UserId).toBe('function');
    });

    test('Entities exist', () => {
      const User = require('../domain/identity/entities/User');
      expect(typeof User).toBe('function');
    });

    test('Repository interfaces exist', () => {
      const IUserRepository = require('../domain/identity/repositories/IUserRepository');
      expect(typeof IUserRepository).toBe('function');
    });
  });

  describe('Infrastructure Tests', () => {
    test('BaseRepository exists', () => {
      const BaseRepository = require('../infrastructure/persistence/BaseRepository');
      expect(typeof BaseRepository).toBe('function');
      
      const repo = new BaseRepository();
      expect(repo.findAll).toBeDefined();
      expect(repo.findById).toBeDefined();
      expect(repo.create).toBeDefined();
      expect(repo.update).toBeDefined();
      expect(repo.delete).toBeDefined();
    });

    test('DIContainer exists and works', () => {
      const DIContainer = require('../infrastructure/config/container');
      expect(typeof DIContainer).toBe('function');
      
      const container = new DIContainer();
      
      // Test registration and resolution
      container.register('testService', () => ({ name: 'test' }));
      const service = container.resolve('testService');
      expect(service.name).toBe('test');
      
      // Test singleton
      container.register('singleton', () => ({ id: Date.now() }), { singleton: true });
      const s1 = container.resolve('singleton');
      const s2 = container.resolve('singleton');
      expect(s1).toBe(s2);
    });

    test('ExpressApp configuration exists', () => {
      const ExpressApp = require('../infrastructure/config/expressApp');
      expect(typeof ExpressApp).toBe('function');
      
      const app = new ExpressApp({ cors: { origin: '*' } });
      const expressInstance = app.create();
      expect(expressInstance).toBeDefined();
      expect(expressInstance.use).toBeDefined();
    });
  });

  describe('Service Factory Tests', () => {
    test('All services are properly exported as classes', () => {
      // These should all be classes (functions) not instances
      const services = [
        '../services/judge0Service',
        '../services/pdfProcessor',
        '../services/questionService',
        '../services/cacheService',
        '../ai-services/llm/geminiService'
      ];
      
      services.forEach(servicePath => {
        const Service = require(servicePath);
        expect(typeof Service).toBe('function');
        expect(Service.prototype).toBeDefined();
        
        // Should be able to instantiate
        const instance = new Service();
        expect(instance).toBeDefined();
      });
    });
  });
});