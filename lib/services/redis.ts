// lib/services/redis.ts - Redis cache client (Node.js environment)
import { logInfo, logError, logWarning } from '../utils/logger.js';
import { config } from '../config/env.js';

class RedisService {
    private baseUrl: string;
    private token: string;

    constructor() {
        this.baseUrl = config.redis.url || '';
        this.token = config.redis.token || '';
    }

    private isConfigured(): boolean {
        return !!(this.baseUrl && this.token);
    }

    async get<T>(key: string, correlationId: string): Promise<T | null> {
        if (!this.isConfigured()) {
            logWarning('Redis not configured, skipping cache get', { correlationId, operation: 'redis_get', key });
            return null;
        }

        try {
            logInfo('Redis GET operation', { correlationId, operation: 'redis_get', key });

            const response = await fetch(`${this.baseUrl}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Redis GET failed: ${response.status}`);
            }

            const data = await response.json();
            const result = data.result ? JSON.parse(data.result) : null;

            logInfo('Redis GET completed', {
                correlationId,
                operation: 'redis_get',
                key,
                hit: !!result
            });

            return result;
        } catch (error) {
            logWarning('Redis GET failed, will fallback to database', {
                correlationId,
                operation: 'redis_get',
                key,
                error: (error as Error).message
            });
            return null; // Graceful degradation
        }
    }

    async set<T>(key: string, value: T, ttlSeconds: number, correlationId: string): Promise<void> {
        if (!this.isConfigured()) {
            logWarning('Redis not configured, skipping cache set', { correlationId, operation: 'redis_set', key });
            return;
        }

        try {
            logInfo('Redis SET operation', { correlationId, operation: 'redis_set', key, ttl: ttlSeconds });

            const response = await fetch(`${this.baseUrl}/setex/${key}/${ttlSeconds}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(value)
            });

            if (!response.ok) {
                throw new Error(`Redis SET failed: ${response.status}`);
            }

            logInfo('Redis SET completed', {
                correlationId,
                operation: 'redis_set',
                key
            });
        } catch (error) {
            logWarning('Redis SET failed (non-critical)', {
                correlationId,
                operation: 'redis_set',
                key,
                error: (error as Error).message
            });
            // Don't throw - cache failures are non-critical
        }
    }

    async del(key: string, correlationId: string): Promise<void> {
        if (!this.isConfigured()) {
            logWarning('Redis not configured, skipping cache delete', { correlationId, operation: 'redis_del', key });
            return;
        }

        try {
            logInfo('Redis DEL operation', { correlationId, operation: 'redis_del', key });

            const response = await fetch(`${this.baseUrl}/del/${key}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Redis DEL failed: ${response.status}`);
            }

            logInfo('Redis DEL completed', { correlationId, operation: 'redis_del', key });
        } catch (error) {
            logWarning('Redis DEL failed (non-critical)', {
                correlationId,
                operation: 'redis_del',
                key,
                error: (error as Error).message
            });
        }
    }

    // Cache with automatic fallback to callback function
    async getOrSet<T>(
        key: string,
        fallbackFn: () => Promise<T>,
        ttlSeconds: number,
        correlationId: string
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get<T>(key, correlationId);
        if (cached !== null) {
            return cached;
        }

        // Cache miss - execute fallback function
        logInfo('Cache miss, executing fallback', { correlationId, operation: 'cache_fallback', key });
        const result = await fallbackFn();

        // Store in cache for next time (fire and forget)
        this.set(key, result, ttlSeconds, correlationId).catch(() => {
            // Ignore cache set failures
        });

        return result;
    }
}

export const redisService = new RedisService();