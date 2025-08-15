# Arquivos Pendentes de Implementação - Sistema SOS Moto

---

## ⚠️ Regras CRÍTICAS para a Refatoração

> **DEVE SER REPETIDA EM TODAS DOCUMENTAÇÕES E PASSO A PASSO**

### **🚫 Proibições Absolutas:**

- **NUNCA usar `any`** em nenhuma situação no código de produção
- **É TOTALMENTE PROIBIDO** adicionar, modificar ou excluir qualquer arquivo ou código dentro da pasta `tests/` E `test-integration/` ou seus subdiretórios

### **✅ Práticas Obrigatórias:**

- Usar `unknown` **SOMENTE** para dados brutos/exteriores recebidos na fronteira do sistema (entrada de dados), antes da validação
- Validar **TODOS** os dados externos imediatamente com schemas definidos, preferencialmente utilizando Zod
- Após validação, trabalhar apenas com tipos claros, específicos e definidos
- Manutenção da estrutura modular e clara, desacoplada, é prioridade
- Usar `.env` files para variáveis de ambiente

## 🔍 Detalhes Técnicos e Justificativas Importantes

### **Sobre Tipos e Validação**

Dados recebidos em cada função (ex: webhook, checkout) quando necessário usar `unknown` devem ser inicialmente tipados

Esses dados brutos são imediatamente validados com schemas fortes (Zod), convertendo para tipos definidos.

Código interno trabalha somente com esses tipos validados.

Isso garante robustez, segurança, e elimina bugs silenciosos.

### **Sobre Código de Testes em Produção**

Sempre analise se há identificação de código de teste misturado em código de produção não pode ter código de teste misturado com código de produção

**Deve ser removido imediatamente.**

Nenhum teste novo será criado nem modificado nesta fase.

---

## 1. Visão Geral dos Arquivos Pendentes

Este documento lista todos os arquivos que ainda precisam ser implementados conforme as documentações de refatoração arquitetural e integração do MercadoPago. A implementação deve seguir rigorosamente as regras críticas estabelecidas.

**Status Atual:**
- ❌ **Não Implementado**: Arquivo existe apenas como placeholder com comentários TODO
- 🔄 **Refatoração Necessária**: Arquivo existe mas precisa ser refatorado conforme nova arquitetura
- 🆕 **Novo Arquivo**: Arquivo não existe e precisa ser criado

---

## 2. Arquivos por Categoria

### 2.1 API Layer - Processors

#### 2.1.1 api/processors/final-processor.ts 🆕

**Status:** Não existe - precisa ser criado

**Responsabilidades:**
- Processamento completo de pagamentos aprovados
- Orquestração de serviços
- Geração de QR Code
- Salvamento de perfil
- Atualização de cache
- Enfileiramento de email

**Implementação Base:**
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const processor = new FinalProcessor(
    new PaymentProcessor(),
    new ProfileService(),
    new QRCodeService(),
    new RedisService(),
    new QueueService()
  );
  
  await processor.process(req.body);
}

class FinalProcessor extends JobProcessor {
  async process(data: ProcessingJobData): Promise<void> {
    // 1. Validar dados do pagamento
    // 2. Buscar perfil pendente
    // 3. Gerar QR Code
    // 4. Salvar perfil final
    // 5. Atualizar cache
    // 6. Enfileirar job de email
  }
}
```

#### 2.1.2 api/processors/email-sender.ts 🆕

**Status:** Não existe - precisa ser criado

**Responsabilidades:**
- Envio assíncrono de emails
- Retry automático
- Templates dinâmicos
- Logs de entrega

**Implementação Base:**
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const processor = new EmailProcessor(
    new EmailService(),
    new ProfileService()
  );
  
  await processor.process(req.body);
}

class EmailProcessor extends JobProcessor {
  async process(data: EmailJobData): Promise<void> {
    // 1. Buscar dados do perfil
    // 2. Gerar template de email
    // 3. Enviar email via SES
    // 4. Log de confirmação
  }
}
```

