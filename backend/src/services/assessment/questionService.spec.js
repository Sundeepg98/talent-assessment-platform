const QuestionService = require('./questionService');

describe('QuestionService - Complete Coverage', () => {
  let service;
  let mockDb;
  
  beforeEach(() => {
    mockDb = {
      questions: {
        find: jest.fn().mockResolvedValue([
          { id: 1, question: 'Q1', category: 'test' },
          { id: 2, question: 'Q2', category: 'test' }
        ]),
        create: jest.fn().mockResolvedValue({ id: 3, question: 'New Q' })
      }
    };
    service = new QuestionService(mockDb);
  });
  
  describe('Constructor', () => {
    it('should create with database', () => {
      expect(service.db).toBe(mockDb);
    });
    
    it('should create without database', () => {
      const s = new QuestionService();
      expect(s.db).toBeNull();
      expect(s.questions).toEqual([]);
    });
  });
  
  describe('getQuestions', () => {
    it('should get questions with database', async () => {
      const questions = await service.getQuestions('test');
      expect(mockDb.questions.find).toHaveBeenCalledWith({ category: 'test' });
      expect(questions.length).toBe(2);
    });
    
    it('should return mock questions without database', async () => {
      const s = new QuestionService();
      const questions = await s.getQuestions('javascript');
      expect(questions.length).toBe(2);
      expect(questions[0].category).toBe('javascript');
    });
    
    it('should use real database in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const questions = await service.getQuestions('test');
      expect(mockDb.questions.find).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('addQuestion', () => {
    it('should add question with database', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const question = { question: 'New Q', category: 'test' };
      const result = await service.addQuestion(question);
      expect(mockDb.questions.create).toHaveBeenCalledWith(question);
      expect(result.id).toBe(3);
      
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should add question without database', async () => {
      const s = new QuestionService();
      const question = { question: 'Test Q' };
      const result = await s.addQuestion(question);
      expect(result.id).toBe(1);
      expect(s.questions.length).toBe(1);
    });
  });
  
  describe('getRandomQuestions', () => {
    it('should get random questions', async () => {
      const questions = await service.getRandomQuestions(1);
      expect(questions.length).toBeLessThanOrEqual(1);
    });
    
    it('should handle count greater than available', async () => {
      const questions = await service.getRandomQuestions(10);
      expect(questions.length).toBeLessThanOrEqual(2);
    });
    
    it('should use default count', async () => {
      const questions = await service.getRandomQuestions();
      expect(questions.length).toBeLessThanOrEqual(5);
    });
  });
});
