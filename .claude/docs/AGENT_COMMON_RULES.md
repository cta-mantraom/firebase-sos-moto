# 🤖 REGRAS COMUNS PARA TODOS OS AGENTES

## 🔴 REGRAS CRÍTICAS - NUNCA VIOLAR

### **Análise vs Implementação**
- **ANÁLISE**: Criar APENAS documentação em `/docs/`
- **IMPLEMENTAÇÃO**: Criar código SOMENTE com permissão explícita
- **NUNCA** criar código por iniciativa própria

### **TypeScript Strict**
```typescript
// ❌ PROIBIDO
function process(data: any) { }  // NUNCA usar any

// ✅ CORRETO
interface ProcessData { ... }
function process(data: ProcessData) { }
```

### **Ambiente de Produção**
- Sistema REAL com pagamentos REAIS
- **NUNCA** criar mocks ou testes
- **NUNCA** simular funcionalidades
- **SEMPRE** considerar impacto em produção

### **Arquivos State**
```bash
# SEMPRE consultar antes de ação
.claude/state/agent-memory.json     # Estado do sistema
.claude/state/current-session.json  # Sessão atual
.claude/state/sync-todos.json       # TODOs sincronizados
```

---

## ❌ PRÁTICAS PROIBIDAS

### **Código e Arquivos**
- ❌ Criar backups (.bak, .backup, .old)
- ❌ Duplicar código existente
- ❌ Criar logger local (usar centralizado)
- ❌ Usar process.env diretamente
- ❌ Modificar arquitetura DDD existente
- ❌ Usar validateHMACSignature de validation.ts (código morto)

### **Dados e Segurança**
- ❌ Salvar em banco antes do pagamento aprovado
- ❌ Expor secrets em logs
- ❌ Processar CPF (campo removido do sistema)
- ❌ Redirecionar no onSubmit do Payment Brick

### **Desenvolvimento**
- ❌ Usar `any` em TypeScript
- ❌ Chamar APIs externas diretamente
- ❌ Criar services para funcionalidades existentes
- ❌ Processar síncronamente em webhooks

---

## ✅ PRÁTICAS OBRIGATÓRIAS

### **Utilities Centralizadas**
```typescript
// SEMPRE usar utilities existentes
import { logInfo, logError, logWarning } from '@/lib/utils/logger.js';
import { generateUniqueUrl, generateCorrelationId } from '@/lib/utils/ids.js';
import { CreatePaymentSchema, ProfileSchema } from '@/lib/utils/validation.js';
```

### **Configuração Centralizada**
```typescript
// SEMPRE usar config centralizada
import { env, config } from '@/lib/config/env.js';

// NUNCA
process.env.FIREBASE_PROJECT_ID  // ❌

// SEMPRE
config.firebase.projectId         // ✅
```

### **Services Existentes**
- MercadoPago: `MercadoPagoService`
- Firebase: `FirebaseService`  
- Email: `EmailService`
- QStash: `QStashService`

---

## 🏗️ ARQUITETURA IMUTÁVEL

```
lib/
├── domain/      # Entidades e tipos
├── services/    # Lógica de negócio
├── repositories/# Acesso a dados
├── utils/       # Utilities críticas
└── config/      # Configuração centralizada

api/
├── endpoints/   # Vercel Functions
└── processors/  # Jobs assíncronos
```

**NUNCA MODIFICAR ESTA ESTRUTURA**

---

## 🔄 FLUXO DE PAGAMENTO CORRETO

### **❌ ERRADO (Atual)**
1. Payment Brick onSubmit
2. Redireciona IMEDIATAMENTE ← ERRO
3. Webhook processa (desconectado)

### **✅ CORRETO**
1. Payment Brick onSubmit
2. Aguarda confirmação (polling/WebSocket)
3. Webhook valida e atualiza status
4. Frontend detecta aprovação
5. SÓ ENTÃO redireciona

---

## 📊 DADOS DO SISTEMA

### **Campos Removidos**
- `cpf` - NÃO EXISTE MAIS

### **Campos Críticos**
- `bloodType` - Tipo sanguíneo
- `allergies` - Array de alergias
- `medications` - Array de medicamentos
- `emergencyContacts` - Contatos de emergência

### **Planos**
- **Basic**: R$ 5,00 (teste temporário)
- **Premium**: R$ 85,00

---

## 🚨 PROBLEMAS CRÍTICOS ATUAIS

1. **Sistema aceita pagamentos falsos** - Redirecionamento prematuro
2. **PIX não mostra QR Code** - Redireciona antes
3. **validateHMACSignature duplicado** - Usar MercadoPagoService

---

## 📚 DOCUMENTAÇÃO OBRIGATÓRIA

- **Utilities**: `.claude/docs/UTILITIES_REFERENCE.md`
- **Alinhamento**: `.claude/docs/AGENT_ALIGNMENT.md`
- **Fluxo Pagamento**: `/docs/PAYMENT_FLOW_ANALYSIS.md`
- **Sistema**: `/CLAUDE.md`

---

## ✅ CHECKLIST ANTES DE AGIR

- [ ] Consultei `.claude/state/agent-memory.json`
- [ ] Verifiquei se é análise ou implementação
- [ ] Usei utilities centralizadas
- [ ] Não criei código duplicado
- [ ] Não usei `any` em TypeScript
- [ ] Não salvei antes da aprovação do pagamento
- [ ] Incluí correlationId nos logs
- [ ] Usei config centralizada (não process.env)

---

*Documento de regras comuns - TODOS os agentes devem seguir*
*Última atualização: 22/01/2025*
*Status: CRÍTICO - Leitura obrigatória*
