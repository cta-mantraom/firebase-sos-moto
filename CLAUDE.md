# SOS Moto - Sistema de Emergência Médica para Motociclistas

## 🎯 REGRAS FUNDAMENTAIS CLAUDE CODE

### **FILOSOFIA: TRABALHAR COM A ARQUITETURA EXISTENTE**

Este projeto **JÁ TEM** uma arquitetura Domain-Driven Design EXCELENTE implementada. 

**🚨 CRÍTICO: NUNCA recriar ou duplicar estruturas existentes!**

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

### **Fluxo de Pagamento SOS Moto**
1. **Frontend**: Device ID → Payment Brick → Create Payment
2. **Backend**: Validate → Create Preference → Return to Frontend  
3. **Webhook**: HMAC → Log → Enqueue Job (assíncrono)
4. **Processor**: Create Profile → Generate QR → Send Email

### **Dados Médicos Críticos**
- **Tipo sanguíneo** (select A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Alergias** (array de strings, validação Zod)
- **Medicamentos** (array de strings, validação Zod)
- **Condições médicas** (array de strings, validação Zod)
- **Contatos de emergência** (array de objetos validados)

### **Planos SOS Moto**
- **Basic**: R$ 55,00 (validado no código)
- **Premium**: R$ 85,00 (validado no código)

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
- ✅ Usar TypeScript strict (quando corrigido)

### **NUNCA**
- ❌ Chamar APIs externas diretamente
- ❌ Criar novos services para funcionalidades existentes
- ❌ Modificar arquitetura Domain/Repository/Service
- ❌ Processar síncronamente em webhooks
- ❌ Expor secrets em logs ou console

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
- MercadoPago com Device ID + HMAC
- Firebase Factory Pattern
- Async processing (QStash)
- Structured logging
- Zod validation
- Serverless architecture

### **⚠️ Melhorias Necessárias**
- TypeScript strictness
- Code validation hooks
- Secrets scanning

### **🎯 Meta**
Claude Code trabalhando **COM** esta arquitetura excelente, potencializando-a sem destruí-la.

---

**🚀 Esta é uma arquitetura de PRODUÇÃO que funciona. Respeite-a e melhore-a.**