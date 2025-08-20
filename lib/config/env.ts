import { z } from 'zod';

// Verificação do ambiente para validação condicional
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// ✅ COMPLIANT - Environment variable validation with Zod schemas
const envSchema = z.object({
  // ✅ REQUIRED - Firebase configuration
  FIREBASE_PROJECT_ID: z.string().min(1),
  
  // ✅ OPTIONAL - Firebase Functions URL (not currently used in Vercel Functions architecture)
  FIREBASE_FUNCTIONS_URL: z.string().url().optional(),

  // ✅ OPTIONAL - Available in Vercel but not mandatory
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),

  // ✅ COMPLIANT - MercadoPago credentials for Node.js environment
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
  MERCADOPAGO_PUBLIC_KEY: z.string().min(1).optional(),

  // Note: Firebase Admin SDK uses Application Default Credentials
  // AWS SES credentials are configured in Firebase Functions
});

// Validação das variáveis de ambiente
const validatedEnv = envSchema.parse(process.env);

// ✅ COMPLIANT - Export validated environment variables
export const env = {
  FIREBASE_PROJECT_ID: validatedEnv.FIREBASE_PROJECT_ID,
  FIREBASE_FUNCTIONS_URL: validatedEnv.FIREBASE_FUNCTIONS_URL || '',
  UPSTASH_REDIS_REST_URL: validatedEnv.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: validatedEnv.UPSTASH_REDIS_REST_TOKEN,
  FRONTEND_URL: validatedEnv.FRONTEND_URL || 'https://memoryys.com',
  NODE_ENV: validatedEnv.NODE_ENV || 'production',
  // ✅ COMPLIANT - MercadoPago credentials (when available)
  MERCADOPAGO_ACCESS_TOKEN: validatedEnv.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_WEBHOOK_SECRET: validatedEnv.MERCADOPAGO_WEBHOOK_SECRET,
  MERCADOPAGO_PUBLIC_KEY: validatedEnv.MERCADOPAGO_PUBLIC_KEY
};

// Export da configuração estruturada APENAS para Vercel
export const config = {
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    functionsUrl: env.FIREBASE_FUNCTIONS_URL || ''
  },
  redis: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  },
  app: {
    frontendUrl: env.FRONTEND_URL,
    environment: env.NODE_ENV
  }
};

// Export default para compatibilidade
export default env;
