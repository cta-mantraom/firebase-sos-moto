# 🤖 REGRAS COMUNS PARA TODOS OS AGENTES

## 🔴 REGRAS CRÍTICAS - NUNCA VIOLAR

### **Análise vs Implementação**
- **ANÁLISE**: Criar APENAS documentação em `/docs/`
- **IMPLEMENTAÇÃO**: Criar código SOMENTE com permissão explícita
- **NUNCA** criar código por iniciativa própria

### **TypeScript Strict - NUNCA usar `any`**
```typescript
// ❌ PROIBIDO - VULNERABILIDADE
function process(data: any) { }  // NUNCA usar any
const result = data as PaymentType; // Cast direto PROIBIDO

// ✅ CORRETO - SEMPRE validar unknown
function process(data: unknown): ProcessData {
  const validated = DataSchema.safeParse(data);
  if (!validated.success) {
    throw new ValidationError(validated.error);
  }
  return validated.data; // 100% type safe
}
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
- ❌ Criar endpoints duplicados (check-status.ts vs check-payment-status.ts)
- ❌ Criar logger local (usar centralizado)
- ❌ Usar process.env diretamente
- ❌ Modificar arquitetura DDD existente
- ❌ Usar validateHMACSignature de validation.ts (ARQUIVO DELETADO)
- ❌ Usar lib/config/env.ts (ARQUIVO DELETADO)
- ❌ Usar lib/utils/validation.ts (ARQUIVO DELETADO)
- ❌ Usar lib/types/api.types.ts (ARQUIVO DELETADO)
- ❌ Usar lib/services/payment/payment.processor.ts (ARQUIVO DELETADO)
- ❌ Usar api/check-payment-status.ts (DUPLICADO - usar check-status.ts)

### **Dados e Segurança**
- ❌ Salvar em banco antes do pagamento aprovado
- ❌ Expor secrets em logs
- ❌ Processar CPF (campo removido do sistema)
- ❌ Redirecionar no onSubmit do Payment Brick
- ❌ Salvar dados sensíveis em cache local por mais de 1h
- ❌ Processar mesmo paymentId múltiplas vezes (duplicação)
- ❌ Criar perfil antes da aprovação do pagamento
- ❌ Acessar Firestore diretamente sem usar Repository Pattern

### **Desenvolvimento**
- ❌ Usar `any` em TypeScript
- ❌ Chamar APIs externas diretamente
- ❌ Criar services para funcionalidades existentes
- ❌ Processar síncronamente em webhooks
- ❌ Ignorar Repository Pattern (SEMPRE usar PaymentRepository/ProfileRepository)
- ❌ Modal de aguardo aparecer tarde demais (deve ser IMEDIATO)

---

## ✅ PRÁTICAS OBRIGATÓRIAS

### **Utilities Centralizadas**
```typescript
// SEMPRE usar utilities existentes
import { logInfo, logError, logWarning } from '@/lib/utils/logger.js';
import { generateUniqueUrl, generateCorrelationId } from '@/lib/utils/ids.js';

// ❌ DELETADO - NÃO USAR MAIS
// import { CreatePaymentSchema } from '@/lib/utils/validation.js'; // ARQUIVO DELETADO

// ✅ USAR - Domain validators
import { CreatePaymentValidator } from '@/lib/domain/payment/payment.validators';
import { ProfileValidator } from '@/lib/domain/profile/profile.validators';
```

### **Configuração com Lazy Loading**
```typescript
// ❌ DELETADO - NÃO USAR MAIS
// import { env, config } from '@/lib/config/env.js'; // ARQUIVO DELETADO

// ✅ USAR - Lazy loading com Singleton Pattern
import { getPaymentConfig } from '@/lib/config/contexts/payment.config';
import { getEmailConfig } from '@/lib/config/contexts/email.config';
import { getFirebaseConfig } from '@/lib/config/contexts/firebase.config';
import { getRedisConfig } from '@/lib/config/contexts/redis.config';
import { getAppConfig } from '@/lib/config/contexts/app.config';

// NUNCA
process.env.FIREBASE_PROJECT_ID  // ❌

// SEMPRE
const firebaseConfig = getFirebaseConfig();
firebaseConfig.projectId         // ✅
```

### **Services e Repositories Existentes**
- MercadoPago: `MercadoPagoService`
- Firebase: `FirebaseService`  
- Email: `EmailService`
- QStash: `QStashService`
- **SEMPRE USAR**:
  - `PaymentRepository` para acessar dados de pagamento
  - `ProfileRepository` para acessar dados de perfil
  - **NUNCA** acessar Firestore diretamente

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

## 🚨 PROBLEMAS CRÍTICOS DESCOBERTOS

1. **Sistema aceita pagamentos falsos** - Redirecionamento prematuro
2. **PIX não mostra QR Code** - Redireciona antes
3. **Duplicação de endpoints** - check-status.ts vs check-payment-status.ts
4. **Repository Pattern ignorado** - Acesso direto ao Firestore
5. **Cache local perigoso** - 24 horas de dados sensíveis
6. **Modal aparece tarde** - Usuário pode fechar antes
7. **Sem verificação de duplicação** - Mesmo pagamento processado múltiplas vezes
8. **Perfil criado antes da aprovação** - Lixo no banco se falhar
9. **Webhook pode não ser chamado** - notification_url pode falhar

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
- [ ] Não criei endpoints duplicados
- [ ] Não usei `any` em TypeScript
- [ ] Não salvei antes da aprovação do pagamento
- [ ] Incluí correlationId nos logs
- [ ] Usei config centralizada (não process.env)
- [ ] Usei Repository Pattern (NUNCA Firestore direto)
- [ ] Verifiquei duplicação de pagamento antes de processar
- [ ] Modal de aguardo aparece IMEDIATAMENTE
- [ ] Cache local tem expiração máxima de 1 hora
- [ ] Perfil criado APENAS após aprovação confirmada

---

*Documento de regras comuns - TODOS os agentes devem seguir*
*Última atualização: 22/01/2025*
*Status: CRÍTICO - Leitura obrigatória*
