// Test file to validate MercadoPago payment structure
// This shows the correct structure for payment creation with Device ID

const correctPaymentStructure = {
  // Basic payment info
  transaction_amount: 5.0,
  payment_method_id: "pix",
  description: "Memoryys - Perfil de Emergência basic",
  
  // Payer info
  payer: {
    email: "user@example.com",
    identification: {
      type: "CPF",
      number: "12345678901"
    }
  },
  
  // CRITICAL: additional_info must contain device_session_id
  additional_info: {
    // Device ID goes here, NOT at root level
    device_session_id: "armor.43398d9849b8d6665a14a86e34bb1b7fc1636111dc99bbb5a4164b5503122bbc...",
    
    // IP address for fraud prevention
    ip_address: "192.168.1.1",
    
    // Items array - NO currency_id here
    items: [{
      id: "memoryys-basic",
      title: "Perfil de Emergência basic",
      description: "Acesso a informações médicas de emergência",
      category_id: "services",
      quantity: 1,
      unit_price: 5.0
      // NO currency_id in items - this was the error
    }],
    
    // Payer additional info
    payer: {
      first_name: "John",
      last_name: "Doe"
    }
  },
  
  // Metadata for our tracking
  metadata: {
    payment_id: "payment_123",
    unique_url: "abc123",
    plan_type: "basic",
    blood_type: "O+",
    has_device_id: true
  },
  
  // Other configs
  external_reference: "payment_123",
  notification_url: "https://api.memoryys.com/api/mercadopago-webhook",
  statement_descriptor: "MEMORYYS",
  binary_mode: false,
  capture: true,
  three_d_secure_mode: "optional"
};

console.log("✅ CORRECT Payment Structure for MercadoPago:");
console.log(JSON.stringify(correctPaymentStructure, null, 2));

console.log("\n❌ WRONG - What was causing the error:");
console.log("1. device_id at root level (should be additional_info.device_session_id)");
console.log("2. currency_id in additional_info.items (not allowed there)");

console.log("\n🎯 Key Changes Made:");
console.log("1. Moved device_id to additional_info.device_session_id");
console.log("2. Removed currency_id from additional_info.items");
console.log("3. Added ip_address to additional_info for fraud prevention");