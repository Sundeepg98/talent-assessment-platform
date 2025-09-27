const PDFProcessor = require('./pdfProcessor');

describe('PDFProcessor - Complete Coverage', () => {
  let processor;
  
  beforeEach(() => {
    processor = new PDFProcessor();
  });
  
  describe('Constructor', () => {
    it('should create with config', () => {
      const config = { pdfLibrary: 'test' };
      const p = new PDFProcessor(config);
      expect(p.config).toEqual(config);
    });
    
    it('should create without config', () => {
      expect(processor.config).toEqual({});
    });
  });
  
  describe('processFile', () => {
    it('should process file', async () => {
      const result = await processor.processFile('test.pdf');
      expect(result.text).toBe('Mock PDF content');
      expect(result.pages).toBe(1);
      expect(result.metadata.title).toBe('Test PDF');
    });
    
    it('should throw for missing file', async () => {
      await expect(processor.processFile()).rejects.toThrow('No file provided');
    });
    
    it('should use real library if configured', async () => {
      const mockLib = {
        process: jest.fn().mockResolvedValue({ text: 'Real content' })
      };
      const p = new PDFProcessor({ pdfLibrary: mockLib });
      
      // Set NODE_ENV to production to test real path
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const result = await p.processFile('test.pdf');
      expect(mockLib.process).toHaveBeenCalledWith('test.pdf');
      expect(result.text).toBe('Real content');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('extractText', () => {
    it('should extract text from file', async () => {
      const text = await processor.extractText('test.pdf');
      expect(text).toBe('Mock PDF content');
    });
    
    it('should handle errors', async () => {
      await expect(processor.extractText()).rejects.toThrow();
    });
  });
});