### 2.2 Types Layer

#### 2.2.1 lib/types/queue.types.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Definição de tipos de jobs
- Interfaces de filas
- Tipos de payload e configuração

**Tipos Necessários:**
```typescript
export interface ProcessingJobData {
  paymentId: string;
  profileId: string;
  paymentData: MercadoPagoPayment;
  correlationId: string;
}

export interface EmailJobData {
  profileId: string;
  email: string;
  qrCodeData: string;
  memorialUrl: string;
  planType: 'basic' | 'premium';
}

export interface QueueStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
}
```

#### 2.2.2 lib/types/api.types.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Definição de tipos de request/response
- Interfaces de API
- Tipos de validação de entrada

**Tipos Necessários:**
```typescript
export interface PaymentRequest {
  selectedPlan: 'basic' | 'premium';
  name: string;
  email: string;
  phone: string;
  age: number;
  // ... outros campos médicos
}

export interface PaymentResponse {
  preferenceId: string;
  checkoutUrl: string;
  uniqueUrl: string;
  correlationId: string;
}

export interface ProfileResponse {
  uniqueUrl: string;
  name: string;
  qrCodeData: string;
  memorialUrl: string;
  // ... outros campos
}
```

### 2.3 Service Layer

#### 2.3.1 lib/services/storage/redis.service.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Abstração do Redis/Upstash
- Cache strategies
- TTL management
- Fallback handling

**Métodos Principais:**
```typescript
class RedisService {
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>
  async invalidate(pattern: string): Promise<void>
  private handleRedisError(error: RedisError): void
}
```

#### 2.3.2 lib/services/queue/qstash.service.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Cliente QStash
- Publicação de jobs
- Configuração de retry policies
- Monitoramento de jobs

**Métodos Principais:**
```typescript
class QStashService {
  async publishJob(url: string, data: unknown, options?: PublishOptions): Promise<string>
  async scheduleJob(url: string, data: unknown, delay: number): Promise<string>
  async getJobStatus(jobId: string): Promise<JobStatus>
  async cancelJob(jobId: string): Promise<void>
  private validateSignature(request: Request): boolean
}
```

#### 2.3.3 lib/services/queue/job.processor.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Classe base para processadores
- Retry logic comum
- Error handling padrão
- Logging estruturado

**Implementação Base:**
```typescript
abstract class JobProcessor {
  abstract process(data: unknown): Promise<void>
  protected async executeWithRetry(fn: () => Promise<void>, maxRetries: number): Promise<void>
  protected logJobStart(jobType: string, data: unknown): void
  protected logJobComplete(jobType: string, duration: number): void
  protected logJobError(jobType: string, error: Error): void
}
```

### 2.4 Repository Layer

#### 2.4.1 lib/repositories/profile.repository.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Acesso a dados de perfis
- Queries otimizadas
- Mapeamento de entidades
- Cache integration

**Métodos Principais:**
```typescript
class ProfileRepository {
  async save(profile: Profile): Promise<void>
  async findByUniqueUrl(uniqueUrl: string): Promise<Profile | null>
  async findPendingProfile(uniqueUrl: string): Promise<PendingProfile | null>
  async updateStatus(uniqueUrl: string, status: ProfileStatus): Promise<void>
  private mapToEntity(data: unknown): Profile
  private mapFromEntity(profile: Profile): unknown
}
```

#### 2.4.2 lib/repositories/payment.repository.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Acesso a dados de pagamentos
- Logs de auditoria
- Queries de relatórios
- Histórico de transações

**Métodos Principais:**
```typescript
class PaymentRepository {
  async savePaymentLog(paymentLog: PaymentLog): Promise<void>
  async findByPaymentId(paymentId: string): Promise<PaymentLog | null>
  async findByExternalReference(externalRef: string): Promise<PaymentLog[]>
  async getPaymentHistory(filters: PaymentFilters): Promise<PaymentLog[]>
  private mapToPaymentLog(data: unknown): PaymentLog
}
```

