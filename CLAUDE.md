# SOS Moto - Sistema de Emergência Médica para Motociclistas

## 🎯 REGRAS FUNDAMENTAIS CLAUDE CODE

### **FILOSOFIA: TRABALHAR COM A ARQUITETURA EXISTENTE**

Este projeto **JÁ TEM** uma arquitetura Domain-Driven Design EXCELENTE implementada. 

**🚨 CRÍTICO: NUNCA recriar ou duplicar estruturas existentes!**

### **🔴 REGRAS DE DESENVOLVIMENTO - PRODUÇÃO**

#### **ESCOPO DE ATUAÇÃO**
- ✅ **ANÁLISE E DOCUMENTAÇÃO**: Quando solicitado análise, criar apenas documentos
- ✅ **IMPLEMENTAÇÃO**: Criar código SOMENTE quando explicitamente solicitado
- ❌ **NUNCA criar código sem solicitação explícita do usuário**
- ❌ **NUNCA implementar testes/mocks em código de produção**
- ❌ **NUNCA simular funcionalidades - tudo deve ser real**

#### **TYPESCRIPT STRICT**
- ❌ **PROIBIDO usar `any`** - sempre tipar corretamente
- ✅ Usar tipos específicos, interfaces e generics
- ✅ Habilitar `noImplicitAny: true` quando corrigir tsconfig
- ✅ Sempre validar com `npm run type-check`

---

## 📁 ARQUITETURA ATUAL (NÃO MODIFICAR)

### **Domain Layer** ✅ PERFEITO
```
lib/domain/
├── payment/        # Payment entities, types, validators
├── profile/        # Profile entities, types, validators  
└── notification/   # Email entities, types
```

### **Service Layer** ✅ PERFEITO
```
lib/services/
├── payment/mercadopago.service.ts    # MercadoPago SDK wrapper
├── profile/profile.service.ts        # Profile business logic
├── notification/email.service.ts     # AWS SES integration
├── queue/qstash.service.ts          # QStash async processing
└── firebase.ts                     # Firebase REST API
```

### **Repository Layer** ✅ PERFEITO
```
lib/repositories/
├── payment.repository.ts    # Payment data access
└── profile.repository.ts    # Profile data access
```

### **API Layer** ✅ PERFEITO
```
api/
├── create-payment.ts       # Payment creation endpoint
├── mercadopago-webhook.ts  # Webhook handler (HMAC + async)
├── get-profile.ts         # Profile retrieval
└── processors/            # Async job processors
```

### **Utilities Layer** 🔧 CRÍTICO (Não Documentado)
```
lib/utils/
├── logger.ts              # Structured logging com mascaramento LGPD
├── ids.ts                 # Geração de IDs únicos (10+ arquivos dependem)
└── validation.ts          # Schemas Zod e transformações
```

### **Configuration Layer** ✅ CENTRALIZADO
```
lib/config/
└── env.ts                  # Centralized environment config with Zod validation
```

---

## 🔧 UTILITIES CRÍTICAS (DESCOBERTAS NA ANÁLISE)

### **Logger com Mascaramento LGPD Automático**
```typescript
// lib/utils/logger.ts
// AUTOMATICAMENTE mascara campos sensíveis:
const SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'email', 'phone',
    'credit_card', 'api_key', 'webhook_secret'
];
// Resultado: {"email": "***MASKED***"}

// Funções disponíveis:
logInfo(message, data?)    // Logs informativos
logError(message, error?, data?)  // Erros com stack trace
logWarning(message, data?)  // Avisos (usado em 13 arquivos!)
```

### **Geração de IDs Específicos (10+ arquivos dependem)**
```typescript
// lib/utils/ids.ts
generateUniqueUrl()    // URLs públicas (12 chars, sem hífens)
generateCorrelationId() // req_timestamp_random para rastreamento
generatePaymentId()    // payment_timestamp_uuid para pagamentos
generateProfileId()    // profile_uuid completo
```

### **Validação e Schemas**
```typescript
// lib/utils/validation.ts
CreatePaymentSchema    // 25+ campos validados
ProfileSchema         // Schema do perfil médico
transformApiToProfile() // Transforma dados da API para banco
// ⚠️ ATENÇÃO: validateHMACSignature() é código morto (usar MercadoPagoService)
```

---

## 🔐 CONFIGURAÇÃO CENTRALIZADA DE VARIÁVEIS DE AMBIENTE

