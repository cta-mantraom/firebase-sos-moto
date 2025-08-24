import { z } from 'zod';

/**
 * Redis/Upstash Configuration
 * Lazy-loaded singleton pattern for optimal performance
 */

const RedisConfigSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
});

export interface RedisConfigType {
  url?: string;
  token?: string;
  qstash: {
    url?: string;
    token?: string;
    currentSigningKey?: string;
    nextSigningKey?: string;
  };
}

class RedisConfig {
  private static instance: RedisConfigType | null = null;

  static get(): RedisConfigType {
    if (!this.instance) {
      const validated = RedisConfigSchema.parse(process.env);
      
      this.instance = {
        url: validated.UPSTASH_REDIS_REST_URL,
        token: validated.UPSTASH_REDIS_REST_TOKEN,
        qstash: {
          url: validated.QSTASH_URL,
          token: validated.QSTASH_TOKEN,
          currentSigningKey: validated.QSTASH_CURRENT_SIGNING_KEY,
          nextSigningKey: validated.QSTASH_NEXT_SIGNING_KEY,
        },
      };
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

/**
 * Get Redis/Upstash configuration
 * @returns Validated and typed Redis configuration
 */
export const getRedisConfig = (): RedisConfigType => RedisConfig.get();