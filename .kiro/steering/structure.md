# Project Structure

## Root Directory Organization

### Configuration Files

- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration with path aliases
- `vite.config.ts` - Build tool configuration
- `tailwind.config.ts` - Design system configuration
- `components.json` - shadcn/ui component configuration
- `firebase.json` - Firebase services setup
- `vercel.json` - Deployment and API routing
- `.env.local` - Environment variables (not committed)

### Source Code Structure

#### `/src` - Frontend Application

- `main.tsx` - Application entry point
- `App.tsx` - Root component with routing and providers
- `index.css` - Global styles and CSS variables
- `/components` - Reusable UI components
- `/pages` - Route components (Index, CreateProfile, Success, Failure, Memorial, NotFound)
- `/hooks` - Custom React hooks
- `/lib` - Frontend utilities and configurations
- `/schemas` - Frontend validation schemas
- `/types` - TypeScript type definitions

#### `/api` - Backend API Functions

- `create-payment.ts` - Payment creation endpoint
- `mercadopago-webhook.ts` - Payment webhook handler
- `get-profile.ts` - Profile retrieval endpoint
- `check-status.ts` - Status checking endpoint
- `/processors` - Background job processors
- `tsconfig.json` - API-specific TypeScript config

#### `/lib` - Shared Backend Logic

- `/config` - Configuration utilities
- `/domain` - Business logic and domain models
- `/repositories` - Data access layer
- `/schemas` - Validation schemas
- `/services` - External service integrations
- `/types` - Shared type definitions
- `/utils` - Utility functions and helpers

### Path Aliases

- `@/*` - Maps to `./src/*`
- `@/lib/*` - Maps to `./lib/*`

## Architectural Patterns

### Frontend Architecture

- **Component-based**: React components with TypeScript
- **Route-based pages**: Each route has its own page component
- **Shared UI components**: Reusable components in `/src/components`
- **Custom hooks**: Business logic abstracted into hooks
- **Form validation**: React Hook Form + Zod schemas

### Backend Architecture

- **Serverless functions**: Each API endpoint is a separate function
- **Shared libraries**: Common logic in `/lib` directory
- **Repository pattern**: Data access abstracted in repositories
- **Service layer**: External integrations in services
- **Domain-driven**: Business logic organized by domain

### Data Flow

1. Frontend forms collect user data
2. API functions validate and process requests
3. Data stored in Firebase Firestore
4. Background processors handle async operations
5. Webhooks update payment status

## File Naming Conventions

- **Components**: PascalCase (e.g., `CreateProfile.tsx`)
- **API functions**: kebab-case (e.g., `create-payment.ts`)
- **Utilities**: camelCase (e.g., `logger.ts`)
- **Types**: PascalCase interfaces/types
- **Constants**: UPPER_SNAKE_CASE
