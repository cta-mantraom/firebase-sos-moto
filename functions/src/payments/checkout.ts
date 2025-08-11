import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { MercadoPago } from "mercadopago";
import { PaymentRequestSchema } from "../schemas";
import { generateUniqueUrl } from "../utils/crypto";
import * as cors from "cors";

const corsHandler = cors({ origin: true });
const db = admin.firestore();

const PLAN_PRICES = {
  basic: {
    title: "SOS Motoboy - Plano Básico",
    unit_price: 55.00,
  },
  premium: {
    title: "SOS Motoboy - Plano Premium",
    unit_price: 85.00,
  },
};

export const createPaymentPreference = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
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

      // Initialize MercadoPago
      const mercadopago = new MercadoPago({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      });

      // Generate unique URL for memorial page
      const uniqueUrl = generateUniqueUrl();
      
      // Get frontend URL from environment
      const frontendUrl = process.env.FRONTEND_URL || "https://memoryys.com";

      // Create payment preference
      const preference = await mercadopago.preferences.create({
        body: {
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
          notification_url: `${process.env.FUNCTIONS_URL}/handleMercadoPagoWebhook`,
          statement_descriptor: "MOTO SOS",
          expires: true,
          expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      // Store pending profile data
      await db.collection("pending_profiles").doc(uniqueUrl).set({
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
  });
});