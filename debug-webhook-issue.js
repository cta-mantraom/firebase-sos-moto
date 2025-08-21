import { z } from 'zod';

// Recreate the OLD schema (working)
const OLD_Schema = z.object({
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

// Recreate the NEW schema (failing)
const NEW_Schema = z.object({
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

// Test payload provided
const testPayload = {
  "action": "payment.updated",
  "api_version": "v1",
  "data": {"id":"123456"},
  "date_created": "2021-11-01T02:02:02Z",
  "id": "123456",                    // ← STRING not NUMBER
  "live_mode": false,
  "type": "payment",
  "user_id": 2208672851             // ← NUMBER (this should work in NEW)
};

console.log("=== DETAILED ANALYSIS ===");
console.log("Test payload:", JSON.stringify(testPayload, null, 2));

console.log("\n=== OLD SCHEMA TEST ===");
try {
  OLD_Schema.parse(testPayload);
  console.log("✅ OLD schema PASSED");
} catch (error) {
  console.log("❌ OLD schema FAILED:");
  error.errors?.forEach(err => {
    console.log(`  - Field '${err.path.join('.')}': ${err.message} (expected: ${err.expected}, got: ${err.received})`);
  });
}

console.log("\n=== NEW SCHEMA TEST ===");
try {
  NEW_Schema.parse(testPayload);
  console.log("✅ NEW schema PASSED");
} catch (error) {
  console.log("❌ NEW schema FAILED:");
  error.errors?.forEach(err => {
    console.log(`  - Field '${err.path.join('.')}': ${err.message}`);
  });
}

console.log("\n=== FIELD-BY-FIELD ANALYSIS ===");

// Test each field individually
const fields = [
  { name: 'id', old: z.number(), new: z.string().min(1), value: testPayload.id },
  { name: 'type', old: z.string(), new: z.string().min(1), value: testPayload.type },
  { name: 'action', old: z.string(), new: z.string().min(1), value: testPayload.action },
  { name: 'api_version', old: z.string(), new: z.string().min(1), value: testPayload.api_version },
  { name: 'date_created', old: z.string(), new: z.string().datetime(), value: testPayload.date_created },
  { name: 'user_id', old: z.number(), new: z.number().int(), value: testPayload.user_id },
  { name: 'live_mode', old: z.boolean(), new: z.boolean(), value: testPayload.live_mode }
];

fields.forEach(field => {
  const oldResult = field.old.safeParse(field.value);
  const newResult = field.new.safeParse(field.value);
  
  console.log(`${field.name}: ${field.value} (${typeof field.value})`);
  console.log(`  OLD: ${oldResult.success ? '✅' : '❌ ' + oldResult.error?.errors[0]?.message}`);
  console.log(`  NEW: ${newResult.success ? '✅' : '❌ ' + newResult.error?.errors[0]?.message}`);
});

// Test the missing fields issue
console.log("\n=== MISSING FIELDS ANALYSIS ===");
const missingInPayload = ['application_id', 'version'];
missingInPayload.forEach(field => {
  console.log(`${field}: MISSING from payload (OLD schema required this)`);
});

console.log("\n=== CONCLUSION ===");
console.log("The NEW schema should actually WORK BETTER than the old one!");
console.log("OLD schema fails because it requires 'application_id' and 'version' that don't exist.");
console.log("OLD schema fails because it expects 'id' as number but gets string.");
console.log("If webhook is failing with NEW schema, the issue might be elsewhere...");