# Technology Stack

## Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin for fast compilation
- **Routing**: React Router DOM v6
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner for toast notifications
- **Payment Integration**: MercadoPago SDK React (`@mercadopago/sdk-react`: ^1.0.4) with Payment Brick

## Backend/API

- **Runtime**: Vercel serverless functions with Node.js
- **Database**: Firebase Firestore (South America East region)
- **Storage**: Firebase Storage
- **Authentication**: Firebase Admin SDK
- **Payment Processing**: MercadoPago SDK (`mercadopago`: ^2.8.0)
- **Validation**: Zod schemas for type-safe validation (`zod`: ^3.23.8)
- **Queue/Webhooks**: Upstash QStash and Redis for background processing
- **Email Service**: AWS SES v2 (`@aws-sdk/client-sesv2`: ^3.849.0)
- **QR Code Generation**: `qrcode`: ^1.5.4 + `qrcode.react`: ^4.2.0
- **ID Generation**: `uuid`: ^11.1.0

## Development Tools

- **Package Manager**: npm (with bun.lockb present, but npm scripts used)
- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript with relaxed settings (noImplicitAny: false)
- **Component Development**: Lovable Tagger for development mode

## Deployment & Infrastructure

- **Frontend Hosting**: Vercel with SPA routing configuration
- **API Functions**: Vercel serverless functions (30s max duration)
- **Database**: Firebase Firestore with custom rules and indexes
- **CDN**: Vercel edge network
- **Environment**: Multi-environment support (development/production)

## Common Commands

### Development

```bash
npm run dev          # Start development server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Key Configuration Files

- `vite.config.ts` - Build configuration with path aliases
- `tailwind.config.ts` - Design system and component styling
- `components.json` - shadcn/ui configuration
- `firebase.json` - Firebase services configuration
- `vercel.json` - Deployment and API routing configuration
