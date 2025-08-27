import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { MercadoPagoService } from "../../lib/services/payment/mercadopago.service.js";
import { PaymentRepository } from "../../lib/repositories/payment.repository.js";
import { ProfileService } from "../../lib/services/profile/profile.service.js";
import { QRCodeService } from "../../lib/services/profile/qrcode.service.js";
import { EmailService } from "../../lib/services/notification/email.service.js";
import { QStashService } from "../../lib/services/queue/qstash.service.js";
import { logInfo, logError, logWarning } from "../../lib/utils/logger.js";
import { generateProfileId } from "../../lib/utils/ids.js";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirebaseConfig, getPaymentConfig, getRedisConfig } from "../../lib/config/index.js";
import { PlanType, ProfileStatus } from "../../lib/domain/profile/profile.types.js";
import { Profile } from "../../lib/domain/profile/profile.entity.js";
import { JobType, PaymentWebhookJobData } from "../../lib/types/queue.types.js";

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

// Job payload schema from webhook
const WebhookJobSchema = z.object({
  jobType: z.literal(JobType.PROCESS_PAYMENT_WEBHOOK),
  paymentId: z.string(),
  webhookData: z.object({
    id: z.string(),
    type: z.string(),
    action: z.string(),
    dateCreated: z.string(),
    liveMode: z.boolean(),
  }),
  correlationId: z.string(),
  requestId: z.string(),
  receivedAt: z.string(),
  retryCount: z.number(),
  maxRetries: z.number(),
});

// Type for webhook job (used for validation)

/**
 * Validate QStash signature to ensure request is from QStash
 * QStash uses HMAC-SHA256 with the signing key
 */
function validateQStashSignature(
  req: VercelRequest,
  signingKey: string
): boolean {
  try {
    const signature = req.headers["upstash-signature"] as string;
    
    if (!signature) {
      logWarning("Missing QStash signature");
      return false;
    }

    // QStash signature format: base64(hmac-sha256(payload))
    const payload = JSON.stringify(req.body);
    const expectedSignature = createHmac("sha256", signingKey)
      .update(payload)
      .digest("base64");

    // Constant-time comparison
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logWarning("Invalid QStash signature");
    }

    return isValid;
  } catch (error) {
    logError("Error validating QStash signature", error as Error);
    return false;
  }
}

