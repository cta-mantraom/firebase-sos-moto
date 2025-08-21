// Test the SRC schema vs DOMAIN schema
import { MercadoPagoWebhookSchema as SrcSchema } from './src/schemas/payment.js';

const testPayload = {
  "action": "payment.updated",
  "api_version": "v1",
  "data": {"id":"123456"},
  "date_created": "2021-11-01T02:02:02Z",
  "id": "123456",
  "live_mode": false,
  "type": "payment",
  "user_id": 2208672851
};

console.log("=== TESTING SRC SCHEMA ===");
try {
  const result = SrcSchema.parse(testPayload);
  console.log("✅ SRC schema validation PASSED");
} catch (error) {
  console.log("❌ SRC schema validation FAILED:", error.message);
  if (error.errors) {
    console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
  }
}