### **Arquitetura de Configuração**
- ✅ **Single Source of Truth**: `/lib/config/env.ts` centraliza TODAS as variáveis
- ✅ **Validação Zod**: Type safety e validação em runtime
- ✅ **Organização por Domínio**: Estrutura semântica (`config.firebase`, `config.email`, etc.)
- ✅ **Fallbacks Inteligentes**: Valores padrão para produção

### **Como Usar**
```typescript
// Import centralizado
import { env, config } from '@/lib/config/env.js';

// Uso direto (flat structure)
env.FIREBASE_PROJECT_ID
env.NODE_ENV

// Uso semântico (domain-organized)
config.firebase.projectId
config.mercadopago.accessToken
config.email.aws.region
config.redis.url
config.app.frontendUrl
```

### **Variáveis Organizadas por Domínio**
- **Firebase**: `config.firebase.*` (projectId, clientEmail, privateKey, storageBucket)
- **MercadoPago**: `config.mercadopago.*` (accessToken, webhookSecret, publicKey)
- **Email/AWS SES**: `config.email.aws.*` (region, accessKeyId, fromEmail, replyTo)
- **Redis/Upstash**: `config.redis.*` (url, token)
- **Application**: `config.app.*` (frontendUrl, backendUrl, environment, isProduction)

### **🚨 NUNCA**
- ❌ Usar `process.env.VARIABLE` diretamente
- ❌ Adicionar variáveis sem validação Zod
- ❌ Duplicar configurações em múltiplos arquivos

---

## 🛡️ REGRAS DE DESENVOLVIMENTO

### **1. MercadoPago - JÁ IMPLEMENTADO PERFEITAMENTE**
- ✅ **Device ID** coletado no frontend (CRÍTICO para aprovação)
- ✅ **HMAC validation** no webhook  
- ✅ **Service layer** com validation Zod
- ✅ **Processamento assíncrono** via QStash
- ✅ **Error handling** robusto

**🚨 NUNCA chamar API MercadoPago direta - SEMPRE usar MercadoPagoService**

### **2. Firebase - Factory Pattern Implementado**
- ✅ **REST API** (não Admin SDK) para Edge Functions
- ✅ **Factory Pattern** no webhook
- ✅ **Structured logging** com correlation IDs

**🚨 SEMPRE usar FirebaseService, NUNCA chamar REST API direta**

### **3. TypeScript - Melhorias Necessárias**
- ⚠️ **noImplicitAny: false** → deve ser **true**
- ⚠️ **strictNullChecks: false** → deve ser **true**
- ✅ **Zod validation** já implementada em todos os endpoints

### **4. Serverless Architecture - Vercel Functions**
- ✅ **Event-driven pattern** implementado
- ✅ **Async processing** via QStash
- ✅ **30s timeout** configurado

---

## 🎯 FUNCIONALIDADES CRÍTICAS

### **🔴 PROBLEMA CRÍTICO ATUAL: Sistema Aceita Pagamentos Falsos**
- **Status**: CRÍTICO - Redirecionamento prematuro no onSubmit
- **Impacto**: Fraude facilitada, perda de receita, risco legal
- **Documentação Completa**: `/docs/PAYMENT_FLOW_ANALYSIS.md`

### **Fluxo de Pagamento ATUAL (Problemático)**
1. **Frontend**: Device ID → Payment Brick → onSubmit
2. **❌ ERRO**: Redireciona IMEDIATAMENTE para /success
3. **Backend**: Webhook processa (desconectado do frontend)
4. **Problema**: Usuário vê sucesso sem pagamento real

### **Fluxo CORRETO (A Implementar)**
1. **Frontend**: Device ID → Payment Brick → Aguarda confirmação
2. **Backend**: Webhook valida → Status = approved
3. **Frontend**: Polling/WebSocket → Detecta aprovação
4. **SÓ ENTÃO**: Redireciona para /success

