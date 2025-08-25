import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { z } from "zod";
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
 * MercadoPago Webhook Handler - Optimized for Performance
 * 
 * CRITICAL RESPONSIBILITIES:
 * 1. Validate HMAC signature (security)
 * 2. Enqueue job for async processing (performance)
 * 3. Return quickly (< 3 seconds)
 * 
 * DOES NOT:
 * - Fetch payment details (done in async job)
 * - Process profiles (done in async job)
 * - Save to database (done in async job)
 * 
 * This ensures maximum performance and reliability
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

    // Step 3: Validate HMAC signature
    const isValidSignature = validateHMACSignature(
      signature,
      requestId,
      notification.data.id,
      getPaymentConfig().webhookSecret
    );

    if (!isValidSignature) {
      logError("Invalid HMAC signature", new Error("HMAC validation failed"), {
        correlationId,
        requestId,
        dataId: notification.data.id,
      });
      
      // Return 401 for invalid signature
      return res.status(401).json({ 
        error: "Invalid signature",
        correlationId 
      });
    }

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

      logInfo("Webhook job enqueued successfully", {
        correlationId,
        jobId,
        paymentId: notification.data.id,
        processingTime: Date.now() - startTime,
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

      // Try fallback queue or mark for manual processing
      try {
        // Simple fallback: log to a "failed_webhooks" collection for manual retry
        await logFailedWebhook(notification, correlationId, requestId);
      } catch (fallbackError) {
        logError("Fallback logging also failed", fallbackError as Error, {
          correlationId,
        });
      }

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

/**
 * Validate HMAC signature using MercadoPago's algorithm
 * 
 * MercadoPago signature format:
 * - Header: x-signature: ts=<timestamp>,v1=<hash>
 * - Manifest: id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;
 * - Hash: HMAC-SHA256(manifest, webhook_secret)
 */
function validateHMACSignature(
  signature: string,
  requestId: string,
  dataId: string,
  webhookSecret: string
): boolean {
  try {
    // Parse signature header: "ts=<timestamp>,v1=<hash>"
    const parts = signature.split(',');
    const tsPart = parts.find(p => p.startsWith('ts='));
    const v1Part = parts.find(p => p.startsWith('v1='));

    if (!tsPart || !v1Part) {
      logWarning("Invalid signature format", {
        signature: signature.substring(0, 50), // Log only part for security
      });
      return false;
    }

    const timestamp = tsPart.replace('ts=', '');
    const receivedHash = v1Part.replace('v1=', '');

    // Check timestamp is recent (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const signatureTime = parseInt(timestamp, 10);
    const timeDiff = currentTime - signatureTime;

    if (timeDiff > 300 || timeDiff < -300) { // 5 minutes tolerance
      logWarning("Webhook timestamp too old or in future", {
        timeDiff,
        currentTime,
        signatureTime,
      });
      return false;
    }

    // Build manifest string
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;

    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(receivedHash)
    );

    if (!isValid) {
      logWarning("HMAC validation failed", {
        manifestLength: manifest.length,
        hashLength: receivedHash.length,
      });
    }

    return isValid;

  } catch (error) {
    logError("Error during HMAC validation", error as Error);
    return false;
  }
}

/**
 * Fallback: Log failed webhook for manual processing
 */
async function logFailedWebhook(
  notification: WebhookNotification,
  correlationId: string,
  requestId: string
): Promise<void> {
  try {
    // Import Firebase only when needed (lazy loading)
    const { getFirestore } = await import("firebase-admin/firestore");
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirebaseConfig } = await import("../lib/config/index.js");

    // Initialize Firebase if needed
    if (!getApps().length) {
      const firebaseConfig = getFirebaseConfig();
      initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });
    }

    const db = getFirestore();
    
    // Save to failed_webhooks collection for manual retry
    await db
      .collection("failed_webhooks")
      .doc(`${notification.id}_${Date.now()}`)
      .set({
        notification,
        correlationId,
        requestId,
        failedAt: new Date().toISOString(),
        status: "enqueue_failed",
        needsManualRetry: true,
      });

    logInfo("Failed webhook logged for manual retry", {
      correlationId,
      notificationId: notification.id,
      paymentId: notification.data.id,
    });
  } catch (error) {
    logError("Failed to log webhook for manual retry", error as Error, {
      correlationId,
    });
    throw error;
  }
}