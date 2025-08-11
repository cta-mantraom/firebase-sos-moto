# 🔄 Guia de Migração: Supabase → Firebase

## ✅ Status da Migração

### Concluído
- ✅ Instalação das dependências Firebase e MercadoPago SDK React
- ✅ Configuração do Firebase (Firestore, Functions, Storage, Hosting)
- ✅ Criação das Cloud Functions em TypeScript
- ✅ Remoção completa do código Supabase
- ✅ Integração do MercadoPago SDK React
- ✅ Schemas de validação com Zod
- ✅ Atualização da documentação de steering

### Estrutura Criada

```
├── firebase.json          # Configuração do Firebase
├── firestore.rules        # Regras de segurança Firestore
├── firestore.indexes.json # Índices do Firestore
├── storage.rules          # Regras do Storage
├── functions/             # Cloud Functions
│   ├── src/
│   │   ├── webhooks/      # Webhook MercadoPago
│   │   ├── payments/      # Processamento de pagamentos
│   │   ├── emails/        # Envio de emails
│   │   └── schemas/       # Validação com Zod
│   └── package.json
└── src/
    ├── lib/
    │   ├── firebase.ts    # Configuração Firebase
    │   └── mercadopago.ts # SDK MercadoPago
    ├── components/
    │   └── MercadoPagoCheckout.tsx
    └── hooks/
        └── useFirebase.ts
```

## 🚀 Configuração do Projeto

### 1. Criar Projeto no Firebase Console

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env.local`:

```env
# Firebase
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id

# MercadoPago
VITE_MERCADOPAGO_PUBLIC_KEY=sua-public-key

# URLs
VITE_FRONTEND_URL=http://localhost:8080
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_FUNCTIONS_URL=https://us-central1-seu-projeto.cloudfunctions.net
```

### 3. Configurar Firebase Functions

```bash
cd functions

# Configurar variáveis no Firebase
firebase functions:config:set \
  mercadopago.access_token="seu-token" \
  mercadopago.webhook_secret="seu-secret" \
  aws.ses.access_key="sua-key" \
  aws.ses.secret_key="seu-secret" \
  aws.ses.region="sa-east-1" \
  email.from="contact@seudominio.com" \
  frontend.url="https://seudominio.com"

# Instalar dependências
npm install

# Build
npm run build
```

### 4. Deploy

```bash
# Deploy completo
firebase deploy

# Deploy específico
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

## 🔑 Configuração MercadoPago

### 1. Obter Credenciais
- Acesse: https://www.mercadopago.com.br/developers/panel
- Crie uma aplicação
- Copie a Public Key e Access Token

### 2. Configurar Webhook
- URL do webhook: `https://us-central1-seu-projeto.cloudfunctions.net/handleMercadoPagoWebhook`
- Eventos: `payment.updated`

## 📝 Principais Mudanças

### Database
| Supabase (PostgreSQL) | Firebase (Firestore) |
|----------------------|---------------------|
| `user_profiles` table | `user_profiles` collection |
| `payments_log` table | `payments_log` collection |
| SQL queries | NoSQL queries |
| Row Level Security | Security Rules |

### Functions
| Supabase Edge Functions | Firebase Cloud Functions |
|------------------------|-------------------------|
| Deno runtime | Node.js runtime |
| TypeScript nativo | TypeScript compilado |
| import_map.json | package.json |

### Frontend
| Antes | Depois |
|-------|--------|
| `@supabase/supabase-js` | `firebase` SDK |
| Supabase client | Firebase client |
| API calls to Edge Functions | Direct Firebase Functions calls |
| Manual MercadoPago integration | `@mercadopago/sdk-react` |

## 🎯 Benefícios da Migração

1. **MercadoPago SDK React**: Componentes prontos e otimizados
2. **Melhor performance**: Menos latência com SDK direto
3. **Custos reduzidos**: Free tier generoso do Firebase
4. **Desenvolvimento mais rápido**: SDKs maduros e documentação extensa
5. **Escalabilidade automática**: Google Cloud infrastructure

## ⚠️ Importante

- Todas as regras de segurança foram configuradas em `firestore.rules`
- HMAC validation implementada no webhook
- Validação com Zod em todos os pontos de entrada
- Não usar `any` em produção (usar `unknown` + validação)

## 📚 Documentação

- [Firebase Documentation](https://firebase.google.com/docs)
- [MercadoPago SDK React](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/web-react)
- [Cloud Functions](https://firebase.google.com/docs/functions)