/**
 * Payment Webhook Processor - Async Job Handler
 * 
 * This processes webhook jobs enqueued by the webhook handler.
 * 
 * SECURITY:
 * - Validates QStash signature to ensure authentic source
 * - Only processes jobs from trusted queue
 * 
 * RESPONSIBILITIES:
 * 1. Fetch complete payment details from MercadoPago
 * 2. Validate Device ID presence (CRITICAL for approval rate)
 * 3. Save payment information to repository
 * 4. Process approved payments (create profile, QR code, send email)
 * 5. Handle PIX payments specially (show QR code)
 * 
 * This runs asynchronously via QStash, not in the webhook response
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  let correlationId: string;

  // SECURITY: Validate this request is from QStash
  const redisConfig = getRedisConfig();
  const qstashSigningKey = redisConfig.qstashSigningKey || redisConfig.qstashToken;
  
  if (!qstashSigningKey || !validateQStashSignature(req, qstashSigningKey)) {
    logError("Invalid QStash signature - unauthorized processor access", new Error("Unauthorized"));
    
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid request signature",
    });
  }

  try {
    // Parse and validate job payload
    const jobData = WebhookJobSchema.safeParse(req.body);
    
    if (!jobData.success) {
      logError("Invalid job payload", new Error("Validation failed"), {
        errors: jobData.error.errors,
      });
      
      return res.status(400).json({
        error: "Invalid job payload",
        details: jobData.error.errors,
      });
    }

    const job = jobData.data;
    correlationId = job.correlationId;

    logInfo("Processing payment webhook job", {
      correlationId,
      paymentId: job.paymentId,
      retryCount: job.retryCount,
      processingTime: Date.now() - startTime,
    });

    // Initialize services
    const paymentConfig = getPaymentConfig();
    const mercadoPagoService = new MercadoPagoService(paymentConfig);
    const paymentRepository = new PaymentRepository();
    const profileRepository = new (await import("../../lib/repositories/profile.repository.js")).ProfileRepository();
    const profileService = new ProfileService(profileRepository);
    const qrCodeService = new QRCodeService();
    const emailService = new EmailService();
    const db = getFirestore();

    // Step 1: Fetch complete payment details from MercadoPago
    // This requires valid MercadoPago access token (already validated in service)
    const payment = await mercadoPagoService.getPaymentDetails(job.paymentId);

    // Step 2: Validate Device ID presence (CRITICAL for approval rate)
    const deviceId = (payment.metadata?.device_id as string | undefined) || 
                    (payment.metadata?.deviceId as string | undefined) ||
                    (payment.additional_info?.payer as Record<string, unknown>)?.device_id as string | undefined;
    
    if (!deviceId) {
      logWarning("⚠️ Payment missing Device ID - CRITICAL for approval rate", {
        correlationId,
        paymentId: payment.id.toString(),
        status: payment.status,
        metadata: payment.metadata,
      });
      
      // Log to special collection for monitoring
      await db
        .collection("payments_missing_device_id")
        .doc(payment.id.toString())
        .set({
          paymentId: payment.id,
          status: payment.status,
          amount: payment.transaction_amount,
          createdAt: payment.date_created,
          correlationId,
          metadata: payment.metadata || {},
          warning: "CRITICAL: Missing Device ID - approval rate severely impacted",
          impact: "Expected approval drop from 85% to 40%",
        });
    } else {
      logInfo("✅ Device ID present - approval rate optimized", {
        correlationId,
        paymentId: payment.id.toString(),
        deviceId: deviceId.substring(0, 8) + "...", // Log partial for security
      });
    }

    // Step 3: Save payment log with Device ID tracking
    await paymentRepository.savePaymentLog(
      payment.id.toString(),
      "payment_processed",
      {
        externalReference: payment.external_reference || "",
        status: payment.status,
        statusDetail: payment.status_detail || "",
        amount: payment.transaction_amount,
        paymentMethodId: payment.payment_method_id,
        paymentTypeId: payment.payment_type_id,
        payerEmail: payment.payer?.email || "",
        payerIdentification: payment.payer?.identification,
        metadata: payment.metadata || {},
        deviceId: deviceId || null,
        hasDeviceId: !!deviceId,
        deviceIdWarning: !deviceId ? "MISSING_DEVICE_ID_CRITICAL" : null,
        processedAt: new Date(),
        processingTime: Date.now() - startTime,
      },
      correlationId
    );

    // Step 4: Process based on payment status
    if (payment.status !== "approved") {
      logInfo("Payment not approved, skipping profile creation", {
        correlationId,
        paymentId: payment.id.toString(),
        status: payment.status,
        statusDetail: payment.status_detail,
      });

      // Update pending profile status
      if (payment.external_reference) {
        await db
          .collection("pending_profiles")
          .doc(payment.external_reference)
          .update({
            paymentStatus: payment.status,
            paymentStatusDetail: payment.status_detail,
            missingDeviceId: !deviceId,
            updatedAt: new Date().toISOString(),
          });
      }

      return res.status(200).json({
        status: "payment_not_approved",
        paymentStatus: payment.status,
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    // Step 5: Payment is approved - process profile creation
    const externalReference = payment.external_reference || 
                             payment.metadata?.unique_url ||
                             payment.metadata?.payment_id;
    
    if (!externalReference) {
      logError("Approved payment missing external reference", new Error("Missing reference"), {
        correlationId,
        paymentId: payment.id.toString(),
        metadata: payment.metadata,
      });
      
      return res.status(400).json({
        error: "Missing external reference",
        correlationId,
      });
    }

    // Get pending profile data
    const pendingProfileDoc = await db
      .collection("pending_profiles")
      .doc(externalReference as string)
      .get();

    if (!pendingProfileDoc.exists) {
      logError("Pending profile not found", new Error("Profile not found"), {
        correlationId,
        externalReference,
        paymentId: payment.id.toString(),
      });
      
      return res.status(404).json({
        error: "Pending profile not found",
        correlationId,
      });
    }

    const pendingProfile = pendingProfileDoc.data()!;

    // Step 6: Handle PIX payments specially (need to show QR code)
    if (payment.payment_type_id === "bank_transfer" || payment.payment_method_id === "pix") {
      logInfo("PIX payment detected - processing QR code", {
        correlationId,
        paymentId: payment.id.toString(),
      });

      // PIX has special flow - need to show QR code to user
      // Note: point_of_interaction data is typically in additional_info for PIX
      const pixData = (payment.additional_info as Record<string, unknown>)?.transaction_data as {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      } | undefined;
      
      if (pixData) {
        // Save PIX QR code data for display
        await db
          .collection("pix_payments")
          .doc(payment.id.toString())
          .set({
            paymentId: payment.id,
            externalReference,
            qrCode: pixData.qr_code,
            qrCodeBase64: pixData.qr_code_base64,
            ticketUrl: pixData.ticket_url,
            status: payment.status,
            amount: payment.transaction_amount,
            createdAt: new Date().toISOString(),
            correlationId,
          });
      }
    }

    // Step 7: Create profile with Device ID tracking
    try {
      const profileId = generateProfileId();
      
      // Build profile data conforming to ProfileData schema
      const profileData = {
        uniqueUrl: externalReference as string,
        personalData: pendingProfile.personalData,
        medicalData: pendingProfile.medicalData,
        emergencyContacts: pendingProfile.emergencyContacts,
        planType: payment.transaction_amount === 85 ? PlanType.PREMIUM : PlanType.BASIC,
        status: ProfileStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentId: payment.id.toString(),
      };

      // Save profile
      await profileService.createProfile(profileData);

      // Generate QR Code
      const qrCodeResult = await qrCodeService.generateAndUpload(
        `https://memoryys.com/emergency/${externalReference}`,
        externalReference as string
      );

      // Update profile with QR code
      await db
        .collection("profiles")
        .doc(externalReference as string)
        .update({
          qrCodeUrl: qrCodeResult.storageUrl || qrCodeResult.dataUrl,
          memorialUrl: `https://memoryys.com/emergency/${externalReference}`,
        });

      // Send confirmation email
      // Create a Profile instance from the data for the email service
      const profileForEmail = new Profile({
        uniqueUrl: externalReference as string,
        personalData: profileData.personalData,
        medicalData: profileData.medicalData,
        emergencyContacts: profileData.emergencyContacts,
        planType: profileData.planType as PlanType,
        status: ProfileStatus.ACTIVE,
        createdAt: new Date(profileData.createdAt),
        paymentId: payment.id.toString(),
        qrCodeUrl: qrCodeResult.storageUrl || qrCodeResult.dataUrl,
        memorialUrl: `https://memoryys.com/emergency/${externalReference}`,
      });
      
      await emailService.sendConfirmationEmail(
        profileForEmail,
        qrCodeResult.storageUrl || qrCodeResult.dataUrl
      );

      // Delete pending profile
      await db
        .collection("pending_profiles")
        .doc(externalReference as string)
        .delete();

      logInfo("✅ Profile created successfully", {
        correlationId,
        profileId,
        uniqueUrl: externalReference as string,
        paymentId: payment.id.toString(),
        deviceId: deviceId ? "present" : "MISSING",
        processingTime: Date.now() - startTime,
      });

      return res.status(200).json({
        status: "success",
        profileId,
        uniqueUrl: externalReference as string,
        qrCodeUrl: qrCodeResult.storageUrl || qrCodeResult.dataUrl,
        correlationId,
        hasDeviceId: !!deviceId,
        processingTime: Date.now() - startTime,
      });

    } catch (profileError) {
      logError("Failed to create profile", profileError as Error, {
        correlationId,
        externalReference,
        paymentId: payment.id.toString(),
      });

      // Mark for manual retry
      await db
        .collection("failed_profile_creation")
        .doc(externalReference as string)
        .set({
          pendingProfile,
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.transaction_amount,
            deviceId: deviceId || "MISSING",
          },
          error: (profileError as Error).message,
          correlationId,
          failedAt: new Date().toISOString(),
          needsManualRetry: true,
        });

      // If this is a retry and still failing, don't retry again
      if (job.retryCount >= job.maxRetries) {
        return res.status(500).json({
          error: "Profile creation failed after max retries",
          correlationId,
        });
      }

      // Enqueue for retry
      const qstashService = new QStashService();
      const retryJobData: PaymentWebhookJobData = {
        jobType: job.jobType,
        paymentId: job.paymentId,
        webhookData: job.webhookData,
        correlationId: job.correlationId,
        requestId: job.requestId,
        receivedAt: job.receivedAt,
        retryCount: job.retryCount + 1,
        maxRetries: job.maxRetries,
      };
      await qstashService.publishToQueue(
        "payment-webhook-processor",
        retryJobData,
        {
          delay: Math.min(60 * (job.retryCount + 1), 300), // Exponential backoff, max 5 min
        }
      );

      return res.status(500).json({
        error: "Profile creation failed, scheduled for retry",
        retryCount: job.retryCount + 1,
        correlationId,
      });
    }

  } catch (error) {
    logError("Webhook processor error", error as Error, {
      correlationId: correlationId!,
      processingTime: Date.now() - startTime,
    });

    return res.status(500).json({
      error: "Processing failed",
      message: (error as Error).message,
      correlationId: correlationId!,
    });
  }
}