● 🏗️ ARQUITETURA IDEAL - FLUXO MERCADOPAGO CORRIGIDO

🎯 VISÃO EXECUTIVA: FERRARI FUNCIONANDO CORRETAMENTE

PRINCÍPIO FUNDAMENTAL

"Use a Ferrari como Ferrari, não como carrinho de mão"

Temos uma excelente arquitetura DDD que está sendo sabotada por duplicações. A solução é SIMPLES: deletar duplicações e usar o que já temos corretamente.

---

📁 1. ARQUIVOS PARA DELETAR (Código Morto e Duplicações)

🗑️ DELETAR IMEDIATAMENTE:

❌ lib/services/payment/payment.processor.ts (430 linhas - NUNCA USADO)
❌ lib/utils/validation.ts (131 linhas - DUPLICA domain)
❌ lib/types/api.types.ts (139 linhas - 95% DUPLICADO)
❌ lib/types/index.ts (Conflitos de naming)
❌ lib/domain/payment/payment.repository.interface.ts (57 linhas - NÃO IMPLEMENTADO)

📊 IMPACTO DA DELEÇÃO:

- -757 linhas de código duplicado/morto
- -3 pontos de manutenção
- -111 vulnerabilidades de unknown
- +100% clareza arquitetural

---

✅ 2. ARQUITETURA LIMPA - O QUE USAR

🏛️ ESTRUTURA CORRETA DO FLUXO DE PAGAMENTO

📁 lib/domain/payment/ ← FERRARI (USAR 100%)
├── payment.entity.ts ← 20+ métodos ricos
├── payment.types.ts ← Types centralizados
└── payment.validators.ts ← Validação Zod única

📁 lib/domain/profile/ ← DOMÍNIO MÉDICO
├── profile.entity.ts ← Lógica médica
├── profile.types.ts ← Types médicos
└── profile.validators.ts ← Validação médica

📁 lib/services/ ← SERVIÇOS EXTERNOS
└── payment/
└── mercadopago.service.ts ← Encapsula API MP (MANTER)

📁 lib/repositories/ ← SIMPLIFICAR
├── payment.repository.ts ← Implementar APENAS interface
└── profile.repository.ts ← Implementar APENAS interface

📁 api/ ← ENDPOINTS LIMPOS
├── create-payment.ts ← Usa domain validators
├── mercadopago-webhook.ts ← Usa Payment entity
└── processors/
└── final-processor.ts ← Usa entities corretas

---

🔄 3. FLUXO CORRETO DE PAGAMENTO

FASE 1: CRIAÇÃO DO PAGAMENTO

// api/create-payment.ts
import { CreatePaymentValidator } from '@/lib/domain/payment/payment.validators';
import { Payment } from '@/lib/domain/payment/payment.entity';
import { Profile } from '@/lib/domain/profile/profile.entity';

// 1. Validar entrada com domain validator
const validatedData = CreatePaymentValidator.parse(req.body);

// 2. Criar entities do domínio
const profile = Profile.createPending(validatedData);
const payment = Payment.createFromPreference(validatedData);

// 3. Usar service para API externa
const preference = await mercadoPagoService.createPreference(payment.toMercadoPagoFormat());

// 4. Persistir via repository
await profileRepository.save(profile);
await paymentRepository.save(payment);

FASE 2: WEBHOOK PROCESSING

// api/mercadopago-webhook.ts
import { MercadoPagoWebhookValidator } from '@/lib/domain/payment/payment.validators';
import { Payment } from '@/lib/domain/payment/payment.entity';

// 1. Validar webhook com domain validator
const webhookData = MercadoPagoWebhookValidator.parse(req.body);

// 2. Validar HMAC
const isValid = await mercadoPagoService.validateWebhook(signature, requestId, dataId);

// 3. Buscar payment e atualizar via entity
const payment = await paymentRepository.findByExternalId(webhookData.data.id);
payment.updateFromMercadoPago(webhookData);

// 4. Business logic na entity
if (payment.isApproved()) {
await queueService.enqueueProfileActivation(payment.profileId);
}

// 5. Persistir mudanças
await paymentRepository.update(payment);

FASE 3: FINAL PROCESSING

// api/processors/final-processor.ts
import { Payment } from '@/lib/domain/payment/payment.entity';
import { Profile } from '@/lib/domain/profile/profile.entity';

// 1. Buscar entities
const payment = await paymentRepository.findById(jobData.paymentId);
const profile = await profileRepository.findById(jobData.profileId);

// 2. Business logic nas entities
payment.linkToProfile(profile.id);
profile.activate();

