import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { MercadoPagoWebhookSchema } from '../lib/schemas/payment';
import { validateHMACSignature } from '../lib/utils/validation';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getFirestore();
  const correlationId = crypto.randomUUID();

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Validate HMAC signature
    const signature = req.headers["x-signature"] as string;
    const requestId = req.headers["x-request-id"] as string;

    if (!signature || !requestId) {
      return res.status(401).json({ error: "Missing signature headers" });
    }

    // Validate signature
    const isValid = validateHMACSignature(
      requestId,
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Parse and validate webhook data
    const webhookData = MercadoPagoWebhookSchema.parse(req.body);

    // Handle test notifications
    if (webhookData.action === "test") {
      console.log("Test webhook received");
      return res.status(200).json({ status: "test webhook processed" });
    }

    // Only process payment notifications
    if (
      webhookData.type !== "payment" ||
      webhookData.action !== "payment.updated"
    ) {
      return res.status(200).json({ status: "ignored" });
    }

    // Get payment details from MercadoPago REST API
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${webhookData.data.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );
    const payment = await paymentResponse.json();

    // Log payment to Firestore
    await db
      .collection("payments_log")
      .doc(webhookData.data.id)
      .set({
        paymentId: webhookData.data.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        externalReference: payment.external_reference,
        customerData: {
          email: payment.payer?.email,
          identification: payment.payer?.identification,
        },
        amount: payment.transaction_amount,
        correlationId,
        processedAt: new Date(),
      });

    // If payment is approved, process immediately (simplified)
    if (payment.status === "approved" && payment.external_reference) {
      const profileId = payment.external_reference;
      
      try {
        // Import and call the processing function directly
        const { processApprovedPayment } = await import('./create-payment');
        await processApprovedPayment(profileId, payment);
        
        console.log(`Profile processed successfully for ${profileId}`);
      } catch (error) {
        console.error('Failed to process profile:', error);
        
        // Mark payment as approved but processing failed
        await db
          .collection("pending_profiles")
          .doc(profileId)
          .update({
            paymentId: webhookData.data.id,
            paymentData: payment,
            status: "payment_approved_processing_failed",
            error: (error as Error).message,
            correlationId,
            updatedAt: new Date(),
          });
      }
    }

    return res.status(200).json({
      status: "processed",
      correlationId,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({
      error: "Internal server error",
      correlationId,
    });
  }
}