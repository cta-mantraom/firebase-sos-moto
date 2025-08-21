// Test the actual import to see if there's an import issue
import { MercadoPagoWebhookSchema } from './lib/domain/payment/payment.validators.js';

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

console.log("=== TESTING ACTUAL IMPORT ===");
try {
  const result = MercadoPagoWebhookSchema.parse(testPayload);
  console.log("✅ Import and validation PASSED");
  console.log("Parsed result:", result);
} catch (error) {
  console.log("❌ Import and validation FAILED:", error.message);
  console.log("Error name:", error.name);
  console.log("Error constructor:", error.constructor.name);
  if (error.errors) {
    console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
  }
  console.log("Full error object:", error);
}