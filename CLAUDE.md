# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Moto SOS Guardian App - a payment processing and profile management system built with Supabase Edge Functions, TypeScript, and React. The system handles MercadoPago payment integration, user profile creation, and QR code generation for emergency contact information.

## Critical Rules for Development

### 🚫 Absolute Prohibitions

- **NEVER use `any`** type in production code
- **DO NOT modify, create, or delete** any files in `tests/` or `test-integration/` directories
- **DO NOT use `import_map.json`** in Supabase Functions - it causes compatibility issues

### ✅ Required Practices

- Use `unknown` **ONLY** at system boundaries (external data entry points) before validation
- Immediately validate all external data with Zod schemas
- After validation, work only with strongly typed data
- Each Edge Function requiring npm packages must have its own `.npmrc` file
- Each Edge Function must have its own `deno.json` configuration

## Development Commands

### Frontend (Vite + React)
```bash
npm run dev        # Start development server
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Supabase Edge Functions
```bash
supabase functions serve               # Serve all functions locally
supabase functions serve <function>   # Serve specific function
supabase functions deploy              # Deploy all functions
supabase functions deploy <function>  # Deploy specific function
```

### Linting & Type Checking
```bash
npm run lint                          # Lint frontend code
deno lint supabase/functions/         # Lint Edge Functions
deno check supabase/functions/**/*.ts # Type check Edge Functions
```

## Architecture Overview

### Edge Functions Flow
```
1. mercadopago-checkout → Creates payment preference
2. mercadopago-webhook → Receives payment notifications
   ↓ (validates HMAC signature)
   ↓ (delegates to processor via QStash)
3. final-processor → Processes approved payments
   ↓ (creates user profile)
   ↓ (enqueues email job)
4. email-sender → Sends confirmation emails with QR code
```

### Key Architectural Decisions

1. **Type Safety Architecture**: Centralized schemas in `_shared/schemas/` with validation at system boundaries
2. **Service Layer Pattern**: External services (APIs) separated from internal domain services
3. **Correlation ID Tracking**: All requests tracked with correlation IDs for debugging
4. **Retry Logic**: Exponential backoff for external service calls
5. **HMAC Validation**: Webhook security with signature verification

### Data Flow Pattern
```
External Data (unknown) → Zod Validation → Typed Data → Business Logic
```

## Working with Edge Functions

### Environment Variables
Each function validates its required environment variables using specific schemas:
- `CheckoutEnv` for mercadopago-checkout
- `WebhookEnv` for mercadopago-webhook  
- `ProcessorEnv` for final-processor
- `EmailEnv` for email-sender

### Adding a New Edge Function
1. Create directory: `supabase/functions/your-function/`
2. Add `index.ts` with Deno.serve()
3. Create `deno.json` configuration
4. Add `.npmrc` if using private npm packages
5. Update `supabase/config.toml` with JWT verification settings

### Common Patterns

**Validating External Data:**
```typescript
const rawData: unknown = await req.json();
const validatedData = YourSchema.parse(rawData);
```

**Error Handling:**
```typescript
try {
  // operation
} catch (error) {
  logError('Description', error as Error, context);
  return createErrorResponse(error, correlationId);
}
```

**Retry Logic:**
```typescript
await withRetry(
  () => externalService.call(),
  createRetryConfig(3, 1000),
  context
);
```

## MCP Server Configuration

The project uses a Supabase MCP server configured in `.kiro/settings/mcp.json`. This provides direct access to Supabase operations within the development environment.

## Database Schema

Key tables:
- `profiles` - User profiles with emergency contact information
- `payments` - Payment transaction logs
- `memorial_pages` - Generated memorial pages with QR codes

## Important Notes

- Production code must be clean - no test utilities or mock data
- All external API responses must be validated before use
- Use structured logging with correlation IDs
- Mask sensitive data in logs (payment IDs, user data)
- Each function is independently deployable with its own configuration