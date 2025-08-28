import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { MercadoPagoService, type CreatePaymentData } from "../lib/services/payment/mercadopago.service.js";
import { getPaymentConfig, getAppConfig } from "../lib/config/index.js";
import { logInfo, logError, logWarning } from "../lib/utils/logger.js";
import { generateCorrelationId } from "../lib/utils/ids.js";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirebaseConfig } from "../lib/config/index.js";

// Type for pending profile data from Firestore
interface PendingProfileData {
  planType: "basic" | "premium";
  bloodType: string;
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  paymentStatus?: string;
  mercadoPagoPaymentId?: string | number;
  createdAt?: string;
}

// Type for MercadoPago API error response
interface MercadoPagoAPIError extends Error {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
}

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

// Schema for payment processing from Payment Brick
const ProcessPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"), // Our internal payment ID
  uniqueUrl: z.string().min(1, "Unique URL is required"),
  token: z.string().optional(), // Card token from Payment Brick (not needed for PIX)
  issuer_id: z.union([z.string(), z.number()]).optional(), // Can be string or number
  payment_method_id: z.string().min(1, "Payment method is required"),
  transaction_amount: z.number().positive(),
  installments: z.number().int().positive().optional().default(1),
  payer: z.object({
    email: z.string().email(),
    identification: z
      .object({
        type: z.string().optional(),
        number: z.string().optional(),
      })
      .optional(),
  }),
  metadata: z.record(z.unknown()).optional(),
  deviceId: z.string().optional(), // CRITICAL: Device ID for 85%+ approval rate
});

