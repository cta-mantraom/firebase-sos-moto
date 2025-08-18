import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { z } from 'zod';
import { logInfo, logError } from '../lib/utils/logger.js';
// CORRETO: Import centralized schema from domain layer (Serverless rule: no duplicate schemas)
import { CreatePaymentSchema, type CreatePaymentData } from '../lib/utils/validation.js';
import { MercadoPagoPreferenceResponseSchema } from '../lib/types/api.types.js';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
  } catch (error) {
    logError('Error initializing Firebase Admin', error as Error);
  }
}

// Plan configuration
const PLAN_PRICES = {
  basic: { 
    title: "SOS Moto Guardian - Plano Básico", 
    unit_price: 55.0,
    description: "Plano básico de proteção para motociclistas"
  },
  premium: { 
    title: "SOS Moto Guardian - Plano Premium", 
    unit_price: 85.0,
    description: "Plano premium com recursos avançados"
  }
} as const;

/**
 * Create Payment Endpoint
 * 
 * Responsibilities:
 * - Validate input data
 * - Create MercadoPago preference
 * - Save pending profile to Firestore
 * - Return preference ID and checkout URL
 * 
 * Note: Payment processing is handled by webhook and processors
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = crypto.randomUUID();
  const idempotencyKey = crypto.randomUUID(); // Required by MercadoPago
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type, x-device-id');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      correlationId 
    });
  }

  try {
    logInfo('Create payment started', { 
      correlationId,
      method: req.method,
      userAgent: req.headers['user-agent'],
    });

    // Validate input data
    const validationResult = CreatePaymentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logError('Validation failed', new Error('Invalid input data'), {
        correlationId,
        errors: validationResult.error.errors,
      });
      
      return res.status(400).json({
        error: 'Invalid data provided',
        details: validationResult.error.errors,
        correlationId,
      });
    }

    const validatedData = validationResult.data;
    const plan = PLAN_PRICES[validatedData.selectedPlan];
    const uniqueUrl = generateUniqueUrl();
    
    logInfo('Creating MercadoPago preference', {
      correlationId,
      uniqueUrl,
      plan: validatedData.selectedPlan,
      amount: plan.unit_price,
    });

    // Create MercadoPago preference with required headers
    const preferenceData = buildPreferenceData(validatedData, plan, uniqueUrl);
    const preference = await createMercadoPagoPreference(
      preferenceData, 
      idempotencyKey,
      correlationId
    );

    // Save pending profile to Firestore
    await savePendingProfile(
      uniqueUrl,
      validatedData,
      plan,
      preference.id,
      correlationId
    );

    logInfo('Payment preference created successfully', {
      correlationId,
      preferenceId: preference.id,
      uniqueUrl,
    });

    return res.status(200).json({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point || preference.sandbox_init_point,
      uniqueUrl,
      correlationId,
      status: 'pending',
    });

  } catch (error) {
    logError('Payment creation failed', error as Error, { correlationId });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid data provided',
        details: error.errors,
        correlationId,
      });
    }

    return res.status(500).json({
      error: 'Failed to create payment',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      correlationId,
    });
  }
}

/**
 * Generate unique URL for profile
 */
function generateUniqueUrl(): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).slice(2, 11);
  return `${timestamp}_${randomString}`;
}

/**
 * Build MercadoPago preference data
 */
function buildPreferenceData(
  data: CreatePaymentData,
  plan: typeof PLAN_PRICES[keyof typeof PLAN_PRICES],
  uniqueUrl: string
) {
  // Extract phone parts for MercadoPago format
  const phoneAreaCode = data.phone.slice(0, 2);
  const phoneNumber = data.phone.slice(2);

  return {
    items: [{
      id: data.selectedPlan,
      title: plan.title,
      description: plan.description,
      quantity: 1,
      unit_price: plan.unit_price,
      currency_id: 'BRL',
    }],
    payer: {
      name: data.name,
      surname: data.surname,
      email: data.email,
      phone: { 
        area_code: phoneAreaCode,
        number: phoneNumber 
      },
      identification: {
        type: 'CPF',
        number: data.cpf,
      },
    },
    back_urls: {
      success: `${process.env.FRONTEND_URL}/success?id=${uniqueUrl}`,
      failure: `${process.env.FRONTEND_URL}/failure?id=${uniqueUrl}`,
      pending: `${process.env.FRONTEND_URL}/pending?id=${uniqueUrl}`,
    },
    auto_return: 'approved',
    external_reference: uniqueUrl,
    notification_url: `${process.env.BACKEND_URL || process.env.FRONTEND_URL}/api/mercadopago-webhook`,
    statement_descriptor: 'SOS MOTO',
    binary_mode: false, // Allow pending status for PIX
    expires: true,
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    // Additional info for better approval rates
    additional_info: {
      items: [{
        id: data.selectedPlan,
        title: plan.title,
        description: plan.description,
        quantity: 1,
        unit_price: plan.unit_price,
      }],
      payer: {
        first_name: data.name,
        last_name: data.surname,
        phone: {
          area_code: phoneAreaCode,
          number: phoneNumber,
        },
      },
    },
    metadata: {
      correlation_id: uniqueUrl,
      plan_type: data.selectedPlan,
      device_id: data.deviceId,
    },
  };
}

/**
 * Create preference in MercadoPago
 */
async function createMercadoPagoPreference(
  preferenceData: ReturnType<typeof buildPreferenceData>,
  idempotencyKey: string,
  correlationId: string
): Promise<z.infer<typeof MercadoPagoPreferenceResponseSchema>> {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey, // Required header for MercadoPago
    },
    body: JSON.stringify(preferenceData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logError('MercadoPago API error', new Error(errorText), {
      correlationId,
      status: response.status,
      statusText: response.statusText,
    });
    
    throw new Error(`MercadoPago API error: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  
  // Validate MercadoPago response
  const validationResult = MercadoPagoPreferenceResponseSchema.safeParse(responseData);
  
  if (!validationResult.success) {
    logError('Invalid MercadoPago response', new Error('Response validation failed'), {
      correlationId,
      errors: validationResult.error.errors,
    });
    
    throw new Error('Invalid response from MercadoPago');
  }

  return validationResult.data;
}

/**
 * Save pending profile to Firestore
 */
async function savePendingProfile(
  uniqueUrl: string,
  data: CreatePaymentData,
  plan: typeof PLAN_PRICES[keyof typeof PLAN_PRICES],
  preferenceId: string,
  correlationId: string
): Promise<void> {
  const db = getFirestore();
  
  const pendingProfile = {
    // Personal data
    uniqueUrl,
    name: data.name,
    surname: data.surname,
    email: data.email,
    phone: data.phone,
    cpf: data.cpf,
    birthDate: data.birthDate,
    age: data.age,
    
    // Medical data
    bloodType: data.bloodType || null,
    allergies: data.allergies,
    medications: data.medications,
    medicalConditions: data.medicalConditions,
    healthPlan: data.healthPlan || null,
    preferredHospital: data.preferredHospital || null,
    medicalNotes: data.medicalNotes || null,
    
    // Emergency contacts
    emergencyContacts: data.emergencyContacts,
    
    // Plan and payment data
    selectedPlan: data.selectedPlan,
    planPrice: plan.unit_price,
    preferenceId,
    
    // Metadata
    correlationId,
    status: 'pending',
    deviceId: data.deviceId || null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  await db.collection('pending_profiles').doc(uniqueUrl).set(pendingProfile);
  
  logInfo('Pending profile saved', {
    correlationId,
    uniqueUrl,
    preferenceId,
  });
}