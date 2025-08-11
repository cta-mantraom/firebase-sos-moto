# Project Structure

## Root Directory Organization

```
├── src/                    # Frontend React application
├── api/                    # Vercel API routes (TypeScript)
├── supabase/              # Supabase configuration and Edge Functions
├── lib/                   # Shared utilities and configurations
├── public/                # Static assets
└── .kiro/                 # Kiro IDE configuration and steering
```

## Frontend Structure (`src/`)

```
src/
├── components/            # Reusable UI components (shadcn/ui based)
├── pages/                 # Route components
├── hooks/                 # Custom React hooks
├── integrations/          # External service integrations
├── lib/                   # Frontend utilities
├── types/                 # TypeScript type definitions
├── App.tsx               # Main application component
├── main.tsx              # Application entry point
└── index.css             # Global styles
```

## Backend Structure (`functions/`)

```
functions/
├── src/
│   ├── schemas/          # Zod validation schemas
│   ├── webhooks/         # Webhook handlers
│   │   └── mercadopago.ts
│   ├── payments/         # Payment processing
│   │   ├── checkout.ts   # Create payment preference
│   │   └── processor.ts  # Process approved payments
│   ├── emails/           # Email services
│   │   └── sender.ts     # Send confirmation emails
│   ├── utils/            # Utility functions
│   │   └── crypto.ts     # HMAC validation, UUID generation
│   └── index.ts          # Main exports
├── lib/                  # Compiled JavaScript (generated)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
└── .eslintrc.js          # ESLint configuration
```

## Firebase Configuration Files

```
/
├── firebase.json         # Firebase project configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
└── storage.rules         # Storage security rules
```

## API Routes (`api/`)

```
api/
├── check-status.ts       # Health check endpoint
├── create-payment.ts     # Payment creation API
├── get-profile.ts        # Profile retrieval API
└── tsconfig.json        # TypeScript configuration for API
```

## Shared Libraries (`lib/`)

```
lib/
├── config/              # Configuration files
├── services/            # Shared service implementations
├── types/               # Common type definitions
└── utils/               # Utility functions
```

## Key Architectural Patterns

### Firebase Cloud Functions

- All functions exported from single `index.ts` entry point
- Shared code organized in logical directories (schemas, utils, etc.)
- Firestore triggers for reactive processing
- HTTP functions with CORS support for API endpoints

### Type Safety

- Use `unknown` for external data, validate immediately with Zod schemas
- Never use `any` in production code
- All external APIs validated at boundaries

### Service Organization

- External services (MercadoPago, AWS SES, QStash) in `services/external/`
- Internal business logic in `services/internal/`
- Clear separation of concerns

### Frontend Routing

```
/ → Index (landing page)
/create → CreateProfile (user registration)
/success → Success (payment success)
/failure → Failure (payment failure)
/memorial/:id → Memorial (tribute pages)
```

## Critical Rules

### Prohibited Areas

- **NEVER modify anything in `tests/` or `test-integration/` directories**
- **NEVER use `any` type in production code**
- **NEVER use `import_map.json` in Supabase Functions**

### Required Practices

- All Cloud Functions must be TypeScript with strict mode enabled
- Validate all external data with Zod schemas immediately at boundaries
- Use TypeScript path aliases: `@/` for `src/`, `@/lib/` for `lib/`
- Follow modular architecture with clear separation of concerns
- Use Firestore security rules for data access control