/**
 * Process Payment Endpoint
 *
 * This endpoint processes payments directly using MercadoPago SDK.
 * Called by Payment Brick's onSubmit after user enters payment details.
 *
 * CRITICAL: This solves the issue where we were creating preferences
 * but using Payment Brick which needs direct payment processing.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  // CORS headers for Payment Brick
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

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
    // Validate request body
    const validation = ProcessPaymentSchema.safeParse(req.body);

    if (!validation.success) {
      logWarning("Invalid payment data", {
        correlationId,
        errors: validation.error.errors,
      });
      return res.status(400).json({
        error: "Invalid payment data",
        details: validation.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
        correlationId,
      });
    }

    const data = validation.data;
    const hasDeviceId = !!data.deviceId;

    logInfo("Processing payment directly", {
      correlationId,
      paymentId: data.paymentId,
      uniqueUrl: data.uniqueUrl,
      paymentMethod: data.payment_method_id,
      amount: data.transaction_amount,
      hasDeviceId,
      deviceIdLength: data.deviceId?.length,
    });

    // Initialize MercadoPago service
    const paymentConfig = getPaymentConfig();
    const mercadoPagoService = new MercadoPagoService({
      accessToken: paymentConfig.accessToken,
      webhookSecret: paymentConfig.webhookSecret,
      publicKey: paymentConfig.publicKey,
    });

    // Get pending profile to verify it exists
    const db = getFirestore();
    const pendingProfileDoc = await db
      .collection("pending_profiles")
      .doc(data.uniqueUrl)
      .get();

    if (!pendingProfileDoc.exists) {
      logError("Pending profile not found", new Error("Profile not found"), {
        correlationId,
        uniqueUrl: data.uniqueUrl,
      });
      return res.status(404).json({
        error: "Profile not found",
        message: "Perfil de pagamento não encontrado",
        correlationId,
      });
    }

    const pendingProfile = pendingProfileDoc.data() as PendingProfileData;

    // Build payment data for MercadoPago SDK CreatePaymentData schema
    // PIX payments have different requirements than card payments
    const isPix = data.payment_method_id === "pix" || data.payment_method_id === "bank_transfer";
    
    const basePaymentData = {
      payment_method_id: isPix ? "pix" : data.payment_method_id,
      transaction_amount: data.transaction_amount,
      description: `Memoryys - Perfil de Emergência ${pendingProfile.planType}`,
      payer: {
        email: data.payer.email,
        identification: {
          type: data.payer.identification?.type || "CPF",
          number: data.payer.identification?.number || "00000000000",
        },
      },
      external_reference: data.paymentId,
      statement_descriptor: "MEMORYYS",
      notification_url: `${getAppConfig().backendUrl}/api/mercadopago-webhook`,
      metadata: {
        ...data.metadata,
        payment_id: data.paymentId,
        unique_url: data.uniqueUrl,
        plan_type: pendingProfile.planType,
        blood_type: pendingProfile.bloodType,
        has_device_id: hasDeviceId,
      },
      binary_mode: false, // Allow pending status for PIX
      capture: true, // Capture payment immediately
    };

    // Add card-specific fields only for card payments
    const paymentData: CreatePaymentData = isPix
      ? {
          ...basePaymentData,
          // PIX doesn't need token, issuer_id, or installments
          installments: 1,
          additional_info: {
            // PIX doesn't need device ID
            ip_address: (() => {
              const forwarded = req.headers["x-forwarded-for"];
              const realIp = req.headers["x-real-ip"];
              if (typeof forwarded === "string") return forwarded;
              if (Array.isArray(forwarded)) return forwarded[0];
              if (typeof realIp === "string") return realIp;
              if (Array.isArray(realIp)) return realIp[0];
              return undefined;
            })(),
            items: [
              {
                id: `memoryys-${pendingProfile.planType}`,
                title: `Perfil de Emergência ${pendingProfile.planType}`,
                description: "Acesso a informações médicas de emergência",
                category_id: "services",
                quantity: 1,
                unit_price: data.transaction_amount,
              },
            ],
            payer: {
              first_name: pendingProfile.name?.split(" ")[0] || "",
              last_name:
                pendingProfile.surname ||
                pendingProfile.name?.split(" ").slice(1).join(" ") ||
                "",
            },
          },
        }
      : {
          ...basePaymentData,
          // Card payments need these fields
          token: data.token,
          issuer_id: data.issuer_id
            ? typeof data.issuer_id === "string"
              ? parseInt(data.issuer_id, 10)
              : data.issuer_id
            : undefined,
          installments: data.installments || 1,
          additional_info: {
            // Device ID is critical for card payments (85%+ approval)
            device_session_id: data.deviceId,
            items: [
              {
                id: `memoryys-${pendingProfile.planType}`,
                title: `Perfil de Emergência ${pendingProfile.planType}`,
                description: "Acesso a informações médicas de emergência",
                category_id: "services",
                quantity: 1,
                unit_price: data.transaction_amount,
              },
            ],
            payer: {
              first_name: pendingProfile.name?.split(" ")[0] || "",
              last_name:
                pendingProfile.surname ||
                pendingProfile.name?.split(" ").slice(1).join(" ") ||
                "",
            },
            // Add IP address if available for fraud prevention
            ip_address: (() => {
              const forwarded = req.headers["x-forwarded-for"];
              const realIp = req.headers["x-real-ip"];
              if (typeof forwarded === "string") return forwarded;
              if (Array.isArray(forwarded)) return forwarded[0];
              if (typeof realIp === "string") return realIp;
              if (Array.isArray(realIp)) return realIp[0];
              return undefined;
            })(),
          },
        };

    // Log Device ID status for debugging
    if (hasDeviceId) {
      logInfo("✅ Processing payment WITH Device ID", {
        correlationId,
        expectedApprovalRate: "85%+",
        deviceIdLength: data.deviceId!.length,
      });
    } else {
      logWarning("⚠️ Processing payment WITHOUT Device ID", {
        correlationId,
        expectedApprovalRate: "~40%",
        warning: "Payment may be rejected due to missing Device ID",
      });
    }

    // Process payment using MercadoPago SDK - Device ID already in additional_info
    const paymentResponse = await mercadoPagoService.createPayment(paymentData);

    logInfo("Payment processed by MercadoPago", {
      correlationId,
      mercadoPagoId: paymentResponse.id,
      status: paymentResponse.status,
      statusDetail: paymentResponse.status_detail,
      paymentMethod: paymentResponse.payment_method_id,
    });

    // Update pending profile with MercadoPago payment ID
    await db.collection("pending_profiles").doc(data.uniqueUrl).update({
      mercadoPagoPaymentId: paymentResponse.id,
      paymentStatus: paymentResponse.status,
      paymentStatusDetail: paymentResponse.status_detail,
      lastUpdated: new Date().toISOString(),
    });

    // Handle PIX payments - save QR code data
    if (
      paymentResponse.payment_method_id === "pix" &&
      paymentResponse.point_of_interaction
    ) {
      const pixData = paymentResponse.point_of_interaction.transaction_data;

      if (pixData) {
        logInfo("PIX payment - saving QR code", {
          correlationId,
          hasQRCode: !!pixData.qr_code,
          hasBase64: !!pixData.qr_code_base64,
        });

        // Save PIX data for display
        await db
          .collection("pix_payments")
          .doc(data.paymentId)
          .set({
            paymentId: data.paymentId,
            mercadoPagoId: paymentResponse.id,
            qrCode: pixData.qr_code || "",
            qrCodeBase64: pixData.qr_code_base64 || "",
            ticketUrl: pixData.ticket_url || "",
            amount: data.transaction_amount,
            createdAt: new Date().toISOString(),
            expiresAt: paymentResponse.date_of_expiration || null,
          });

        // Return PIX QR code immediately
        return res.status(200).json({
          success: true,
          status: "pending_pix",
          mercadoPagoId: paymentResponse.id,
          pixData: {
            qrCode: pixData.qr_code,
            qrCodeBase64: pixData.qr_code_base64,
            ticketUrl: pixData.ticket_url,
            amount: data.transaction_amount,
            instructions: [
              "Abra o app do seu banco",
              "Procure a opção PIX",
              "Escaneie o QR Code ou copie o código",
              "Confirme o pagamento",
            ],
          },
          message: "QR Code PIX gerado com sucesso",
          correlationId,
          processingTime: Date.now() - startTime,
        });
      }
    }

    // Handle approved payments
    if (paymentResponse.status === "approved") {
      logInfo("Payment approved immediately", {
        correlationId,
        mercadoPagoId: paymentResponse.id,
      });

      return res.status(200).json({
        success: true,
        status: "approved",
        mercadoPagoId: paymentResponse.id,
        message: "Pagamento aprovado com sucesso!",
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    // Handle rejected payments
    if (paymentResponse.status === "rejected") {
      logWarning("Payment rejected", {
        correlationId,
        mercadoPagoId: paymentResponse.id,
        statusDetail: paymentResponse.status_detail,
        hasDeviceId,
      });

      return res.status(200).json({
        success: false,
        status: "rejected",
        mercadoPagoId: paymentResponse.id,
        message: getPaymentErrorMessage(paymentResponse.status_detail),
        statusDetail: paymentResponse.status_detail,
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    // Handle pending/in_process payments
    return res.status(200).json({
      success: true,
      status: paymentResponse.status,
      mercadoPagoId: paymentResponse.id,
      message: "Pagamento em processamento. Aguarde a confirmação.",
      correlationId,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    logError("Error processing payment", error as Error, {
      correlationId,
      deviceId: req.body?.deviceId ? "present" : "missing",
    });

    // Check if it's a MercadoPago API error
    const apiError = error as MercadoPagoAPIError;
    if (apiError.response?.data) {
      const errorMessage =
        apiError.response.data.message || apiError.response.data.error;
      const statusCode = apiError.response.status;

      logError("MercadoPago API error", new Error(errorMessage), {
        correlationId,
        statusCode,
        errorData: apiError.response.data,
      });

      return res.status(200).json({
        success: false,
        status: "error",
        message: getPaymentErrorMessage(errorMessage),
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    return res.status(500).json({
      error: "Failed to process payment",
      message: "Erro ao processar pagamento. Tente novamente.",
      correlationId,
      processingTime: Date.now() - startTime,
    });
  }
}

/**
 * Get user-friendly error message based on MercadoPago status detail
 */
