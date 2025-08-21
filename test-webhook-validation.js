import { z } from 'zod';

// Test payload from MercadoPago
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

console.log("Test payload:", JSON.stringify(testPayload, null, 2));

// OLD schema (working)
const OLD_MercadoPagoWebhookSchema = z.object({
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  application_id: z.number(),
  user_id: z.number(),
  version: z.number(),
  api_version: z.string(),
  action: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

console.log("\n=== TESTING OLD SCHEMA ===");
try {
  const result = OLD_MercadoPagoWebhookSchema.parse(testPayload);
  console.log("✅ OLD schema validation PASSED");
} catch (error) {
  console.log("❌ OLD schema validation FAILED:", error.message);
  if (error.errors) {
    console.log("Validation errors:", error.errors);
  }
}

// NEW schema (current, failing)
const NEW_MercadoPagoWebhookSchema = z.object({
  id: z.string().min(1, 'Webhook ID is required'),
  type: z.string().min(1, 'Webhook type is required'),
  action: z.string().min(1, 'Webhook action is required'),
  api_version: z.string().min(1, 'API version is required'),
  date_created: z.string().datetime('Invalid date format'),
  user_id: z.number().int('User ID must be an integer'),
  live_mode: z.boolean(),
  data: z.object({
    id: z.string().min(1, 'Payment ID is required'),
  }),
});

console.log("\n=== TESTING NEW SCHEMA ===");
try {
  const result = NEW_MercadoPagoWebhookSchema.parse(testPayload);
  console.log("✅ NEW schema validation PASSED");
} catch (error) {
  console.log("❌ NEW schema validation FAILED:", error.message);
  if (error.errors) {
    console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
  }
}