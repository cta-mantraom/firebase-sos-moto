import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { z } from "zod";
import { getFirebaseConfig, getPaymentConfig, getAppConfig } from "../lib/config/index.js";
import { logInfo, logError } from "../lib/utils/logger.js";
// Import from domain validators
import { z } from "zod";

// Define CreatePaymentSchema locally since validation.ts was deleted
const CreatePaymentSchema = z.object({
  name: z.string().min(1),
  surname: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(10),
  birthDate: z.string().optional(),
  age: z.number().positive(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  })).optional(),
  selectedPlan: z.enum(['basic', 'premium']),
  deviceId: z.string().optional(),
});

type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;
import { MercadoPagoService } from "../lib/services/payment/mercadopago.service.js";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const firebaseConfig = getFirebaseConfig();
    initializeApp({
      credential: cert({
        projectId: firebaseConfig.projectId,
        clientEmail: firebaseConfig.clientEmail,
        privateKey: firebaseConfig.privateKey,
      }),
      storageBucket: firebaseConfig.storageBucket,
    });
  } catch (error) {
    logError("Error initializing Firebase Admin", error as Error);
  }
}

// Plan configuration
const PLAN_PRICES = {
  basic: {
    title: "Memoryys Guardian - Plano Básico",
    unit_price: 5.0,
    description: "Plano básico de proteção para motociclistas",
  },
  premium: {
    title: "Memoryys Guardian - Plano Premium",
    unit_price: 85.0,
    description: "Plano premium com recursos avançados",
  },
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type, x-device-id"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      correlationId,
    });
  }

  try {
    logInfo("Create payment started", {
      correlationId,
      method: req.method,
      userAgent: req.headers["user-agent"],
    });

    // Validate input data
    const validationResult = CreatePaymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      logError("Validation failed", new Error("Invalid input data"), {
        correlationId,
        errors: validationResult.error.errors,
      });

      return res.status(400).json({
        error: "Invalid data provided",
        details: validationResult.error.errors,
        correlationId,
      });
    }

    const validatedData = validationResult.data;
    const plan = PLAN_PRICES[validatedData.selectedPlan];
    const uniqueUrl = generateUniqueUrl();

    logInfo("Creating MercadoPago preference", {
      correlationId,
      uniqueUrl,
      plan: validatedData.selectedPlan,
      amount: plan.unit_price,
      frontendUrl: getAppConfig().frontendUrl,
      backendUrl: getAppConfig().backendUrl,
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

    logInfo("Payment preference created successfully", {
      correlationId,
      preferenceId: preference.id,
      uniqueUrl,
    });

    return res.status(200).json({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point || preference.sandbox_init_point,
      uniqueUrl,
      correlationId,
      status: "pending",
    });
  } catch (error) {
    logError("Payment creation failed", error as Error, { correlationId });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid data provided",
        details: error.errors,
        correlationId,
      });
    }

    return res.status(500).json({
      error: "Failed to create payment",
      message:
        getAppConfig().isDevelopment
          ? (error as Error).message
          : undefined,
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
  plan: (typeof PLAN_PRICES)[keyof typeof PLAN_PRICES],
  uniqueUrl: string
) {
  // Get URLs from app config (already trimmed and validated)
  const appConfig = getAppConfig();
  const baseUrl = appConfig.frontendUrl;
  const backendUrl = appConfig.backendUrl;

  // Validate URLs format
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    throw new Error(`Invalid FRONTEND_URL format: ${baseUrl}`);
  }

  // Extract phone parts for MercadoPago format
  const phoneAreaCode = data.phone.slice(0, 2);
  const phoneNumber = data.phone.slice(2);

  return {
    items: [
      {
        id: data.selectedPlan,
        title: plan.title,
        description: plan.description,
        quantity: 1,
        unit_price: plan.unit_price,
        currency_id: "BRL",
      },
    ],
    payer: {
      name: data.name,
      surname: data.surname || "",
      email: data.email,
      phone: {
        area_code: phoneAreaCode,
        number: phoneNumber,
      },
    },
    back_urls: {
      success: `${baseUrl}/success?id=${uniqueUrl}`,
      failure: `${baseUrl}/failure?id=${uniqueUrl}`,
      pending: `${baseUrl}/pending?id=${uniqueUrl}`,
    },
    auto_return: "approved" as const,
    external_reference: uniqueUrl,
    notification_url: `${backendUrl}/api/mercadopago-webhook`,
    statement_descriptor: "SOS MOTO",
    binary_mode: false, // Allow pending status for PIX
    expires: true,
    expiration_date_to: new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString(),
    // Additional info for better approval rates
    additional_info: {
      items: [
        {
          id: data.selectedPlan,
          title: plan.title,
          description: plan.description,
          quantity: 1,
          unit_price: plan.unit_price,
        },
      ],
      payer: {
        first_name: data.name,
        last_name: data.surname || "",
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
 * Create preference in MercadoPago using Service
 */
async function createMercadoPagoPreference(
  preferenceData: ReturnType<typeof buildPreferenceData>,
  idempotencyKey: string,
  correlationId: string
) {
  const paymentConfig = getPaymentConfig();
  const mercadoPagoService = new MercadoPagoService({
    accessToken: paymentConfig.accessToken,
    webhookSecret: paymentConfig.webhookSecret,
    publicKey: paymentConfig.publicKey,
  });

  try {
    const preference = await mercadoPagoService.createPreference(
      preferenceData
    );

    logInfo("MercadoPago preference created via service", {
      correlationId,
      preferenceId: preference.id,
      externalReference: preference.external_reference,
    });

    return preference;
  } catch (error) {
    logError("Failed to create preference via service", error as Error, {
      correlationId,
    });
    throw error;
  }
}

/**
 * Save pending profile to Firestore
 */
async function savePendingProfile(
  uniqueUrl: string,
  data: CreatePaymentData,
  plan: (typeof PLAN_PRICES)[keyof typeof PLAN_PRICES],
  preferenceId: string,
  correlationId: string
): Promise<void> {
  const db = getFirestore();

  const pendingProfile = {
    // Personal data
    uniqueUrl,
    name: data.name,
    surname: data.surname || null,
    email: data.email,
    phone: data.phone,
    birthDate: data.birthDate || null,
    age: data.age,

    // Medical data
    bloodType: data.bloodType || null,
    allergies: data.allergies || [],
    medications: data.medications || [],
    medicalConditions: data.medicalConditions || [],
    healthPlan: data.healthPlan || null,
    preferredHospital: data.preferredHospital || null,
    medicalNotes: data.medicalNotes || null,

    // Emergency contacts
    emergencyContacts: data.emergencyContacts || [],

    // Plan and payment data
    selectedPlan: data.selectedPlan,
    planPrice: plan.unit_price,
    preferenceId,

    // Metadata
    correlationId,
    status: "pending",
    deviceId: data.deviceId || null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  await db.collection("pending_profiles").doc(uniqueUrl).set(pendingProfile);

  logInfo("Pending profile saved", {
    correlationId,
    uniqueUrl,
    preferenceId,
  });
}
