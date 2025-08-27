import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { MercadoPagoService } from "../lib/services/payment/mercadopago.service.js";
import { logInfo, logError, logWarning } from "../lib/utils/logger.js";
import { generateUniqueUrl, generatePaymentId, generateCorrelationId } from "../lib/utils/ids.js";
import { getPaymentConfig, getAppConfig } from "../lib/config/index.js";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirebaseConfig } from "../lib/config/index.js";

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
    logInfo("Firebase Admin initialized successfully");
  } catch (error) {
    logError("Error initializing Firebase Admin", error as Error);
  }
}

// Simplified validation schema - REQUIRED fields only
const CreatePaymentSchema = z.object({
  // Personal data - REQUIRED
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido").max(20, "Telefone muito longo"),
  
  // Medical data - REQUIRED
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: "Tipo sanguíneo obrigatório" })
  }),
  
  // Emergency contacts - REQUIRED (minimum 1)
  emergencyContacts: z.array(z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(10).max(20),
    relationship: z.string().optional(),
  })).min(1, "Pelo menos um contato de emergência é obrigatório"),
  
  // Plan selection - REQUIRED
  selectedPlan: z.enum(['basic', 'premium']),
  
  // Device ID - CRITICAL for approval rate (85%+ goal)
  // Optional in schema but will be validated separately for better error messages
  deviceId: z.string().optional(),
  
  // Optional fields
  surname: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.number().positive().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
});

type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;

// Plan configuration with Memoryys branding
const PLAN_PRICES = {
  basic: {
    title: "Memoryys Guardian - Plano Básico",
    unit_price: 5.0, // Temporary test value (production: 55.0)
    description: "Proteção básica para emergências médicas",
  },
  premium: {
    title: "Memoryys Guardian - Plano Premium",
    unit_price: 85.0,
    description: "Proteção premium com recursos avançados",
  },
} as const;