function getPaymentErrorMessage(statusDetail?: string): string {
  const errorMessages: Record<string, string> = {
    cc_rejected_bad_filled_card_number:
      "Número do cartão inválido. Verifique e tente novamente.",
    cc_rejected_bad_filled_date:
      "Data de validade inválida. Verifique e tente novamente.",
    cc_rejected_bad_filled_security_code:
      "Código de segurança inválido. Verifique e tente novamente.",
    cc_rejected_blacklist:
      "Cartão não autorizado. Entre em contato com seu banco.",
    cc_rejected_call_for_authorize:
      "Pagamento requer autorização. Entre em contato com seu banco.",
    cc_rejected_card_disabled:
      "Cartão desabilitado. Entre em contato com seu banco.",
    cc_rejected_card_error:
      "Não foi possível processar o pagamento. Tente novamente.",
    cc_rejected_duplicated_payment: "Pagamento duplicado detectado.",
    cc_rejected_high_risk:
      "Pagamento recusado por segurança. Tente outro método de pagamento.",
    cc_rejected_insufficient_amount:
      "Saldo insuficiente. Verifique e tente novamente.",
    cc_rejected_invalid_installments:
      "Número de parcelas inválido para este cartão.",
    cc_rejected_max_attempts:
      "Limite de tentativas excedido. Aguarde 24 horas.",
    cc_rejected_other_reason:
      "Pagamento recusado. Tente outro cartão ou método de pagamento.",
    insufficient_data:
      "Dados insuficientes. Verifique as informações do cartão.",
    pending_review_manual: "Pagamento em análise. Aguarde a confirmação.",
    pending_waiting_payment: "Aguardando confirmação do pagamento.",
    // Default message
    default:
      "Não foi possível processar o pagamento. Tente novamente ou use outro método.",
  };

  return errorMessages[statusDetail || "default"] || errorMessages.default;
}
