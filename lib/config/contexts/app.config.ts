import { z } from 'zod';

/**
 * Application Configuration
 * Lazy-loaded singleton pattern for optimal performance
 */

const AppConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  FRONTEND_URL: z.string().url().default('https://memoryys.com'),
  BACKEND_URL: z.string().url().default('https://memoryys.com'),
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
});

export interface AppConfigType {
  frontendUrl: string;
  backendUrl: string;
  environment: 'development' | 'test' | 'production';
  isProduction: boolean;
  isDevelopment: boolean;
  vercel?: {
    url?: string;
    env?: 'production' | 'preview' | 'development';
  };
}

class AppConfig {
  private static instance: AppConfigType | null = null;

  static get(): AppConfigType {
    if (!this.instance) {
      const validated = AppConfigSchema.parse(process.env);
      
      // Clean URLs (remove trailing slashes and whitespace)
      const frontendUrl = validated.FRONTEND_URL.trim().replace(/\/$/, '');
      const backendUrl = validated.BACKEND_URL.trim().replace(/\/$/, '');
      
      this.instance = {
        frontendUrl,
        backendUrl,
        environment: validated.NODE_ENV,
        isProduction: validated.NODE_ENV === 'production',
        isDevelopment: validated.NODE_ENV === 'development',
        vercel: {
          url: validated.VERCEL_URL,
          env: validated.VERCEL_ENV,
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
 * Get Application configuration
 * @returns Validated and typed application configuration
 */
export const getAppConfig = (): AppConfigType => AppConfig.get();