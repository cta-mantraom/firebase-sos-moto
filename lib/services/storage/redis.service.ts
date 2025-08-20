import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { logInfo, logError, logWarning } from '../../utils/logger.js';

// Schemas de validação
const CacheEntrySchema = z.object({
  data: z.unknown(),
  timestamp: z.number(),
  ttl: z.number().optional(),
  version: z.string().optional(),
});

const CacheOptionsSchema = z.object({
  ttl: z.number().positive().optional(),
  version: z.string().optional(),
  compress: z.boolean().optional(),
});

// Tipos derivados
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CacheOptions = z.infer<typeof CacheOptionsSchema>;

export interface RedisServiceConfig {
  url: string;
  token: string;
  defaultTTL: number;
  maxRetries: number;
  enableCompression: boolean;
  keyPrefix: string;
}

export interface RedisError extends Error {
  code?: string;
  statusCode?: number;
}

export class RedisService {
  private readonly client: Redis;
  private readonly config: RedisServiceConfig;
  private readonly localCache: Map<string, CacheEntry>;

  constructor(config?: Partial<RedisServiceConfig>) {
    this.config = {
      url: config?.url ?? process.env.UPSTASH_REDIS_REST_URL!,
      token: config?.token ?? process.env.UPSTASH_REDIS_REST_TOKEN!,
      defaultTTL: config?.defaultTTL ?? 3600, // 1 hour
      maxRetries: config?.maxRetries ?? 3,
      enableCompression: config?.enableCompression ?? false,
      keyPrefix: config?.keyPrefix ?? 'sosmoto:',
    };

    this.client = new Redis({
      url: this.config.url,
      token: this.config.token,
    });

    // Local cache para fallback
    this.localCache = new Map();
  }

  /**
   * Busca um valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      // Tentar buscar do Redis
      const cached = await this.client.get(prefixedKey);
      
      if (!cached) {
        // Tentar fallback local
        const localCached = this.getFromLocalCache<T>(prefixedKey);
        if (localCached) {
          logInfo('Cache hit (local fallback)', { key: prefixedKey });
          return localCached;
        }
        
        logInfo('Cache miss', { key: prefixedKey });
        return null;
      }

      // Validar e retornar dados
      const entry = CacheEntrySchema.parse(cached);
      
      // Verificar expiração
      if (this.isExpired(entry)) {
        await this.delete(key);
        logInfo('Cache expired', { key: prefixedKey });
        return null;
      }

      logInfo('Cache hit', { key: prefixedKey });
      return entry.data as T;
    } catch (error) {
      this.handleRedisError(error as RedisError, 'get', key);
      
      // Tentar fallback local em caso de erro
      const localCached = this.getFromLocalCache<T>(prefixedKey);
      if (localCached) {
        logWarning('Using local cache due to Redis error', { key: prefixedKey });
        return localCached;
      }
      
      return null;
    }
  }

  /**
   * Armazena um valor no cache
   */
  async set<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    const ttlSeconds = ttl ?? this.config.defaultTTL;
    
    try {
      const entry: CacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds,
      };

      // Armazenar no Redis
      await this.client.set(prefixedKey, entry, {
        ex: ttlSeconds,
      });

      // Armazenar localmente como fallback
      this.setLocalCache(prefixedKey, entry);

