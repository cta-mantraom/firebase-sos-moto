import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { MercadoPagoService } from "../lib/services/payment/mercadopago.service.js";
import { QStashService } from "../lib/services/queue/qstash.service.js";
import { logInfo, logError, logWarning } from "../lib/utils/logger.js";
import { generateCorrelationId } from "../lib/utils/ids.js";
import { getPaymentConfig } from "../lib/config/index.js";
import { JobType, PaymentWebhookJobData } from "../lib/types/queue.types.js";

// Minimal webhook schema - only what we need for validation
const WebhookNotificationSchema = z.object({
  id: z.string(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  user_id: z.number().optional(),
  api_version: z.string().optional(),
  action: z.string(),
  data: z.object({
    id: z.string(), // Payment ID
  }),
});

type WebhookNotification = z.infer<typeof WebhookNotificationSchema>;

/**
 * MercadoPago Webhook Handler - CRITICAL SECURITY & PERFORMANCE
 * 
 * 🔒 SECURITY REQUIREMENTS:
 * 1. HMAC signature validation is MANDATORY (prevents fraud)
 * 2. Return 401 for invalid signatures
 * 3. Use MercadoPagoService.validateWebhook() for consistency
 * 
 * ⏱️ PERFORMANCE REQUIREMENTS:
 * 1. ONLY enqueue jobs - NEVER process payments here
 * 2. Return in < 3 seconds (MercadoPago timeout)
 * 3. NO database operations, NO email sending, NO heavy processing
 * 
 * 🚫 STRICTLY FORBIDDEN IN WEBHOOK:
 * - Fetching payment details from MercadoPago API
 * - Creating or updating profiles
 * - Sending emails or notifications  
 * - Any synchronous processing
 * 
 * ✅ ONLY ALLOWED:
 * - HMAC validation
 * - Enqueue job to QStash
 * - Return response
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();

  // CORS headers for MercadoPago
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-signature, x-request-id");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ 
      error: "Method not allowed",
      correlationId 
    });
  }

  try {
    // Step 1: Extract and validate headers
    const signature = req.headers["x-signature"] as string;
    const requestId = req.headers["x-request-id"] as string;

    if (!signature || !requestId) {
      logWarning("Missing webhook headers", {
        correlationId,
        hasSignature: !!signature,
        hasRequestId: !!requestId,
      });
      
      // Return 401 for missing auth headers
      return res.status(401).json({ 
        error: "Missing authentication headers",
        correlationId 
      });
    }

    // Step 2: Parse webhook body (minimal validation)
    const webhookData = WebhookNotificationSchema.safeParse(req.body);
    
    if (!webhookData.success) {
      logWarning("Invalid webhook format", {
        correlationId,
        errors: webhookData.error.errors,
      });
      
      // Return 200 to prevent retries for malformed data
      return res.status(200).json({ 
        status: "invalid_format",
        correlationId 
      });
    }

    const notification = webhookData.data;

    // Step 3: Validate HMAC signature using MercadoPagoService
    // CRÍTICO: Usar o serviço centralizado para garantir consistência
    const mercadoPagoService = new MercadoPagoService(getPaymentConfig());
    const isValidSignature = await mercadoPagoService.validateWebhook(
      signature,
      requestId,
      notification.data.id
    );

    if (!isValidSignature) {
      logError("🔒 SECURITY VIOLATION: Invalid HMAC signature", new Error("HMAC validation failed"), {
        correlationId,
        requestId,
        dataId: notification.data.id,
        severity: "CRITICAL",
        action: "BLOCKED",
        warning: "Possible fraud attempt - webhook signature invalid",
      });
      
      // SECURITY: Return 401 for invalid signature
      return res.status(401).json({ 
        error: "Invalid signature - Security violation",
        correlationId,
        blocked: true
      });
    }
    
    // ✅ HMAC validated successfully - webhook is authentic
    logInfo("🔒 HMAC signature validated successfully", {
      correlationId,
      requestId,
    });

    // Step 4: Handle test webhooks quickly
    if (notification.action === "test") {
      logInfo("Test webhook received", {
        correlationId,
        processingTime: Date.now() - startTime,
      });
      
      return res.status(200).json({ 
        status: "test_ok",
        correlationId 
      });
    }

    // Step 5: Only process payment.updated notifications
    if (notification.type !== "payment" || notification.action !== "payment.updated") {
      logInfo("Webhook ignored - not a payment update", {
        correlationId,
        type: notification.type,
        action: notification.action,
        processingTime: Date.now() - startTime,
      });
      
      return res.status(200).json({ 
        status: "ignored",
        correlationId 
      });
    }

    // Step 6: Enqueue job for async processing (CRITICAL)
    try {
      const qstashService = new QStashService();
      
      // Create minimal job payload - fetch details in processor
      const jobPayload: PaymentWebhookJobData = {
        jobType: JobType.PROCESS_PAYMENT_WEBHOOK,
        paymentId: notification.data.id,
        webhookData: {
          id: notification.id,
          type: notification.type,
          action: notification.action,
          dateCreated: notification.date_created,
          liveMode: notification.live_mode,
        },
        correlationId,
        requestId,
        receivedAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 5,
      };

      // Enqueue to QStash with high priority
      const jobId = await qstashService.publishToQueue(
        "payment-webhook-processor",
        jobPayload,
        {
          deduplicationId: `webhook-${notification.id}`,
          contentBasedDeduplication: true,
          retries: 3,
          delay: 0, // Process immediately
        }
      );

      logInfo("✅ Webhook job enqueued successfully - NO SYNC PROCESSING", {
        correlationId,
        jobId,
        paymentId: notification.data.id,
        processingTime: Date.now() - startTime,
        note: "All processing happens asynchronously in QStash job",
      });

      // Step 7: Return success immediately
      return res.status(200).json({
        status: "enqueued",
        jobId,
        correlationId,
        processingTime: Date.now() - startTime,
      });

    } catch (enqueueError) {
      // Log error but still return 200 to prevent MercadoPago retries
      logError("Failed to enqueue webhook job", enqueueError as Error, {
        correlationId,
        paymentId: notification.data.id,
      });

      // CRITICAL: NO sync processing, just log the failure
      // Webhook MUST return quickly even on failure
      logWarning("Webhook enqueue failed - needs manual retry", {
        correlationId,
        paymentId: notification.data.id,
        notificationId: notification.id,
        action: "MANUAL_RETRY_NEEDED",
      });

      // Still return 200 to prevent webhook storm
      return res.status(200).json({
        status: "enqueue_failed_logged",
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

  } catch (error) {
    logError("Unexpected webhook error", error as Error, {
      correlationId,
      processingTime: Date.now() - startTime,
    });

    // Return 200 for any error to prevent webhook retry storms
    return res.status(200).json({
      status: "error_logged",
      correlationId,
      processingTime: Date.now() - startTime,
    });
  }
}

// REMOVIDO: Função validateHMACSignature duplicada
// Agora usando MercadoPagoService.validateWebhook() centralizado
// Isso garante consistência e manutenção única da lógica HMAC

// REMOVIDO: Função logFailedWebhook que fazia processamento síncrono
// Webhook DEVE apenas enfileirar jobs e retornar rapidamente
// Qualquer logging de falha deve ser apenas em memória (logWarning)