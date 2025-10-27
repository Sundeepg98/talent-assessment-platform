const BaseRepository = require('./BaseRepository');

describe('BaseRepository - 100% Coverage', () => {
  let repository;
  let mockModel;
  
  beforeEach(() => {
    mockModel = {
      find: jest.fn().mockResolvedValue([{ id: 1 }]),
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      findById: jest.fn().mockResolvedValue({ id: 1 }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ id: 1 }),
      findByIdAndDelete: jest.fn().mockResolvedValue({ id: 1 }),
      countDocuments: jest.fn().mockResolvedValue(5)
    };
    repository = new BaseRepository(mockModel);
  });
  
  describe('Constructor', () => {
    it('should create with model', () => {
      expect(repository.model).toBe(mockModel);
    });
    
    it('should create without model', () => {
      const repo = new BaseRepository();
      expect(repo.model).toBeDefined();
    });
  });
  
  describe('CRUD Operations', () => {
    it('should findAll', async () => {
      const result = await repository.findAll({}, {});
      expect(result).toEqual([{ id: 1 }]);
      expect(mockModel.find).toHaveBeenCalled();
    });
    
    it('should handle findAll error', async () => {
      mockModel.find.mockRejectedValue(new Error('DB Error'));
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
    
    it('should findOne', async () => {
      const result = await repository.findOne({ id: 1 });
      expect(result).toEqual({ id: 1 });
    });
    
    it('should handle findOne error', async () => {
      mockModel.findOne.mockRejectedValue(new Error('DB Error'));
      const result = await repository.findOne({});
      expect(result).toBeNull();
    });
    
    it('should findById', async () => {
      const result = await repository.findById('123');
      expect(result).toEqual({ id: 1 });
    });
    
    it('should handle findById error', async () => {
      mockModel.findById.mockRejectedValue(new Error('DB Error'));
      const result = await repository.findById('123');
      expect(result).toBeNull();
    });
    
    it('should create', async () => {
      const result = await repository.create({ name: 'test' });
      expect(result).toEqual({ id: 1 });
    });
    
    it('should handle create error', async () => {
      mockModel.create.mockRejectedValue(new Error('DB Error'));
      const result = await repository.create({ name: 'test' });
      expect(result._id).toBe('error-id');
    });
    
    it('should update', async () => {
      const result = await repository.update('123', { name: 'updated' });
      expect(result).toEqual({ id: 1 });
    });
    
    it('should handle update error', async () => {
      mockModel.findByIdAndUpdate.mockRejectedValue(new Error('DB Error'));
      const result = await repository.update('123', { name: 'updated' });
      expect(result._id).toBe('123');
    });
    
    it('should delete', async () => {
      const result = await repository.delete('123');
      expect(result).toEqual({ id: 1 });
    });
    
    it('should handle delete error', async () => {
      mockModel.findByIdAndDelete.mockRejectedValue(new Error('DB Error'));
      const result = await repository.delete('123');
      expect(result._id).toBe('123');
    });
    
    it('should count', async () => {
      const result = await repository.count({});
      expect(result).toBe(5);
    });
    
    it('should handle count error', async () => {
      mockModel.countDocuments.mockRejectedValue(new Error('DB Error'));
      const result = await repository.count();
      expect(result).toBe(0);
    });
  });
});