// 3. Gerar dados médicos via entity
const qrCodeData = profile.getEmergencyData();
const memorialData = profile.getMemorialData();

// 4. Persistir
await paymentRepository.update(payment);
await profileRepository.update(profile);

---

🏗️ 4. CORREÇÕES ESPECÍFICAS

A. REPOSITORY CORRETO

// lib/repositories/payment.repository.ts
export class PaymentRepository {
// APENAS os métodos necessários (não 25+)
async save(payment: Payment): Promise<void>
async update(payment: Payment): Promise<void>
async findById(id: string): Promise<Payment | null>
async findByExternalId(externalId: string): Promise<Payment | null>
async saveLog(paymentId: string, event: string, data: any): Promise<void>
}

B. VALIDAÇÃO ÚNICA

// USAR APENAS:
lib/domain/payment/payment.validators.ts // Para pagamentos
lib/domain/profile/profile.validators.ts // Para perfis médicos

// DELETAR:
lib/utils/validation.ts // Duplicação
lib/types/api.types.ts // Schemas duplicados

C. TYPES CENTRALIZADOS

// USAR APENAS:
lib/domain/payment/payment.types.ts // PaymentStatus, PaymentMethod, etc
lib/domain/profile/profile.types.ts // BloodType, PlanType, etc

// DELETAR:
lib/types/index.ts // Conflitos
lib/types/api.types.ts // Duplicações

---

📊 5. MÉTRICAS DE MELHORIA

ANTES (ATUAL)

- 3-4 lugares para manutenção
- 111 vulnerabilidades de unknown
- 757 linhas de código duplicado
- 25+ métodos não usados em repositories
- Score: 3.8/10

DEPOIS (CORRIGIDO)

- 1 lugar para manutenção (Domain)
- 0 vulnerabilidades críticas
- 0 duplicações
- Apenas métodos necessários
- Score: 9/10

---

🎯 6. FLUXO VISUAL COMPLETO

graph TD
subgraph "1. CREATE PAYMENT"
A[Frontend] -->|Device ID + Data| B[create-payment.ts]
B -->|Domain Validator| C[payment.validators.ts]
C -->|Create Entities| D[Payment + Profile Entities]
D -->|External API| E[MercadoPagoService]
E -->|Save| F[Repositories]
end

      subgraph "2. WEBHOOK"
          G[MercadoPago] -->|Webhook| H[mercadopago-webhook.ts]
          H -->|Validate HMAC| I[MercadoPagoService]
          I -->|Find & Update| J[Payment Entity]
          J -->|Business Logic| K[payment.isApproved()]
          K -->|Queue| L[QStash]
      end

      subgraph "3. PROCESS"
          L -->|Job| M[final-processor.ts]
          M -->|Load Entities| N[Payment + Profile]
          N -->|Business Logic| O[activate(), linkToProfile()]
          O -->|Generate| P[QR Code + Memorial]
          P -->|Save| Q[Repositories]
      end

---

🚀 7. IMPLEMENTAÇÃO - ORDEM DE EXECUÇÃO

SEMANA 1: LIMPEZA

1. Deletar os 5 arquivos identificados
2. Remover imports desses arquivos
3. Rodar testes para garantir nada quebrou

SEMANA 2: CORREÇÃO

4. Atualizar create-payment.ts para usar domain validators
5. Corrigir webhook para criar Payment entity
6. Simplificar repositories (remover 18+ métodos extras)

SEMANA 3: OTIMIZAÇÃO

7. Implementar todos os métodos da Payment entity
8. Usar Profile.getEmergencyData() ao invés de lógica espalhada
9. Validar com Zod em TODOS os pontos de entrada

---

✅ 8. BENEFÍCIOS FINAIS

SEGURANÇA

- ✅ 0 unknown em dados críticos
- ✅ 100% validação Zod no domain
- ✅ HMAC validation correta
- ✅ Device ID sempre presente

MANUTENIBILIDADE

- ✅ Single source of truth (Domain)
- ✅ DDD correto implementado
- ✅ Zero duplicação de código
- ✅ Responsabilidades claras

PERFORMANCE

- ✅ -757 linhas de código
- ✅ Menos complexidade = mais rápido
- ✅ Cache eficiente com entities
- ✅ Validação única por request

---

🎯 CONCLUSÃO

NÃO PRECISAMOS DE NOVA ARQUITETURA!

Já temos uma Ferrari (Domain Layer). Só precisamos:

1. Parar de usar o carrinho de mão (validation.ts)
2. Deletar duplicações (api.types.ts)
3. Usar os 20+ métodos da Payment entity
4. Simplificar repositories

É uma mudança de SUBTRAÇÃO, não ADIÇÃO.
