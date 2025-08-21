import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { MercadoPagoWebhookSchema } from '../lib/domain/payment/payment.validators';
import { MercadoPagoService } from '../lib/services/payment/mercadopago.service.js';
import { PaymentRepository } from '../lib/repositories/payment.repository.js';
import { QStashService } from '../lib/services/queue/qstash.service.js';
import { QueueService } from '../lib/services/notification/queue.service.js';
import { logInfo, logError, logWarning } from '../lib/utils/logger.js';
import { JobType } from '../lib/types/queue.types.js';
import { PlanType } from '../lib/domain/profile/profile.types.js';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * MercadoPago Webhook Handler
 * 
 * Responsibilities:
 * - Validate webhook HMAC signature
 * - Fetch payment details from MercadoPago
 * - Log payment information
 * - Enqueue processing jobs for approved payments (asynchronous flow)
 * 
 * IMPORTANT: This handler follows async pattern - it only enqueues jobs
 * and does NOT process payments directly
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = crypto.randomUUID();

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    logInfo('Webhook received', { 
      correlationId, 
      headers: {
        'x-signature': req.headers['x-signature'] ? 'present' : 'missing',
        'x-request-id': req.headers['x-request-id'] ? 'present' : 'missing'
      }
    });

    // Initialize services
    const mercadoPagoService = new MercadoPagoService({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
      publicKey: process.env.VITE_MERCADOPAGO_PUBLIC_KEY!
    });
    
    const paymentRepository = new PaymentRepository();
    const qstashService = new QStashService();
    const queueService = new QueueService(qstashService);

    // Validate HMAC signature using MercadoPagoService
    const signature = req.headers["x-signature"] as string;
    const requestId = req.headers["x-request-id"] as string;

    if (!signature || !requestId) {
      logWarning('Missing webhook headers', { correlationId });
      return res.status(401).json({ error: "Missing signature headers" });
    }

    // Parse webhook data first to get data.id for validation
    const webhookData = MercadoPagoWebhookSchema.parse(req.body);
    
    // Validate signature with MercadoPagoService
    const isValid = await mercadoPagoService.validateWebhook(
      signature,
      requestId,
      webhookData.data.id
    );

    if (!isValid) {
      logError('Invalid webhook signature', new Error('HMAC validation failed'), { 
        correlationId,
        requestId 
      });
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Handle test notifications
    if (webhookData.action === "test") {
      logInfo('Test webhook received', { correlationId });
      return res.status(200).json({ status: "test webhook processed" });
    }

    // Only process payment.updated notifications
    if (
      webhookData.type !== "payment" ||
      webhookData.action !== "payment.updated"
    ) {
      logInfo('Webhook ignored', {
        correlationId,
        type: webhookData.type,
        action: webhookData.action
      });
      return res.status(200).json({ status: "ignored" });
    }

    // Get payment details using MercadoPagoService
    const payment = await mercadoPagoService.getPaymentDetails(webhookData.data.id);

    // Log payment using repository
    await paymentRepository.savePaymentLog(
      webhookData.data.id,
      'payment_webhook_received',
      {
        externalReference: payment.external_reference || '',
        status: payment.status,
        statusDetail: payment.status_detail || '',
        amount: payment.transaction_amount,
        paymentMethodId: payment.payment_method_id,
        paymentTypeId: payment.payment_type_id,
        payerEmail: payment.payer.email,
        payerIdentification: payment.payer.identification ? {
          type: payment.payer.identification.type,
          number: payment.payer.identification.number
        } : undefined,
        metadata: payment.metadata || {},
        webhookReceivedAt: new Date(),
        webhookAction: webhookData.action,
        webhookType: webhookData.type,
        processedAt: new Date()
      },
      correlationId
    );

    // If payment is approved, enqueue processing job (ASYNC FLOW)
    if (payment.status === "approved" && payment.external_reference) {
      const profileId = payment.external_reference;
      
      logInfo('Payment approved, enqueueing processing job', {
        correlationId,
        profileId,
        paymentId: payment.id.toString(),
        amount: payment.transaction_amount
      });

      try {
        // IMPORTANT: Only enqueue job, DO NOT process directly
        const jobId = await queueService.enqueueProcessingJob({
          jobType: JobType.PROCESS_PROFILE,
          profileId: profileId,
          uniqueUrl: profileId,
          paymentId: payment.id.toString(),
          planType: payment.transaction_amount === 85 ? PlanType.PREMIUM : PlanType.BASIC,
          profileData: {
            paymentId: payment.id,
            status: payment.status,
            amount: payment.transaction_amount,
            payerEmail: payment.payer.email,
            metadata: payment.metadata || {}
          },
          paymentData: {
            id: payment.id.toString(),
            status: payment.status,
            amount: payment.transaction_amount,
            externalReference: payment.external_reference || profileId
          },
          correlationId,
          retryCount: 0,
          maxRetries: 5
        });

        logInfo('Processing job enqueued successfully', {
          correlationId,
          jobId,
          profileId,
          paymentId: payment.id.toString()
        });

      } catch (error) {
        logError('Failed to enqueue processing job', error as Error, {
          correlationId,
          profileId,
          paymentId: payment.id.toString()
        });
        
        // Mark payment as approved but enqueueing failed (for manual retry)
        const db = getFirestore();
        await db
          .collection("pending_profiles")
          .doc(profileId)
          .update({
            paymentId: webhookData.data.id,
            paymentData: payment,
            status: "payment_approved_enqueue_failed",
            error: (error as Error).message,
            correlationId,
            updatedAt: new Date(),
          });
      }
    } else {
      logInfo('Payment not approved or missing reference', {
        correlationId,
        status: payment.status,
        hasReference: !!payment.external_reference
      });
    }

    // Return success immediately (webhook processed)
    return res.status(200).json({
      status: "processed",
      correlationId,
    });
    
  } catch (error) {
    logError('Webhook processing error', error as Error, { correlationId });
    
    // Return 200 to avoid MercadoPago retries for malformed data
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(200).json({
        status: "invalid_data",
        error: "Invalid webhook data format",
        correlationId,
      });
    }
    
    return res.status(500).json({
      error: "Internal server error",
      correlationId,
    });
  }
}