/**
 * IInterviewRepository Test - Pure DI, No Mocks
 * Testing interface/abstract class pattern
 */

const IInterviewRepository = require('./IInterviewRepository');

describe('IInterviewRepository - Pure DI Implementation', () => {
  describe('Interface Definition', () => {
    test('should be a class constructor', () => {
      expect(typeof IInterviewRepository).toBe('function');
      expect(IInterviewRepository.prototype.constructor).toBe(IInterviewRepository);
    });

    test('should define all required methods', () => {
      const repository = new IInterviewRepository();
      
      // CRUD operations
      expect(typeof repository.create).toBe('function');
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.update).toBe('function');
      expect(typeof repository.delete).toBe('function');
      
      // Find operations
      expect(typeof repository.findByCandidateId).toBe('function');
      expect(typeof repository.findByInterviewerId).toBe('function');
      expect(typeof repository.findByJobId).toBe('function');
      expect(typeof repository.findByDateRange).toBe('function');
      expect(typeof repository.findUpcoming).toBe('function');
      
      // Status operations
      expect(typeof repository.updateStatus).toBe('function');
      expect(typeof repository.schedule).toBe('function');
      expect(typeof repository.reschedule).toBe('function');
      expect(typeof repository.cancel).toBe('function');
      
      // Additional operations
      expect(typeof repository.saveFeedback).toBe('function');
      expect(typeof repository.saveRecording).toBe('function');
      expect(typeof repository.count).toBe('function');
    });
  });

  describe('Interface Contract', () => {
    let repository;

    beforeEach(() => {
      repository = new IInterviewRepository();
    });

    test('create should throw not implemented error', async () => {
      await expect(repository.create({}))
        .rejects
        .toThrow('IInterviewRepository.create must be implemented');
    });

    test('findById should throw not implemented error', async () => {
      await expect(repository.findById('123'))
        .rejects
        .toThrow('IInterviewRepository.findById must be implemented');
    });

    test('update should throw not implemented error', async () => {
      await expect(repository.update({}))
        .rejects
        .toThrow('IInterviewRepository.update must be implemented');
    });

    test('delete should throw not implemented error', async () => {
      await expect(repository.delete('123'))
        .rejects
        .toThrow('IInterviewRepository.delete must be implemented');
    });
  });

  describe('Test Implementation - Pure DI', () => {
    // Create a test implementation that follows the interface
    class TestInterviewRepository extends IInterviewRepository {
      constructor(database = new Map()) {
        super();
        this.db = database;
        this.idCounter = 1;
      }

      async create(interviewData) {
        const id = `interview-${this.idCounter++}`;
        const interview = { 
          id, 
          ...interviewData, 
          createdAt: new Date(),
          status: 'scheduled'
        };
        this.db.set(id, interview);
        return interview;
      }

      async findById(interviewId) {
        return this.db.get(interviewId) || null;
      }

      async findByCandidateId(candidateId) {
        const results = [];
        for (const interview of this.db.values()) {
          if (interview.candidateId === candidateId) {
            results.push(interview);
          }
        }
        return results;
      }

      async findByInterviewerId(interviewerId) {
        const results = [];
        for (const interview of this.db.values()) {
          if (interview.interviewerId === interviewerId) {
            results.push(interview);
          }
        }
        return results;
      }

      async findByJobId(jobId) {
        const results = [];
        for (const interview of this.db.values()) {
          if (interview.jobId === jobId) {
            results.push(interview);
          }
        }
        return results;
      }

      async findByDateRange(startDate, endDate) {
        const results = [];
        for (const interview of this.db.values()) {
          const scheduledAt = new Date(interview.scheduledAt);
          if (scheduledAt >= startDate && scheduledAt <= endDate) {
            results.push(interview);
          }
        }
        return results;
      }

      async update(interviewData) {
        const { id } = interviewData;
        if (!this.db.has(id)) {
          throw new Error('Interview not found');
        }
        const updated = { ...this.db.get(id), ...interviewData };
        this.db.set(id, updated);
        return updated;
      }

      async updateStatus(interviewId, status) {
        if (!this.db.has(interviewId)) return false;
        const interview = this.db.get(interviewId);
        interview.status = status;
        interview.updatedAt = new Date();
        return true;
      }

      async schedule(interviewId, scheduledAt) {
        if (!this.db.has(interviewId)) return false;
        const interview = this.db.get(interviewId);
        interview.scheduledAt = scheduledAt;
        interview.status = 'scheduled';
        return true;
      }

      async reschedule(interviewId, newScheduledAt, reason) {
        if (!this.db.has(interviewId)) return false;
        const interview = this.db.get(interviewId);
        interview.scheduledAt = newScheduledAt;
        interview.rescheduleReason = reason;
        interview.rescheduledAt = new Date();
        return true;
      }

      async cancel(interviewId, reason) {
        if (!this.db.has(interviewId)) return false;
        const interview = this.db.get(interviewId);
        interview.status = 'cancelled';
        interview.cancellationReason = reason;
        interview.cancelledAt = new Date();
        return true;
      }

      async saveFeedback(interviewId, feedback) {
        if (!this.db.has(interviewId)) return false;
        const interview = this.db.get(interviewId);
        interview.feedback = feedback;
        interview.feedbackAt = new Date();
        return true;
      }

      async saveRecording(interviewId, recordingUrl) {
        if (!this.db.has(interviewId)) return false;
        const interview = this.db.get(interviewId);
        interview.recordingUrl = recordingUrl;
        interview.recordedAt = new Date();
        return true;
      }

      async delete(interviewId) {
        return this.db.delete(interviewId);
      }

      async findUpcoming(options = {}) {
        const now = new Date();
        const results = [];
        for (const interview of this.db.values()) {
          if (interview.scheduledAt && new Date(interview.scheduledAt) > now) {
            if (interview.status === 'scheduled') {
              results.push(interview);
            }
          }
        }
        return results.sort((a, b) => 
          new Date(a.scheduledAt) - new Date(b.scheduledAt)
        );
      }

      async count(filter = {}) {
        if (Object.keys(filter).length === 0) {
          return this.db.size;
        }
        
        let count = 0;
        for (const interview of this.db.values()) {
          let matches = true;
          for (const [key, value] of Object.entries(filter)) {
            if (interview[key] !== value) {
              matches = false;
              break;
            }
          }
          if (matches) count++;
        }
        return count;
      }
    }

    let repository;

    beforeEach(() => {
      repository = new TestInterviewRepository();
    });

    test('should implement create correctly', async () => {
      const interviewData = {
        candidateId: 'candidate-1',
        interviewerId: 'interviewer-1',
        jobId: 'job-1',
        type: 'technical',
        scheduledAt: new Date('2025-02-01')
      };

      const created = await repository.create(interviewData);
      
      expect(created.id).toBeDefined();
      expect(created.candidateId).toBe('candidate-1');
      expect(created.status).toBe('scheduled');
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    test('should implement findById correctly', async () => {
      const created = await repository.create({ candidateId: 'test' });
      
      const found = await repository.findById(created.id);
      expect(found).toEqual(created);
      
      const notFound = await repository.findById('nonexistent');
      expect(notFound).toBeNull();
    });

    test('should implement findByCandidateId correctly', async () => {
      await repository.create({ candidateId: 'candidate-1' });
      await repository.create({ candidateId: 'candidate-1' });
      await repository.create({ candidateId: 'candidate-2' });
      
      const interviews = await repository.findByCandidateId('candidate-1');
      expect(interviews).toHaveLength(2);
      expect(interviews.every(i => i.candidateId === 'candidate-1')).toBe(true);
    });

    test('should implement updateStatus correctly', async () => {
      const created = await repository.create({ candidateId: 'test' });
      
      const updated = await repository.updateStatus(created.id, 'completed');
      expect(updated).toBe(true);
      
      const interview = await repository.findById(created.id);
      expect(interview.status).toBe('completed');
    });

    test('should implement cancel correctly', async () => {
      const created = await repository.create({ candidateId: 'test' });
      
      const cancelled = await repository.cancel(created.id, 'No longer available');
      expect(cancelled).toBe(true);
      
      const interview = await repository.findById(created.id);
      expect(interview.status).toBe('cancelled');
      expect(interview.cancellationReason).toBe('No longer available');
    });

    test('should implement findUpcoming correctly', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      
      const past = new Date();
      past.setDate(past.getDate() - 7);
      
      await repository.create({ scheduledAt: future, status: 'scheduled' });
      await repository.create({ scheduledAt: future, status: 'scheduled' });
      await repository.create({ scheduledAt: past, status: 'scheduled' });
      
      const upcoming = await repository.findUpcoming();
      expect(upcoming).toHaveLength(2);
    });

    test('should implement count correctly', async () => {
      await repository.create({ candidateId: 'c1', status: 'scheduled' });
      await repository.create({ candidateId: 'c2', status: 'completed' });
      await repository.create({ candidateId: 'c3', status: 'scheduled' });
      
      const total = await repository.count();
      expect(total).toBe(3);
      
      const scheduled = await repository.count({ status: 'scheduled' });
      expect(scheduled).toBe(2);
    });
  });

  describe('Dependency Injection Patterns', () => {
    test('should work with DI container', () => {
      class DIContainer {
        constructor() {
          this.services = new Map();
        }
        
        register(name, factory) {
          this.services.set(name, factory);
        }
        
        resolve(name) {
          const factory = this.services.get(name);
          return factory();
        }
      }
      
      const container = new DIContainer();
      
      // Register a concrete implementation
      container.register('interviewRepository', () => {
        class ConcreteRepository extends IInterviewRepository {
          async create(data) {
            return { id: '1', ...data };
          }
        }
        return new ConcreteRepository();
      });
      
      const repository = container.resolve('interviewRepository');
      expect(repository).toBeInstanceOf(IInterviewRepository);
    });
  });
});