/**
 * Create Payment Endpoint - Memoryys
 * 
 * Critical responsibilities:
 * 1. Validate required data (name, email, phone, bloodType, emergencyContacts, deviceId)
 * 2. Create MercadoPago preference with Device ID
 * 3. Save pending profile to Firestore
 * 4. Return preference for polling (DO NOT redirect immediately)
 * 
 * @param req - Vercel request with payment data
 * @param res - Vercel response
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = generateCorrelationId();
  const idempotencyKey = generatePaymentId();

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
      hasDeviceId: !!req.body.deviceId,
    });

    // Critical: Validate Device ID presence
    if (!req.body.deviceId) {
      logError("Missing Device ID", new Error("Device ID not provided"), {
        correlationId,
      });
      
      return res.status(400).json({
        error: "Device ID é obrigatório para processamento do pagamento",
        code: "MISSING_DEVICE_ID",
        correlationId,
      });
    }

    // Validate input data
    const validationResult = CreatePaymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      logError("Validation failed", new Error("Invalid input data"), {
        correlationId,
        errors: validationResult.error.errors,
      });

      return res.status(400).json({
        error: "Dados inválidos",
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        correlationId,
      });
    }

    const validatedData = validationResult.data;
    
    // CRITICAL: Device ID is MANDATORY for 85%+ approval rate
    // Without Device ID: ~40% approval | With Device ID: 85%+ approval
    if (!validatedData.deviceId || validatedData.deviceId.length < 20) {
      logError("🚨 CRITICAL: Missing Device ID - Payment will likely fail", new Error("Device ID validation failed"), {
        correlationId,
        deviceIdLength: validatedData.deviceId?.length || 0,
        expectedApprovalRate: "~40% (very low)",
        requiredApprovalRate: "85%+",
      });
      
      // CRITICAL: Reject payments without Device ID to protect approval rate
      return res.status(400).json({
        error: "Device ID obrigatório para segurança",
        details: [{
          field: "deviceId",
          message: "Sistema de segurança não carregado. Por favor, recarregue a página e aguarde o carregamento completo antes de prosseguir."
        }],
        correlationId,
        retryable: true,
        impact: "Taxa de aprovação será severamente impactada sem Device ID",
      });
    }
    
    // Log successful Device ID validation
    logInfo("✅ Device ID validated successfully", {
      correlationId,
      deviceIdLength: validatedData.deviceId.length,
      expectedApprovalRate: "85%+",
    });
    
    const plan = PLAN_PRICES[validatedData.selectedPlan];
    const uniqueUrl = generateUniqueUrl();
    const paymentId = generatePaymentId();

    logInfo("💳 Creating MercadoPago preference WITH Device ID for optimal approval", {
      correlationId,
      uniqueUrl,
      paymentId,
      plan: validatedData.selectedPlan,
      amount: plan.unit_price,
      deviceId: validatedData.deviceId.substring(0, 10) + "...", // Log only part for security
      deviceIdPresent: true,
      expectedApprovalRate: "85%+",
      bloodType: validatedData.bloodType,
      emergencyContactsCount: validatedData.emergencyContacts.length,
    });

    // Initialize MercadoPago service with lazy-loaded config
    const paymentConfig = getPaymentConfig();
    const mercadoPagoService = new MercadoPagoService({
      accessToken: paymentConfig.accessToken,
      webhookSecret: paymentConfig.webhookSecret,
      publicKey: paymentConfig.publicKey,
    });

    // Build preference data with required fields
    const preferenceData = buildPreferenceData(
      validatedData, 
      plan, 
      uniqueUrl,
      paymentId,
      correlationId
    );

    // Create preference
    // Note: idempotency is handled internally by MercadoPago using external_reference
    const preference = await mercadoPagoService.createPreference(preferenceData);

    // Save pending profile to Firestore
    await savePendingProfile(
      uniqueUrl,
      paymentId,
      validatedData,
      plan,
      preference.id,
      correlationId
    );

    logInfo("Payment preference created successfully", {
      correlationId,
      preferenceId: preference.id,
      uniqueUrl,
      paymentId,
      checkoutUrl: preference.init_point || preference.sandbox_init_point,
    });

    // Return data for frontend polling
    // IMPORTANT: Frontend should NOT redirect immediately
    return res.status(200).json({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point || preference.sandbox_init_point,
      uniqueUrl,
      paymentId,
      correlationId,
      status: "pending",
      polling: {
        enabled: true,
        interval: 3000, // Poll every 3 seconds
        maxAttempts: 40, // Max 2 minutes
        endpoint: `/api/check-status?paymentId=${paymentId}`,
      },
      message: "Aguarde a aprovação do pagamento antes de redirecionar",
    });
  } catch (error) {
    logError("Payment creation failed", error as Error, { 
      correlationId,
      deviceId: req.body?.deviceId,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        correlationId,
      });
    }

    // Check if it's a MercadoPago error
    interface MercadoPagoError extends Error {
      response?: {
        data?: {
          message?: string;
        };
      };
    }
    const mercadoPagoError = error as MercadoPagoError;
    const errorMessage = mercadoPagoError.response?.data?.message || mercadoPagoError.message;
    
    return res.status(500).json({
      error: "Falha ao criar pagamento",
      message: getAppConfig().isDevelopment ? errorMessage : "Erro interno",
      correlationId,
      support: "contact@memoryys.com",
    });
  }
}

/**
 * Build MercadoPago preference data with all required fields
 */
