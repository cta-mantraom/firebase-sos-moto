import { z } from 'zod';

// Test the specific date format issue
const testDate = "2021-11-01T02:02:02Z";

console.log("Testing date:", testDate);

// Test with datetime validation (NEW schema)
const datetimeSchema = z.string().datetime('Invalid date format');

console.log("\n=== TESTING DATETIME VALIDATION ===");
try {
  const result = datetimeSchema.parse(testDate);
  console.log("✅ Datetime validation PASSED");
} catch (error) {
  console.log("❌ Datetime validation FAILED:", error.message);
  if (error.errors) {
    console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
  }
}

// Test with simple string validation (OLD schema)
const stringSchema = z.string();

console.log("\n=== TESTING STRING VALIDATION ===");
try {
  const result = stringSchema.parse(testDate);
  console.log("✅ String validation PASSED");
} catch (error) {
  console.log("❌ String validation FAILED:", error.message);
}

// Test different date formats that MercadoPago might send
const testDates = [
  "2021-11-01T02:02:02Z",
  "2021-11-01T02:02:02.000Z", 
  "2021-11-01T02:02:02+00:00",
  "2021-11-01T02:02:02.123Z"
];

console.log("\n=== TESTING VARIOUS DATE FORMATS ===");
testDates.forEach(date => {
  try {
    datetimeSchema.parse(date);
    console.log(`✅ ${date} - PASSED`);
  } catch (error) {
    console.log(`❌ ${date} - FAILED: ${error.message}`);
  }
});