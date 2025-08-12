import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
// MercadoPago SDK not needed - using REST API
import { PaymentRequestSchema } from "../schemas";
import { generateUniqueUrl } from "../utils/crypto";

const PLAN_PRICES = {
  basic: {
    title: "SOS Motoboy - Plano Básico",
    unit_price: 55.0,
  },
  premium: {
    title: "SOS Motoboy - Plano Premium",
    unit_price: 85.0,
  },
};

export const createPaymentPreference = onRequest(
  {
    cors: true,
    timeoutSeconds: 540, // 9 minutos para processar pagamento
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

      // Validate request data
      const validatedData = PaymentRequestSchema.parse(req.body);
      const { planType, userData } = validatedData;

      // Generate unique URL for memorial page
      const uniqueUrl = generateUniqueUrl();

      // Get frontend URL from environment
      const frontendUrl = process.env.FRONTEND_URL || "https://memoryys.com";

      // Create payment preference using REST API
      const preferenceResponse = await fetch(
        "https://api.mercadopago.com/checkout/preferences",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                id: planType,
                title: PLAN_PRICES[planType].title,
                quantity: 1,
                unit_price: PLAN_PRICES[planType].unit_price,
                currency_id: "BRL",
              },
            ],
            payer: {
              name: userData.name,
              email: userData.email,
              phone: {
                number: userData.phone,
              },
            },
            back_urls: {
              success: `${frontendUrl}/success?id=${uniqueUrl}`,
              failure: `${frontendUrl}/failure`,
              pending: `${frontendUrl}/pending`,
            },
            auto_return: "approved",
            external_reference: uniqueUrl,
            notification_url: `https://southamerica-east1-moto-sos-guardian-app-78272.cloudfunctions.net/handleMercadoPagoWebhook`,
            statement_descriptor: "MOTO SOS",
            expires: true,
            expiration_date_to: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        }
      );

      const preference = await preferenceResponse.json();

      // Store pending profile data
      await db
        .collection("pending_profiles")
        .doc(uniqueUrl)
        .set({
          ...userData,
          planType,
          planPrice: PLAN_PRICES[planType].unit_price,
          uniqueUrl,
          preferenceId: preference.id,
          correlationId,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      res.status(200).json({
        checkoutUrl: preference.init_point || preference.sandbox_init_point,
        uniqueUrl,
        preferenceId: preference.id,
        correlationId,
      });
    } catch (error) {
      console.error("Checkout creation error:", error);
      res.status(500).json({
        error: "Failed to create payment preference",
        correlationId,
      });
    }
  }
);
