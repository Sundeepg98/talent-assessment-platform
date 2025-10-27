/**
 * CacheService Test - Pure DI, No Mocks
 * Testing with real implementations only
 */

const CacheService = require('./cacheService');

describe('CacheService - Pure DI Implementation', () => {
  let service;

  beforeEach(() => {
    // Create fresh instance for each test
    service = new CacheService();
  });

  afterEach(() => {
    // Clean up
    if (service) {
      service.clear();
    }
  });

  describe('Constructor', () => {
    test('should create instance as a class', () => {
      const cache = new CacheService();
      expect(cache).toBeInstanceOf(CacheService);
    });

    test('should accept config object', () => {
      const cache = new CacheService({ 
        ttl: 5000,
        maxSize: 100
      });
      expect(cache.ttl).toBe(5000);
      expect(cache.maxSize).toBe(100);
    });

    test('should use default values when no config', () => {
      const cache = new CacheService();
      expect(cache.ttl).toBe(3600000); // 1 hour default
      expect(cache.maxSize).toBe(1000);
    });

    test('should initialize empty cache', () => {
      const cache = new CacheService();
      expect(cache.size()).toBe(0);
    });
  });

  describe('set and get methods', () => {
    test('should store and retrieve values', () => {
      service.set('key1', 'value1');
      expect(service.get('key1')).toBe('value1');
    });

    test('should handle complex objects', () => {
      const obj = { name: 'test', data: [1, 2, 3] };
      service.set('obj', obj);
      expect(service.get('obj')).toEqual(obj);
    });

    test('should return null for non-existent keys', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    test('should overwrite existing values', () => {
      service.set('key', 'value1');
      service.set('key', 'value2');
      expect(service.get('key')).toBe('value2');
    });
  });

  describe('TTL functionality', () => {
    test('should expire items after TTL', async () => {
      const cache = new CacheService({ ttl: 100 }); // 100ms TTL
      cache.set('expiring', 'value');
      
      expect(cache.get('expiring')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('expiring')).toBeNull();
    });

    test('should not expire items before TTL', async () => {
      const cache = new CacheService({ ttl: 200 });
      cache.set('notExpired', 'value');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(cache.get('notExpired')).toBe('value');
    });
  });

  describe('has method', () => {
    test('should return true for existing keys', () => {
      service.set('exists', 'value');
      expect(service.has('exists')).toBe(true);
    });

    test('should return false for non-existent keys', () => {
      expect(service.has('doesnotexist')).toBe(false);
    });

    test('should return false for expired keys', async () => {
      const cache = new CacheService({ ttl: 50 });
      cache.set('expiring', 'value');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.has('expiring')).toBe(false);
    });
  });

  describe('delete method', () => {
    test('should remove items from cache', () => {
      service.set('toDelete', 'value');
      expect(service.has('toDelete')).toBe(true);
      
      service.delete('toDelete');
      expect(service.has('toDelete')).toBe(false);
    });

    test('should return true when deleting existing key', () => {
      service.set('key', 'value');
      expect(service.delete('key')).toBe(true);
    });

    test('should return false when deleting non-existent key', () => {
      expect(service.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear method', () => {
    test('should remove all items', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');
      
      expect(service.size()).toBe(3);
      
      service.clear();
      
      expect(service.size()).toBe(0);
      expect(service.get('key1')).toBeNull();
    });
  });

  describe('size method', () => {
    test('should return correct cache size', () => {
      expect(service.size()).toBe(0);
      
      service.set('key1', 'value1');
      expect(service.size()).toBe(1);
      
      service.set('key2', 'value2');
      expect(service.size()).toBe(2);
      
      service.delete('key1');
      expect(service.size()).toBe(1);
    });
  });

  describe('generateKey method', () => {
    test('should generate cache keys from parts', () => {
      const key = service.generateKey('part1', 'part2', 'part3');
      expect(key).toBe('part1:part2:part3');
    });

    test('should handle single part', () => {
      const key = service.generateKey('single');
      expect(key).toBe('single');
    });

    test('should handle empty parts', () => {
      const key = service.generateKey('', 'part', '');
      expect(key).toBe(':part:');
    });
  });

  describe('Max size limit', () => {
    test('should respect max size limit', () => {
      const cache = new CacheService({ maxSize: 3 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);
      
      // Should evict oldest when adding new
      cache.set('key4', 'value4');
      expect(cache.size()).toBe(3);
      expect(cache.has('key1')).toBe(false); // Oldest evicted
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('Dependency Injection Patterns', () => {
    test('should be exportable as a class', () => {
      expect(typeof CacheService).toBe('function');
      expect(CacheService.prototype.constructor).toBe(CacheService);
    });

    test('should support multiple independent instances', () => {
      const cache1 = new CacheService();
      const cache2 = new CacheService();
      
      cache1.set('key', 'value1');
      cache2.set('key', 'value2');
      
      expect(cache1.get('key')).toBe('value1');
      expect(cache2.get('key')).toBe('value2');
    });
  });
});
