# Technology Stack

## Frontend

- **Vite** - Build tool and development server
- **React 18** - Frontend framework with TypeScript
- **TypeScript** - Primary language with strict typing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern React component library built on Radix UI
- **React Router** - Client-side routing
- **React Query (@tanstack/react-query)** - Server state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation library
- **@mercadopago/sdk-react** - Official MercadoPago React SDK

## Backend & Infrastructure

- **Firebase** - Backend-as-a-Service platform
  - **Firestore** - NoSQL document database
  - **Cloud Functions** - Serverless functions running on Node.js
  - **Firebase Storage** - File storage service
  - **Firebase Hosting** - Web hosting service
- **Node.js** - Runtime for Cloud Functions
- **TypeScript** - Type-safe development

## External Services

- **MercadoPago** - Payment processing for Brazilian market
- **AWS SES** - Email service for notifications
- **QRCode** - QR code generation

## Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vercel** - Deployment platform

## Common Commands

### Development

```bash
# Frontend
npm run dev          # Start development server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Firebase Functions
cd functions
npm run build        # Build TypeScript
npm run serve        # Serve functions locally
npm run deploy       # Deploy to Firebase
npm run logs         # View function logs

# Environment Variables (NEW METHOD - post 2025)
# Create .env file in functions/ directory with variables
# DO NOT use: firebase functions:config:set (deprecated!)
```

### Firebase Local Development

```bash
firebase init        # Initialize Firebase project
firebase serve       # Serve locally
firebase deploy      # Deploy all services
firebase deploy --only hosting     # Deploy hosting only
firebase deploy --only functions   # Deploy functions only
firebase deploy --only firestore   # Deploy Firestore rules
firebase emulators:start           # Start all emulators

# Environment Setup (IMPORTANT!)
cd functions
cp .env.example .env  # Copy template
# Edit .env with your actual values
# NEVER commit .env file!
```

## Key Dependencies

- **firebase** - Firebase SDK for web
- **firebase-admin** - Firebase Admin SDK
- **firebase-functions** - Cloud Functions framework
- **@mercadopago/sdk-react** - MercadoPago React SDK
- **mercadopago** - MercadoPago Node.js SDK
- **@aws-sdk/client-sesv2** - AWS SES client
- **qrcode.react** - QR code generation
- **uuid** - UUID generation
- **date-fns** - Date utilities
- **zod** - Schema validation

## Production Configuration

### Environment Variables
⚠️ **CRITICAL**: `functions.config()` is deprecated and will stop working after Dec 31, 2025.

Use `.env` files in `functions/` directory:
```env
MERCADOPAGO_ACCESS_TOKEN=your_token
MERCADOPAGO_WEBHOOK_SECRET=your_secret
AWS_SES_ACCESS_KEY_ID=your_key_id  # Note: _ID suffix required!
AWS_SES_SECRET_ACCESS_KEY=your_secret
AWS_SES_REGION=sa-east-1
SES_FROM_EMAIL=contact@memoryys.com
FRONTEND_URL=https://memoryys.com
```

### Production URLs
- **Domain**: https://memoryys.com
- **Email**: contact@memoryys.com
- **Staging**: https://moto-sos-guardian-app-78272.web.app
- **Functions**: https://southamerica-east1-moto-sos-guardian-app-78272.cloudfunctions.net
