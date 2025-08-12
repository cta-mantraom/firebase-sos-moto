import * as admin from "firebase-admin";
import { config } from "dotenv";
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";

// Load environment variables
config();

// Initialize Firebase Admin
admin.initializeApp();

// Configure global region for all functions
setGlobalOptions({ region: "southamerica-east1" });

// Import functions
import { mercadopagoWebhook } from "./webhooks/mercadopago";
import { processPayment } from "./payments/processor";
import { sendConfirmationEmail } from "./emails/sender";
import { createPaymentPreference } from "./payments/checkout";

// Export v2 functions
export const handleMercadoPagoWebhook = mercadopagoWebhook;
export const processApprovedPayment = processPayment;
export const sendEmail = sendConfirmationEmail;
export const createCheckout = createPaymentPreference;

// Health check endpoint - v2
export const healthCheck = onRequest({ cors: true }, (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "v2",
    region: "southamerica-east1",
  });
});