### **Dados Médicos Críticos**
- **Tipo sanguíneo** (select A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Alergias** (array de strings, validação Zod)
- **Medicamentos** (array de strings, validação Zod)
- **Condições médicas** (array de strings, validação Zod)
- **Contatos de emergência** (array de objetos validados)

### **Planos SOS Moto**
- **Basic**: R$ 5,00 (**TESTE TEMPORÁRIO** - produção final: R$ 55,00)
- **Premium**: R$ 85,00 (validado no código)
- **Nota**: Valor R$ 5 é intencional para testes com pagamento real

---

## 🔧 CONFIGURAÇÕES CLAUDE CODE

### **Permissões Adequadas**
```json
"allow": [
  "Edit", "MultiEdit", "Write", "Read", "Task",
  "Bash(npm:*)", "Bash(git:*)", "Bash(vercel:*)",
  "Bash(npx tsc:*)", "Bash(eslint:*)"
]
```

### **Negadas por Segurança**
```json
"deny": [
  "Read(./.env*)", "Read(./firebase-config.json)", 
  "Read(./mercadopago-keys.*)", "Bash(curl:*)", "Bash(rm:*)"
]
```

---

## 📝 COMANDOS ESSENCIAIS

### **Development**
```bash
npm run dev          # Desenvolvimento local
npm run build        # Build para produção
npm run type-check   # Verificação TypeScript
npm run lint         # ESLint check
```

### **Deploy**
```bash
vercel --prod=false  # Deploy preview
vercel --prod        # Deploy produção (cuidado!)
```

### **Validation**
```bash
npx tsc --noEmit     # Type check manual
npm run build        # Verifica build serverless
```

---

## 🚨 PRÁTICAS OBRIGATÓRIAS

### **SEMPRE**
- ✅ Usar services existentes (MercadoPagoService, FirebaseService)
- ✅ Validar dados com schemas Zod existentes
- ✅ Incluir correlation IDs em logs
- ✅ Tratar erros com try/catch
- ✅ Usar TypeScript strict - **NUNCA usar `any`**
- ✅ Desenvolver para **PRODUÇÃO REAL** (não criar mocks/testes)
- ✅ Aguardar aprovação antes de interagir com banco de dados

### **NUNCA**
- ❌ Chamar APIs externas diretamente
- ❌ Criar novos services para funcionalidades existentes
- ❌ Modificar arquitetura Domain/Repository/Service
- ❌ Processar síncronamente em webhooks
- ❌ Expor secrets em logs ou console
- ❌ **Criar código sem solicitação explícita**
- ❌ **Usar `any` em TypeScript**
- ❌ **Criar código de teste/mock em produção**
- ❌ **Salvar em banco antes do pagamento ser aprovado**
- ❌ **Redirecionar no onSubmit do Payment Brick**

---

## 🏥 CONTEXTO MÉDICO EMERGENCIAL

### **Prioridade de Informações**
1. **Crítico**: Tipo sanguíneo, alergias principais
2. **Importante**: Medicamentos, condições crônicas  
3. **Complementar**: Contatos, plano de saúde

### **Interface de Emergência**
- **Responsivo mobile** (socorristas usam smartphones)
- **Alto contraste** para visibilidade
- **Touch-friendly** (botões grandes)
- **Carregamento < 2s** (vida ou morte)

---

## 📊 STATUS ATUAL

### **✅ Implementado e Funcionando**
- Domain-driven architecture
- **Configuração centralizada** com validação Zod (100% migrado)
- MercadoPago com Device ID + HMAC
- Firebase Factory Pattern
- Async processing (QStash)
- **Structured logging com mascaramento LGPD automático**
- Zod validation em todas as camadas
- Serverless architecture
- **Type Safety completo** para environment variables
- **Single Source of Truth** para configurações
- **Geração de IDs específicos** por tipo de entidade

### **✅ Melhorias Implementadas (2025-08-22)**
- ✅ **Migração completa** para `/lib/config/env.ts`
- ✅ **Eliminação** de todos `process.env` diretos
- ✅ **Organização semântica** por domínio
- ✅ **Fallbacks inteligentes** para produção
- ✅ **Correção do erro Vercel** PropertyAccessExpression

### **🔴 Problemas CRÍTICOS a Corrigir**
- **Redirecionamento prematuro**: Sistema aceita pagamentos falsos
- **validateHMACSignature duplicado**: Código morto em validation.ts
- **PIX quebrado**: QR Code não é mostrado antes do redirect

### **⚠️ Melhorias Necessárias**
- TypeScript strictness (noImplicitAny, strictNullChecks)
- Implementar polling/WebSocket para status de pagamento
- Documentar todas as utilities críticas
- Remover código morto (validateHMACSignature, transformApiToProfile)

### **🎯 Meta**
Claude Code trabalhando **COM** esta arquitetura excelente, potencializando-a sem destruí-la.

---

**🚀 Esta é uma arquitetura de PRODUÇÃO que funciona. Respeite-a e melhore-a.**