function buildPreferenceData(
  data: CreatePaymentData,
  plan: (typeof PLAN_PRICES)[keyof typeof PLAN_PRICES],
  uniqueUrl: string,
  paymentId: string,
  correlationId: string
) {
  const appConfig = getAppConfig();
  const baseUrl = appConfig.frontendUrl;
  const backendUrl = appConfig.backendUrl;

  // Validate URLs format
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    throw new Error(`Invalid FRONTEND_URL format: ${baseUrl}`);
  }

  // Extract phone parts for MercadoPago format
  const phoneDigits = data.phone.replace(/\D/g, '');
  const phoneAreaCode = phoneDigits.slice(0, 2);
  const phoneNumber = phoneDigits.slice(2);

  return {
    items: [
      {
        id: `memoryys-${data.selectedPlan}`,
        title: plan.title,
        description: plan.description,
        quantity: 1,
        unit_price: plan.unit_price,
        currency_id: "BRL",
        category_id: "services",
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
      identification: {
        type: "CPF", // Tipo de documento padrão para Brasil
        number: "00000000000", // CPF dummy para preferência (será sobrescrito no Payment Brick)
      },
    },
    back_urls: {
      success: `${baseUrl}/success?id=${uniqueUrl}&paymentId=${paymentId}`,
      failure: `${baseUrl}/failure?id=${uniqueUrl}&paymentId=${paymentId}`,
      pending: `${baseUrl}/pending?id=${uniqueUrl}&paymentId=${paymentId}`,
    },
    auto_return: "approved" as const,
    external_reference: paymentId,
    notification_url: `${backendUrl}/api/mercadopago-webhook`,
    statement_descriptor: "MEMORYYS",
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [
        { id: "ticket" }, // Exclude boleto for faster processing
      ],
      installments: 12,
      default_installments: 1,
      // Configurações adicionais para habilitar PIX
      default_payment_method_id: "pix", // PIX como padrão se disponível
    },
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    additional_info: {
      items: [
        {
          id: `memoryys-profile-${data.selectedPlan}`,
          title: "Perfil Médico Memoryys",
          description: `Criação de perfil médico de emergência - ${data.selectedPlan}`,
          category_id: "services",
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
      shipments: {
        receiver_address: {
          street_name: "Digital",
          street_number: 1,
          zip_code: "00000000",
        },
      },
    },
    metadata: {
      correlation_id: correlationId,
      payment_id: paymentId,
      unique_url: uniqueUrl,
      plan_type: data.selectedPlan,
      device_id: data.deviceId || '', // CRITICAL: Device ID for 85%+ approval rate (vs ~40% without)
      blood_type: data.bloodType,
      emergency_contacts_count: data.emergencyContacts.length,
      has_allergies: !!data.allergies?.length,
      has_medications: !!data.medications?.length,
      medical_emergency: true,
      service_type: "medical_profile",
      platform: "memoryys",
      test_mode: process.env.NODE_ENV !== "production", // Indica se é ambiente de teste
    },
    // Configurações para PIX
    binary_mode: false, // Permite status pendente para PIX
    purpose: "wallet_purchase", // Melhora a taxa de aprovação
  };
}

/**
 * Save pending profile to Firestore
 */
async function savePendingProfile(
  uniqueUrl: string,
  paymentId: string,
  data: CreatePaymentData,
  plan: (typeof PLAN_PRICES)[keyof typeof PLAN_PRICES],
  preferenceId: string,
  correlationId: string
) {
  try {
    const db = getFirestore();
    
    // Prepare profile data with required and optional fields
    const profileData = {
      // Identifiers
      uniqueUrl,
      paymentId,
      preferenceId,
      correlationId,
      
      // Status
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      
      // Personal data - REQUIRED
      personalData: {
        name: data.name,
        surname: data.surname || "",
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate || null,
        age: data.age || null,
      },
      
      // Medical data - REQUIRED
      medicalData: {
        bloodType: data.bloodType,
        allergies: data.allergies || [],
        medications: data.medications || [],
        medicalConditions: data.medicalConditions || [],
        healthPlan: data.healthPlan || null,
        preferredHospital: data.preferredHospital || null,
        medicalNotes: data.medicalNotes || null,
      },
      
      // Emergency contacts - REQUIRED
      emergencyContacts: data.emergencyContacts.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship || "Não especificado",
      })),
      
      // Plan data
      planType: data.selectedPlan,
      planPrice: plan.unit_price,
      
      // Critical tracking
      deviceId: data.deviceId,
      
      // Metadata
      metadata: {
        source: "web",
        version: "2.0",
        platform: "memoryys",
      },
    };

    // Save to pending_profiles collection
    await db
      .collection("pending_profiles")
      .doc(uniqueUrl)
      .set(profileData);

    logInfo("Pending profile saved", {
      correlationId,
      uniqueUrl,
      paymentId,
      bloodType: data.bloodType,
      emergencyContactsCount: data.emergencyContacts.length,
    });
  } catch (error) {
    logError("Failed to save pending profile", error as Error, {
      correlationId,
      uniqueUrl,
      paymentId,
    });
    
    // Don't throw - continue with payment creation
    // Profile will be created from webhook if this fails
  }
}