### 2.5 Domain Layer

#### 2.5.1 lib/domain/profile/profile.entity.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Definição da entidade Profile
- Métodos de domínio
- Validações de negócio
- Invariantes de domínio

**Implementação Base:**
```typescript
class Profile {
  constructor(
    public readonly uniqueUrl: string,
    public readonly personalData: PersonalData,
    public readonly medicalData: MedicalData,
    public readonly emergencyContacts: EmergencyContact[],
    public readonly planType: PlanType
  ) {}
  
  isValid(): boolean
  canGenerateQRCode(): boolean
  getMemorialUrl(): string
  addEmergencyContact(contact: EmergencyContact): void
  updateMedicalData(data: Partial<MedicalData>): void
}
```

#### 2.5.2 lib/domain/profile/profile.validators.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Validações de domínio específicas
- Schemas Zod para perfis
- Regras de negócio de validação

**Schemas Necessários:**
```typescript
export const PersonalDataSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  age: z.number().min(1).max(120)
});

export const MedicalDataSchema = z.object({
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional()
});
```

#### 2.5.3 lib/domain/payment/payment.entity.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Definição da entidade Payment
- Estados de pagamento
- Validações de negócio
- Transformações de dados

**Implementação Base:**
```typescript
class Payment {
  constructor(
    public readonly id: string,
    public readonly externalReference: string,
    public readonly amount: number,
    public readonly status: PaymentStatus,
    public readonly createdAt: Date
  ) {}
  
  isApproved(): boolean
  isPending(): boolean
  isFailed(): boolean
  canBeProcessed(): boolean
  getProcessingData(): ProcessingData
}
```

#### 2.5.4 lib/domain/payment/payment.types.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Definição de tipos específicos de pagamento
- Interfaces de domínio
- Enums de status e estados

**Tipos Necessários:**
```typescript
export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface ProcessingData {
  profileId: string;
  paymentId: string;
  amount: number;
  planType: 'basic' | 'premium';
}
```

#### 2.5.5 lib/domain/payment/payment.validators.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Validações de domínio específicas
- Schemas Zod para pagamentos
- Regras de negócio de validação

**Schemas Necessários:**
```typescript
export const MercadoPagoWebhookSchema = z.object({
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  user_id: z.number(),
  api_version: z.string(),
  action: z.string(),
  data: z.object({
    id: z.string()
  })
});
```

#### 2.5.6 lib/domain/notification/email.entity.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Definição da entidade Email
- Estados de envio
- Validações de negócio
- Templates e conteúdo

**Implementação Base:**
```typescript
class Email {
  constructor(
    public readonly id: string,
    public readonly to: string,
    public readonly subject: string,
    public readonly template: EmailTemplate,
    public readonly status: EmailStatus
  ) {}
  
  canBeSent(): boolean
  markAsSent(): void
  markAsFailed(error: string): void
  getHtmlContent(): string
}
```

#### 2.5.7 lib/domain/notification/email.types.ts ❌

**Status:** Placeholder com TODO

**Responsabilidades:**
- Definição de tipos específicos de email
- Interfaces de domínio
- Enums de templates e status

**Tipos Necessários:**
```typescript
export enum EmailTemplate {
  CONFIRMATION = 'confirmation',
  FAILURE = 'failure',
  REMINDER = 'reminder'
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export interface EmailData {
  profileId: string;
  email: string;
  name: string;
  qrCodeData: string;
  memorialUrl: string;
  planType: 'basic' | 'premium';
}
```

---

## 3. Arquivos que Precisam de Refatoração

### 3.1 api/create-payment.ts 🔄

**Status:** Existe mas precisa refatoração

**Problemas Identificados:**
- Concentra múltiplas responsabilidades
- Processamento síncrono de pagamentos aprovados
- Falta separação de concerns
- Não usa a nova arquitetura de serviços

