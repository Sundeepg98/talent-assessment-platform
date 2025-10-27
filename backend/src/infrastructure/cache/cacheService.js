class CacheService {
    constructor(config = {}) {
        this.cache = new Map();
        this.ttl = config.ttl || 3600000; // 1 hour default
        this.maxSize = config.maxSize || 1000;
        this.hits = 0;
        this.misses = 0;
    }

    generateKey(...args) {
        return args.join(':');
    }

    set(key, value, ttl = this.ttl) {
        if (this.cache.size >= this.maxSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            this.misses++;
            return null;
        }

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return item.value;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    size() {
        return this.cache.size;
    }

    getStats() {
        const totalRequests = this.hits + this.misses;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl,
            hits: this.hits,
            misses: this.misses,
            hitRate: totalRequests > 0 ? (this.hits / totalRequests * 100).toFixed(2) + '%' : '0%',
            totalRequests
        };
    }
}

module.exports = CacheService;
