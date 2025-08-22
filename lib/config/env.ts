import { z } from 'zod';

// Verificação do ambiente para validação condicional
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// ✅ COMPLIANT - Environment variable validation with Zod schemas
const envSchema = z.object({
  // 🔥 Firebase Admin SDK Configuration (Backend)
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),

  // 💳 MercadoPago Configuration
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
  MERCADOPAGO_PUBLIC_KEY: z.string().min(1).optional(),
  VITE_MERCADOPAGO_PUBLIC_KEY: z.string().min(1).optional(), // Frontend public key

  // 📧 AWS SES Email Configuration
  AWS_SES_REGION: z.string().optional(),
  AWS_SES_ACCESS_KEY_ID: z.string().optional(),
  AWS_SES_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SES_FROM_EMAIL: z.string().email().optional(),
  AWS_SES_REPLY_TO: z.string().email().optional(),
  SES_FROM_EMAIL: z.string().email().optional(), // Legacy alias
  SES_CONFIGURATION_SET: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(), // Legacy alias

  // 🗂️ Redis/Upstash Configuration
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // 🌍 Application URLs
  FRONTEND_URL: z.string().url().optional(),
  BACKEND_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // ⚙️ Environment & System
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  VERCEL: z.string().optional(),

  // 🔥 Frontend Firebase Configuration (Vite)
  // Note: These are handled by Vite and not needed in backend config
  // Listed here for completeness but not used in server-side code
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
});

// Validação das variáveis de ambiente
const validatedEnv = envSchema.parse(process.env);

// ✅ COMPLIANT - Export validated environment variables
export const env = {
  // 🔥 Firebase Admin SDK
  FIREBASE_PROJECT_ID: validatedEnv.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: validatedEnv.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: validatedEnv.FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET: validatedEnv.FIREBASE_STORAGE_BUCKET || `${validatedEnv.FIREBASE_PROJECT_ID}.appspot.com`,

  // 💳 MercadoPago
  MERCADOPAGO_ACCESS_TOKEN: validatedEnv.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_WEBHOOK_SECRET: validatedEnv.MERCADOPAGO_WEBHOOK_SECRET,
  MERCADOPAGO_PUBLIC_KEY: validatedEnv.MERCADOPAGO_PUBLIC_KEY || validatedEnv.VITE_MERCADOPAGO_PUBLIC_KEY,
  VITE_MERCADOPAGO_PUBLIC_KEY: validatedEnv.VITE_MERCADOPAGO_PUBLIC_KEY || validatedEnv.MERCADOPAGO_PUBLIC_KEY,

  // 📧 AWS SES Email (with fallbacks for legacy names)
  AWS_SES_REGION: validatedEnv.AWS_SES_REGION || 'us-east-1',
  AWS_SES_ACCESS_KEY_ID: validatedEnv.AWS_SES_ACCESS_KEY_ID,
  AWS_SES_SECRET_ACCESS_KEY: validatedEnv.AWS_SES_SECRET_ACCESS_KEY,
  AWS_SES_FROM_EMAIL: validatedEnv.AWS_SES_FROM_EMAIL || validatedEnv.SES_FROM_EMAIL || validatedEnv.EMAIL_FROM || 'noreply@memoryys.com',
  AWS_SES_REPLY_TO: validatedEnv.AWS_SES_REPLY_TO || validatedEnv.AWS_SES_FROM_EMAIL || 'suporte@memoryys.com',
  SES_CONFIGURATION_SET: validatedEnv.SES_CONFIGURATION_SET,

  // 🗂️ Redis/Upstash
  UPSTASH_REDIS_REST_URL: validatedEnv.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: validatedEnv.UPSTASH_REDIS_REST_TOKEN,

  // 🌍 Application URLs
  FRONTEND_URL: validatedEnv.FRONTEND_URL || 'https://memoryys.com',
  BACKEND_URL: validatedEnv.BACKEND_URL || (isVercel ? 'https://memoryys.com' : 'http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: validatedEnv.NEXT_PUBLIC_APP_URL || validatedEnv.FRONTEND_URL || 'https://memoryys.com',

  // ⚙️ Environment & System
  NODE_ENV: validatedEnv.NODE_ENV || 'production',
  VERCEL: validatedEnv.VERCEL,
  IS_PRODUCTION: isProduction,
  IS_VERCEL: isVercel,
};

// Export da configuração estruturada por domínio
export const config = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID, // Fix for Vercel PropertyAccessExpression
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY,
    storageBucket: env.FIREBASE_STORAGE_BUCKET
  },
  mercadopago: {
    accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
    webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET,
    publicKey: env.MERCADOPAGO_PUBLIC_KEY
  },
  email: {
    aws: {
      region: env.AWS_SES_REGION,
      accessKeyId: env.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SES_SECRET_ACCESS_KEY,
      fromEmail: env.AWS_SES_FROM_EMAIL,
      replyTo: env.AWS_SES_REPLY_TO,
      configurationSet: env.SES_CONFIGURATION_SET
    }
  },
  redis: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  },
  app: {
    frontendUrl: env.FRONTEND_URL,
    backendUrl: env.BACKEND_URL,
    publicUrl: env.NEXT_PUBLIC_APP_URL,
    environment: env.NODE_ENV,
    isProduction: env.IS_PRODUCTION,
    isVercel: env.IS_VERCEL
  }
};

// Export default para compatibilidade
export default env;
