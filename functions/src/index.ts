import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { config } from "dotenv";

// Load environment variables
config();
import { mercadopagoWebhook } from "./webhooks/mercadopago";
import { processPayment } from "./payments/processor";
import { sendConfirmationEmail } from "./emails/sender";
import { createPaymentPreference } from "./payments/checkout";

// Initialize Firebase Admin
admin.initializeApp();

// Export functions
export const handleMercadoPagoWebhook = mercadopagoWebhook;
export const processApprovedPayment = processPayment;
export const sendEmail = sendConfirmationEmail;
export const createCheckout = createPaymentPreference;

// Health check endpoint
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString() 
  });
});