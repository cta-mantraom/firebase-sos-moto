# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a serverless MotoSOS Guardian application built with React + Vite for the frontend and Vercel Functions for the backend. The application manages emergency profiles with QR codes and payment processing through MercadoPago.

## Commands

```bash
# Development
npm run dev           # Start Vite dev server

# Build
npm run build         # Production build
npm run build:dev     # Development build

# Code Quality
npm run lint          # Run ESLint

# Preview
npm run preview       # Preview production build
```

## Architecture

### Serverless Architecture (Vercel Functions)

**CRITICAL**: This is a serverless application. Each function invocation is completely isolated:
- NO shared state between executions
- NO persistent memory between calls
- Each function must initialize its own resources
- Use factory patterns for service initialization

### Directory Structure

```
api/                  # HTTP endpoints (Vercel Functions)
├── *.ts             # Public endpoints
└── processors/      # Async worker endpoints (QStash webhooks)

lib/                 # Business logic (NOT endpoints)
├── domain/          # Domain entities and interfaces
├── services/        # Business logic and integrations
├── repositories/    # Data access layer
├── schemas/         # Zod schemas
├── types/          # TypeScript types
└── config/         # Configuration

src/                # React frontend
├── pages/          # Page components
├── components/     # UI components (includes shadcn/ui)
└── hooks/         # React hooks
```

### Key Architectural Rules

1. **API Endpoints** (`api/*.ts`):
   - Are public HTTP endpoints
   - MUST validate input with Zod schemas
   - MUST delegate logic to `lib/services/`
   - MUST NOT contain complex business logic
   - Workers in `api/processors/` receive QStash jobs

2. **Business Logic** (`lib/*`):
   - Contains ALL business logic
   - NOT directly accessible via HTTP
   - Imported by API endpoints
   - Schemas defined in `lib/schemas/` or `lib/types/`

3. **Async Processing**:
   - Use QStash for job queuing
   - Workers are endpoints in `api/processors/`
   - Event → Service → Queue Job → Worker processes
   - NEVER process synchronously in webhooks

## Service Integrations

### Firebase
- Firestore for database
- Storage for file uploads
- Auth for user management
- Initialize with factory pattern: `getFirebaseApp()`

### Upstash Redis
- REST API (not persistent connection)
- Cache layer for temporary data
- Environment: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### QStash (Job Queue)
- Async job processing
- Workers are endpoints in `api/processors/`
- Automatic retry with exponential backoff
- Environment: `QSTASH_TOKEN`

### MercadoPago
- Payment processing
- Webhook validation with HMAC
- Device ID required for payments
- Environment: `MERCADOPAGO_WEBHOOK_SECRET`

### AWS SES
- Email service
- Region: sa-east-1 (São Paulo)
- Service in `lib/services/notification/email.service.ts`
- Worker endpoint in `api/processors/email-sender.ts`

## Path Aliases

```typescript
@/*      → ./src/*     // Frontend code
@/lib/*  → ./lib/*     // Backend business logic
```

## Important Patterns

### Service Initialization (Serverless)
```typescript
// Factory pattern for stateless functions
export function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp({...});
  }
  return getApps()[0];
}
```

### Data Validation
```typescript
// Always validate with Zod in endpoints
import { CreatePaymentSchema } from '@/lib/types/api.types';
const validated = CreatePaymentSchema.parse(req.body);
```

### Async Job Processing
```typescript
// 1. Receive event
// 2. Validate and process
// 3. Queue job with QStash
// 4. Worker processes asynchronously
```

## Environment Variables

Critical variables managed by Vercel integrations:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

Manual configuration required:
- `VERCEL_URL`
- `FIREBASE_PROJECT_ID`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `AWS_SES_REGION`

## UI Framework

This project uses **shadcn/ui** components with Radix UI primitives and Tailwind CSS. Components are in `src/components/ui/`.

## TypeScript Configuration

- Relaxed strictness for rapid development
- `noImplicitAny: false`
- `strictNullChecks: false`
- Path aliases configured for `@/` and `@/lib/`