**Refatoração Necessária:**
- Manter apenas criação de preferência MercadoPago
- Remover processamento de pagamento aprovado
- Usar MercadoPagoService para criação de preferência
- Usar ProfileRepository para salvar perfil pendente
- Implementar headers obrigatórios (X-Idempotency-Key)

**Nova Estrutura:**
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validar dados de entrada com Zod
  // 2. Usar MercadoPagoService.createPreference()
  // 3. Usar ProfileRepository.savePendingProfile()
  // 4. Retornar apenas preferenceId e uniqueUrl
}
```

---

## 4. Priorização da Implementação

### 4.1 Fase 1 - Estrutura Base (Prioridade Alta)

1. **Types Layer**
   - `lib/types/api.types.ts`
   - `lib/types/queue.types.ts`

2. **Domain Layer**
   - `lib/domain/profile/profile.types.ts`
   - `lib/domain/payment/payment.types.ts`
   - `lib/domain/notification/email.types.ts`

3. **Validators**
   - `lib/domain/profile/profile.validators.ts`
   - `lib/domain/payment/payment.validators.ts`

### 4.2 Fase 2 - Entidades e Repositórios (Prioridade Média)

1. **Entities**
   - `lib/domain/profile/profile.entity.ts`
   - `lib/domain/payment/payment.entity.ts`
   - `lib/domain/notification/email.entity.ts`

2. **Repositories**
   - `lib/repositories/profile.repository.ts`
   - `lib/repositories/payment.repository.ts`

### 4.3 Fase 3 - Serviços e Processadores (Prioridade Alta)

1. **Base Services**
   - `lib/services/storage/redis.service.ts`
   - `lib/services/queue/job.processor.ts`
   - `lib/services/queue/qstash.service.ts`

2. **Processors**
   - `api/processors/final-processor.ts`
   - `api/processors/email-sender.ts`

### 4.4 Fase 4 - Refatoração (Prioridade Alta)

1. **API Refactoring**
   - Refatorar `api/create-payment.ts`
   - Implementar novos serviços nos endpoints existentes

---

## 5. Considerações Especiais

### 5.1 Integração com MercadoPago

**Arquivos Relacionados:**
- `lib/services/payment/mercadopago.service.ts` (precisa ser criado)
- `lib/services/payment/payment.processor.ts` (precisa ser criado)

**Responsabilidades MercadoPago Service:**
- Criação de preferências
- Validação de webhooks HMAC
- Headers obrigatórios (X-Idempotency-Key)
- Device ID validation
- Integração com APIs MercadoPago

### 5.2 Sistema de Filas

**Arquivos Relacionados:**
- `lib/services/queue/qstash.service.ts`
- `api/processors/final-processor.ts`
- `api/processors/email-sender.ts`

**Fluxo de Processamento:**
1. Webhook recebe notificação
2. Enfileira job no QStash
3. Final processor processa pagamento
4. Enfileira job de email
5. Email sender envia confirmação

### 5.3 Validação e Tipos

**Regras Críticas:**
- Usar `unknown` apenas na fronteira do sistema
- Validar imediatamente com Zod
- Trabalhar apenas com tipos definidos internamente
- Nunca usar `any` em produção

---

## 6. Próximos Passos

1. **Implementar Types Layer** - Base para toda arquitetura
2. **Criar Domain Entities** - Lógica de negócio centralizada
3. **Implementar Repositories** - Acesso a dados padronizado
4. **Criar Services** - Lógica de aplicação
5. **Implementar Processors** - Sistema assíncrono
6. **Refatorar APIs** - Usar nova arquitetura
7. **Testes de Integração** - Validar fluxo completo

**Estimativa:** 2-3 semanas para implementação completa seguindo as fases.

**Observação:** Todos os arquivos devem seguir rigorosamente as regras críticas estabelecidas, especialmente a proibição do uso de `any` e a validação obrigatória de dados externos com Zod.