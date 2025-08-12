# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Moto SOS Guardian App - a payment processing and profile management system built with Firebase Cloud Functions, TypeScript, and React. The system handles MercadoPago payment integration, user profile creation, and QR code generation for emergency contact information.

## Critical Rules for Development

### 🚫 Absolute Prohibitions

- **NEVER use `any`** type in production code
- **DO NOT modify, create, or delete** any files in `tests/` or `test-integration/` directories
- **DO NOT use `import_map.json`** in Cloud Functions - it causes compatibility issues
- **DO NOT use `functions.config()`** - deprecated and will stop working after Dec 31, 2025

### ✅ Required Practices

- Use `unknown` **ONLY** at system boundaries (external data entry points) before validation
- Immediately validate all external data with Zod schemas
- After validation, work only with strongly typed data
- Each Cloud Function must be properly exported from `functions/src/index.ts`
- Use Firebase Admin SDK for server-side operations
- Use `.env` files for environment variables (NOT functions.config())

### 🎯 Type Safety Strategy

#### How we removed `any` types:

1. **Firebase REST API responses**: Changed from `any` to `unknown`, then cast to specific interface:

   ```typescript
   // Before: (v: any) => v.stringValue
   // After:
   (v: unknown) => {
     const value = v as { stringValue?: string };
     return value.stringValue || "";
   };
   ```

2. **Generic API responses**: Created typed interface with generic `T = unknown`:

   ```typescript
   interface APIResponse<T = unknown> {
     success: boolean;
     data?: T;
     // ...
   }
   ```

3. **Logger data**: Changed from `[key: string]: any` to `[key: string]: unknown`

4. **Payment userData**: Changed from `any` to specific `Profile` type

**Rule**: Use `unknown` for external data → validate with Zod → work with typed data

## Development Commands

### Frontend (Vite + React)

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Firebase Cloud Functions

```bash
cd functions
npm run serve        # Serve functions locally with emulator
npm run shell        # Interactive shell for testing functions
npm run deploy       # Deploy all functions to Firebase
firebase deploy --only functions:<name>  # Deploy specific function

# Environment Variables (NEW METHOD - post 2025)
# Create .env file in functions/ directory with variables
# DO NOT use: firebase functions:config:set (deprecated!)
```

### Linting & Type Checking

```bash
npm run lint                          # Lint frontend code
cd functions && npm run lint         # Lint Cloud Functions
cd functions && npm run build        # Type check Cloud Functions
```

## Architecture Overview

### Cloud Functions Flow

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

## Working with Cloud Functions

### Environment Variables (Updated Method)

⚠️ **IMPORTANT**: Firebase's `functions.config()` is deprecated and will stop working after Dec 31, 2025.

#### New Method (Required):

1. Create `.env` file in `functions/` directory
2. Add your environment variables:

```env
# functions/.env
MERCADOPAGO_ACCESS_TOKEN=your_token
MERCADOPAGO_WEBHOOK_SECRET=your_secret
AWS_SES_ACCESS_KEY_ID=your_key_id  # Note: _ID suffix is required!
AWS_SES_SECRET_ACCESS_KEY=your_secret
AWS_SES_REGION=sa-east-1
SES_FROM_EMAIL=contact@memoryys.com  # Production email
FRONTEND_URL=https://app.memoryys.com     # Production URL
FRONTEND_URL_DEV=https://moto-sos-guardian-app-78272.web.app  # Dev/Staging
FUNCTIONS_URL=https://region-project.cloudfunctions.net
FIREBASE_PROJECT_ID=your-project-id
```

3. Access in code using `process.env.VARIABLE_NAME`

#### Old Method (Deprecated - DO NOT USE):

```bash
# DON'T DO THIS - Will stop working after Dec 31, 2025:
firebase functions:config:set key=value  # ❌ DEPRECATED
```

### Adding a New Cloud Function

1. Add function to `functions/src/index.ts`
2. Export it using appropriate trigger type:
   - `functions.https.onRequest()` for HTTP endpoints
   - `functions.firestore.document().onCreate()` for Firestore triggers
   - `functions.pubsub.schedule()` for scheduled functions
3. Deploy with `firebase deploy --only functions:<name>`

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
  logError("Description", error as Error, context);
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

## Firebase Configuration

The project is configured to use Firebase with project ID `moto-sos-guardian-app-78272`. All Firebase services (Firestore, Functions, Storage, Hosting) are configured in `firebase.json`.

### Project URLs:

#### Production:

- **Main Website**: https://memoryys.com (Vercel)
- **App Domain**: https://app.memoryys.com (Firebase Hosting)
- **Email**: contact@memoryys.com
- **Functions**: https://southamerica-east1-moto-sos-guardian-app-78272.cloudfunctions.net

#### Development/Staging:

- **Firebase Hosting**: https://moto-sos-guardian-app-78272.web.app
- **Firebase Console**: https://console.firebase.google.com/project/moto-sos-guardian-app-78272

#### Important Notes:

- Main website (memoryys.com) hosted on Vercel
- Moto SOS Guardian App hosted on app.memoryys.com (Firebase Hosting)
- Firebase Hosting URL is used for staging/development
- All emails are sent from contact@memoryys.com

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
