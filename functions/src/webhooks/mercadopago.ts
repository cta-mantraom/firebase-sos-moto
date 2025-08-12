import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { MercadoPagoWebhookSchema } from "../schemas";
import { validateHMACSignature } from "../utils/crypto";
// MercadoPago not needed - using REST API directly

export const mercadopagoWebhook = onRequest(
  {
    cors: true,
    timeoutSeconds: 300, // 5 minutos
  },
  async (req, res) => {
    const db = admin.firestore();
    const correlationId = crypto.randomUUID();

    try {
      // Only accept POST requests
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      // Get webhook secret from environment
      const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("Webhook secret not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      // Validate HMAC signature
      const signature = req.headers["x-signature"] as string;
      const requestId = req.headers["x-request-id"] as string;

      if (!signature || !requestId) {
        res.status(401).json({ error: "Missing signature headers" });
        return;
      }

      // Validate signature
      const isValid = validateHMACSignature(
        requestId,
        signature,
        webhookSecret
      );

      if (!isValid) {
        console.error("Invalid webhook signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      // Parse and validate webhook data
      const webhookData = MercadoPagoWebhookSchema.parse(req.body);

      // Handle test notifications
      if (webhookData.action === "test") {
        console.log("Test webhook received");
        res.status(200).json({ status: "test webhook processed" });
        return;
      }

      // Only process payment notifications
      if (
        webhookData.type !== "payment" ||
        webhookData.action !== "payment.updated"
      ) {
        res.status(200).json({ status: "ignored" });
        return;
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
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // If payment is approved, trigger profile creation
      if (payment.status === "approved" && payment.external_reference) {
        // Trigger profile creation via Firestore trigger
        await db
          .collection("pending_profiles")
          .doc(payment.external_reference)
          .set({
            paymentId: webhookData.data.id,
            paymentData: payment,
            correlationId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      res.status(200).json({
        status: "processed",
        correlationId,
      });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({
        error: "Internal server error",
        correlationId,
      });
    }
  }
);