      logInfo('Cache set', {
        key: prefixedKey,
        ttl: ttlSeconds,
      });
    } catch (error) {
      this.handleRedisError(error as RedisError, 'set', key);
      
      // Mesmo com erro, armazenar localmente
      const entry: CacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds,
      };
      this.setLocalCache(prefixedKey, entry);
    }
  }

  /**
   * Busca ou define um valor no cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      // Tentar buscar do cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Gerar novo valor
      const value = await factory();
      
      // Armazenar no cache
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      logError('Error in getOrSet', error as Error, { key });
      
      // Em caso de erro, ainda tentar gerar o valor
      return await factory();
    }
  }

  /**
   * Invalida entradas do cache por padrão
   */
  async invalidate(pattern: string): Promise<void> {
    const prefixedPattern = this.getPrefixedKey(pattern);
    
    try {
      // Buscar todas as chaves que correspondem ao padrão
      const keys = await this.client.keys(prefixedPattern + '*');
      
      if (keys.length === 0) {
        logInfo('No keys to invalidate', { pattern: prefixedPattern });
        return;
      }

      // Deletar todas as chaves encontradas
      await Promise.all(keys.map(key => this.client.del(key)));
      
      // Limpar cache local também
      for (const [localKey] of this.localCache) {
        if (localKey.startsWith(prefixedPattern)) {
          this.localCache.delete(localKey);
        }
      }

      logInfo('Cache invalidated', {
        pattern: prefixedPattern,
        keysDeleted: keys.length,
      });
    } catch (error) {
      this.handleRedisError(error as RedisError, 'invalidate', pattern);
    }
  }

  /**
   * Deleta uma entrada específica do cache
   */
  async delete(key: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      await this.client.del(prefixedKey);
      this.localCache.delete(prefixedKey);
      
      logInfo('Cache deleted', { key: prefixedKey });
    } catch (error) {
      this.handleRedisError(error as RedisError, 'delete', key);
      
      // Mesmo com erro, remover do cache local
      this.localCache.delete(prefixedKey);
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async exists(key: string): Promise<boolean> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const exists = await this.client.exists(prefixedKey);
      return exists === 1;
    } catch (error) {
      this.handleRedisError(error as RedisError, 'exists', key);
      
      // Verificar cache local como fallback
      return this.localCache.has(prefixedKey);
    }
  }

  /**
   * Define TTL para uma chave existente
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const result = await this.client.expire(prefixedKey, ttl);
      
      // Atualizar TTL no cache local
      const localEntry = this.localCache.get(prefixedKey);
      if (localEntry) {
        localEntry.ttl = ttl;
        localEntry.timestamp = Date.now();
      }
      
      return result === 1;
    } catch (error) {
      this.handleRedisError(error as RedisError, 'expire', key);
      return false;
    }
  }

  /**
   * Incrementa um contador
   */
  async incr(key: string, amount: number = 1): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const result = await this.client.incrby(prefixedKey, amount);
      
      logInfo('Counter incremented', {
        key: prefixedKey,
        amount,
        newValue: result,
      });
      
      return result;
    } catch (error) {
      this.handleRedisError(error as RedisError, 'incr', key);
      return 0;
    }
  }

  /**
   * Adiciona item a uma lista
   */
  async lpush<T>(key: string, ...values: T[]): Promise<number> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const result = await this.client.lpush(prefixedKey, ...values);
      
      logInfo('Items pushed to list', {
        key: prefixedKey,
        count: values.length,
        newLength: result,
      });
      
      return result;
    } catch (error) {
      this.handleRedisError(error as RedisError, 'lpush', key);
      return 0;
    }
  }

  /**
   * Busca itens de uma lista
   */
  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    const prefixedKey = this.getPrefixedKey(key);
    
    try {
      const result = await this.client.lrange(prefixedKey, start, stop);
      return result as T[];
    } catch (error) {
      this.handleRedisError(error as RedisError, 'lrange', key);
      return [];
    }
  }

  /**
   * Limpa todo o cache
   */
  async flush(): Promise<void> {
    try {
      const keys = await this.client.keys(this.config.keyPrefix + '*');
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.client.del(key)));
      }
      
      this.localCache.clear();
      
      logInfo('Cache flushed', {
        keysDeleted: keys.length,
      });
    } catch (error) {
      this.handleRedisError(error as RedisError, 'flush');
      
      // Mesmo com erro, limpar cache local
      this.localCache.clear();
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{
    redisKeys: number;
    localKeys: number;
    memoryUsage: number;
  }> {
    try {
      const keys = await this.client.keys(this.config.keyPrefix + '*');
      
      return {
        redisKeys: keys.length,
        localKeys: this.localCache.size,
        memoryUsage: this.estimateLocalCacheSize(),
      };
    } catch (error) {
      logError('Failed to get cache stats', error as Error);
      
      return {
        redisKeys: -1,
        localKeys: this.localCache.size,
        memoryUsage: this.estimateLocalCacheSize(),
      };
    }
  }

  /**
   * Adiciona prefixo à chave
   */
  private getPrefixedKey(key: string): string {
    if (key.startsWith(this.config.keyPrefix)) {
      return key;
    }
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Verifica se uma entrada expirou
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    
    const expirationTime = entry.timestamp + (entry.ttl * 1000);
    return Date.now() > expirationTime;
  }

  /**
   * Busca do cache local
   */
  private getFromLocalCache<T>(key: string): T | null {
    const entry = this.localCache.get(key);
    
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.localCache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Armazena no cache local
   */
  private setLocalCache(key: string, entry: CacheEntry): void {
    // Limitar tamanho do cache local (100 entradas)
    if (this.localCache.size >= 100) {
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) {
        this.localCache.delete(firstKey);
      }
    }
    
    this.localCache.set(key, entry);
  }

  /**
   * Estima o tamanho do cache local em bytes
   */
  private estimateLocalCacheSize(): number {
    let size = 0;
    
    for (const [key, value] of this.localCache) {
      size += key.length * 2; // Aproximação para strings UTF-16
      size += JSON.stringify(value).length * 2;
    }
    
    return size;
  }

  /**
   * Trata erros do Redis
   */
  private handleRedisError(
    error: RedisError,
    operation: string,
    key?: string
  ): void {
    const context = {
      operation,
      key,
      code: error.code,
      statusCode: error.statusCode,
    };

    // Não lançar erro para permitir fallback
    logError(`Redis ${operation} failed`, error, context);
  }

  /**
   * Limpa entradas expiradas do cache local
   */
  cleanupLocalCache(): number {
    let cleaned = 0;
    
    for (const [key, entry] of this.localCache) {
      if (this.isExpired(entry)) {
        this.localCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logInfo('Local cache cleaned', { entriesRemoved: cleaned });
    }
    
    return cleaned;
  }

  /**
   * Verifica conexão com Redis
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logError('Redis ping failed', error as Error);
      return false;
    }
  }
}