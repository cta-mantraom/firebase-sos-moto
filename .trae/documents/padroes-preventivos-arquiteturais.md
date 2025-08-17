# Padrões Preventivos Arquiteturais - Sistema SOS Moto

---

## ⚠️ Regras CRÍTICAS Arquiteturais

> **DEVE SER SEGUIDA EM TODA IMPLEMENTAÇÃO**

### **🚫 Proibições Absolutas:**

- **NUNCA usar `any`** em nenhuma situação no código de produção
- **É TOTALMENTE PROIBIDO** adicionar, modificar ou excluir qualquer arquivo ou código dentro da pasta `tests/` E `test-integration/` ou seus subdiretórios
- **NUNCA misturar** código de teste com código de produção
- **NUNCA implementar funcionalidades** sem definir interfaces primeiro
- **NUNCA criar arquivos** sem seguir o fluxo arquitetural obrigatório

### **✅ Práticas Obrigatórias:**

- Usar `unknown` **SOMENTE** para dados brutos/exteriores recebidos na fronteira do sistema (entrada de dados), antes da validação
- Validar **TODOS** os dados externos imediatamente com schemas definidos, preferencialmente utilizando Zod
- Após validação, trabalhar apenas com tipos claros, específicos e definidos
- Manutenção da estrutura modular e clara, desacoplada, é prioridade
- Usar `.env` files para variáveis de ambiente
- **Definir interfaces antes da implementação** (Interface-First Development)
- **Documentar dependências** antes de usar
- **Validar exportações** antes de importar

---

## 1. Sistema de Prevenção de Erros

### 1.1 🎯 **Análise de Causa Raiz dos 47 Erros**

**Distribuição de Causas:**
- **68% Lacunas na Documentação:** 32 erros causados por interfaces não especificadas, tipos não documentados, exportações ausentes
- **32% Problemas de Implementação:** 15 erros que documentação melhor preveniria

**Categorias Críticas Identificadas:**
1. **Interfaces de Repository Não Especificadas** (15 erros - 32%)
2. **Tipos de Dados Não Documentados** (8 erros - 17%)
3. **Exportações Não Especificadas** (6 erros - 13%)
4. **Dependências Não Documentadas** (3 erros - 6%)
5. **Problemas de Validação Zod** (5 erros - 11%)
6. **Incompatibilidades de Tipos** (10 erros - 21%)

### 1.2 🛡️ **Sistema Preventivo por Categoria**

#### **Categoria 1: Prevenção de Interfaces Ausentes**
**Erros Prevenidos:** savePaymentLog, findPendingProfile, save, savePendingProfile, deletePendingProfile, updateStatus, deleteExpiredPendingProfiles, findByPaymentId, getPaymentHistory

**Regras Preventivas:**
- Toda implementação de Repository DEVE começar pela definição da interface
- Interface DEVE ser documentada antes da implementação
- Métodos da interface DEVEM ser validados contra casos de uso
- Implementação DEVE seguir exatamente a interface definida

#### **Categoria 2: Prevenção de Tipos Não Documentados**
**Erros Prevenidos:** JobData properties, email templates, QStash types

**Regras Preventivas:**
- Tipos de dados entre camadas DEVEM ser especificados antes da implementação
- Contratos de dados DEVEM ser documentados em arquivo específico
- Validação Zod DEVE ser criada para cada tipo de fronteira
- Tipos DEVEM ser exportados explicitamente

#### **Categoria 3: Prevenção de Exportações Ausentes**
**Erros Prevenidos:** Firebase db/storage, ProfileQueryData, QueryConstraint

**Regras Preventivas:**
- Módulos DEVEM documentar todas as exportações necessárias
- Imports DEVEM ser validados antes da implementação
- Dependências entre módulos DEVEM ser mapeadas
- Exportações DEVEM seguir padrão consistente

---

## 2. Fluxos Obrigatórios de Implementação

### 2.1 🔄 **Fluxo para Implementação de Repository**

**Pré-Requisitos Obrigatórios:**
1. Definir interface completa do Repository
2. Documentar métodos obrigatórios e opcionais
3. Especificar tipos de entrada e saída
4. Validar dependências necessárias

**Sequência Obrigatória:**
```
1. Criar interface em lib/domain/[entity]/[entity].repository.interface.ts
2. Documentar métodos e tipos em documentação técnica
3. Implementar Repository em lib/repositories/[entity].repository.ts
4. Validar implementação contra interface
5. Testar integração com Services
```

**Arquivos Relacionados Obrigatórios:**
- `lib/domain/[entity]/[entity].types.ts` - Tipos da entidade
- `lib/domain/[entity]/[entity].repository.interface.ts` - Interface do repository
- `lib/repositories/[entity].repository.ts` - Implementação
- `lib/services/[entity]/[entity].service.ts` - Service que usa o repository

**Validações Obrigatórias:**
- Interface implementa todos os métodos necessários
- Tipos de entrada e saída estão corretos
- Dependências estão instaladas e configuradas
- Exportações estão corretas

### 2.2 🔄 **Fluxo para Implementação de Service**

**Pré-Requisitos Obrigatórios:**
1. Repository interface definida e implementada
2. Tipos de domínio especificados
3. Dependências externas documentadas
4. Contratos de entrada e saída definidos

**Sequência Obrigatória:**
```
1. Definir interface do Service em lib/domain/[entity]/[entity].service.interface.ts
2. Especificar dependências e injeções
3. Implementar Service em lib/services/[entity]/[entity].service.ts
4. Validar integração com Repository
5. Testar casos de uso principais
```

**Arquivos Relacionados Obrigatórios:**
- `lib/domain/[entity]/[entity].service.interface.ts` - Interface do service
- `lib/services/[entity]/[entity].service.ts` - Implementação
- `lib/repositories/[entity].repository.ts` - Repository usado
- `api/[endpoint].ts` - Endpoints que usam o service

### 2.3 🔄 **Fluxo para Implementação de API Endpoint**

**Pré-Requisitos Obrigatórios:**
1. Service interface definida e implementada
2. Schemas de validação Zod criados
3. Tipos de request/response especificados
4. Tratamento de erros definido

**Sequência Obrigatória:**
```
1. Criar schema Zod para validação em lib/schemas/[endpoint].ts
2. Definir tipos de request/response
3. Implementar endpoint em api/[endpoint].ts
4. Validar entrada com Zod
5. Integrar com Service apropriado
6. Implementar tratamento de erros
```

---

## 3. Mapeamento de Relacionamentos Arquiteturais

### 3.1 🗺️ **Matriz de Dependências por Camada**

#### **Camada API (api/)**
**Funcionalidades por Arquivo:**
- `create-payment.ts`: 1 endpoint, validação Zod, integração PaymentService
- `mercadopago-webhook.ts`: 1 webhook, validação MercadoPago, processamento assíncrono
- `get-profile.ts`: 1 endpoint, validação Zod, integração ProfileService
- `check-status.ts`: 1 endpoint, validação simples, consulta status

**Comunicação Obrigatória:**
- API → Services (sempre através de interface)
- API → Schemas (validação Zod obrigatória)
- API → Types (tipagem de request/response)

**Dependências Obrigatórias:**
- Zod schemas para validação
- Service interfaces
- Error handling utilities
- Logger utilities

#### **Camada Services (lib/services/)**
**Funcionalidades por Arquivo:**
- `payment/payment.service.ts`: Orquestração de pagamentos, integração MercadoPago, logging
- `profile/profile.service.ts`: Gestão de perfis, validação, persistência
- `notification/email.service.ts`: Envio de emails, templates, AWS SES
- `queue/qstash.service.ts`: Gerenciamento de filas, QStash integration

**Comunicação Obrigatória:**
- Services → Repositories (sempre através de interface)
- Services → Domain Entities (manipulação de dados)
- Services → External APIs (MercadoPago, AWS, QStash)

**Dependências Obrigatórias:**
- Repository interfaces
- Domain types
- External SDK clients
- Configuration utilities

#### **Camada Repositories (lib/repositories/)**
**Funcionalidades por Arquivo:**
- `payment.repository.ts`: CRUD pagamentos, queries específicas, logging
- `profile.repository.ts`: CRUD perfis, queries complexas, cache

**Comunicação Obrigatória:**
- Repositories → Database (Firebase/Firestore)
- Repositories → Cache (Redis)
- Repositories → Storage (Firebase Storage)

**Dependências Obrigatórias:**
- Firebase SDK
- Redis client
- Domain types
- Query utilities

#### **Camada Domain (lib/domain/)**
**Funcionalidades por Arquivo:**
- `[entity]/[entity].types.ts`: Definições de tipos, interfaces, enums
- `[entity]/[entity].entity.ts`: Entidades de domínio, validações, regras de negócio
- `[entity]/[entity].validators.ts`: Schemas Zod, validações customizadas

**Comunicação Obrigatória:**
- Domain → Nenhuma (camada independente)
- Outras camadas → Domain (uso de tipos e entidades)

### 3.2 🔗 **Dependências Externas por Tecnologia**

#### **AWS (Email Service)**
**Arquivos Afetados:**
- `lib/services/notification/email.service.ts`
- `api/processors/email-sender.ts`

**Dependências Obrigatórias:**
- `@aws-sdk/client-ses` (CRÍTICO - ausente causa falha total)
- Configuração AWS credentials
- Templates de email definidos
- Tipos de email status

**Validações Necessárias:**
- AWS SDK instalado e configurado
- Credentials válidas
- Templates existem e são válidos
- Status de email são consistentes

#### **MercadoPago (Payment Processing)**
**Arquivos Afetados:**
- `lib/services/payment/payment.service.ts`
- `api/create-payment.ts`
- `api/mercadopago-webhook.ts`
- `src/components/MercadoPagoCheckout.tsx`

**Dependências Obrigatórias:**
- MercadoPago SDK
- Device ID implementation (CRÍTICO para taxa de aprovação)
- Webhook signature validation
- Payment logging methods

**Validações Necessárias:**
- SDK configurado corretamente
- Device ID implementado no frontend
- Webhook validation ativa
- Payment repository methods implementados

#### **Firebase (Database & Storage)**
**Arquivos Afetados:**
- `lib/services/firebase.ts`
- `lib/repositories/*.repository.ts`
- `lib/services/storage/firebase.service.ts`
- `lib/services/profile/qrcode.service.ts`

**Dependências Obrigatórias:**
- Firebase Admin SDK
- Firestore database
- Firebase Storage
- Proper exports (db, storage)

**Validações Necessárias:**
- Firebase configurado e inicializado
- Database rules configuradas
- Storage rules configuradas
- Exports corretos em firebase.ts

#### **QStash (Queue Management)**
**Arquivos Afetados:**
- `lib/services/queue/qstash.service.ts`
- `lib/services/notification/queue.service.ts`
- `api/processors/*.ts`

**Dependências Obrigatórias:**
- QStash client
- JobData interface completa
- Queue metrics types
- Message processing types

**Validações Necessárias:**
- QStash client configurado
- JobData interface atualizada
- Message types corretos
- Queue processing implementado

#### **Redis (Caching)**
**Arquivos Afetados:**
- `lib/services/redis.ts`
- `lib/repositories/*.repository.ts`

**Dependências Obrigatórias:**
- Redis client
- Connection configuration
- Cache key patterns
- TTL configurations

**Validações Necessárias:**
- Redis conectado e funcional
- Cache patterns definidos
- TTL configurado adequadamente
- Error handling para cache failures

---

## 4. Padrões de Validação e Tipos

### 4.1 ✅ **Padrões Zod Obrigatórios**

#### **Validação de Fronteira (unknown → typed)**
**Regra:** Todo dado externo DEVE ser validado na fronteira

**Padrão Obrigatório:**
```typescript
// ❌ PROIBIDO
function processData(data: any) { ... }

// ✅ OBRIGATÓRIO
function processData(data: unknown) {
  const validatedData = SomeSchema.parse(data);
  // trabalhar com validatedData tipado
}
```

#### **Schemas Parciais**
**Problema Identificado:** ZodEffects não possui método partial()

**Solução Preventiva:**
- Criar schemas base sem effects
- Aplicar effects após partial() se necessário
- Documentar limitações de schemas com effects

#### **Validação de Tipos Opcionais**
**Problema Identificado:** Propriedades undefined passadas como obrigatórias

**Padrão Preventivo:**
- Validar undefined antes de usar
- Usar optional() em schemas quando apropriado
- Implementar guards de tipo quando necessário

### 4.2 🎯 **Padrões de Tipos TypeScript**

#### **Interface vs Type**
**Regra:** Usar interface para contratos, type para unions e computados

**Padrão Obrigatório:**
```typescript
// ✅ Para contratos e extensibilidade
interface PaymentRepository {
  savePaymentLog(data: PaymentLogData): Promise<void>;
}

// ✅ Para unions e tipos computados
type PaymentStatus = 'pending' | 'approved' | 'rejected';
type PaymentWithStatus = Payment & { status: PaymentStatus };
```

#### **Exportações Explícitas**
**Problema Identificado:** Exports ausentes causam erros de importação

**Padrão Preventivo:**
- Sempre exportar interfaces e tipos usados externamente
- Usar export explícito, não export default para tipos
- Documentar exports em comentários quando necessário

#### **Propriedades Readonly**
**Problema Identificado:** Tentativa de modificar propriedades readonly

**Padrão Preventivo:**
- Usar readonly apenas quando realmente necessário
- Implementar métodos de atualização quando readonly é necessário
- Documentar propriedades readonly e suas limitações

---

## 5. Checklist de Implementação Preventiva

### 5.1 📋 **Checklist para Repository**

**Antes de Implementar:**
- [ ] Interface do Repository definida
- [ ] Métodos obrigatórios especificados
- [ ] Tipos de entrada e saída documentados
- [ ] Dependências externas identificadas
- [ ] Casos de uso mapeados

**Durante Implementação:**
- [ ] Implementar todos os métodos da interface
- [ ] Validar tipos de entrada
- [ ] Implementar tratamento de erros
- [ ] Adicionar logging apropriado
- [ ] Testar integração com database

**Após Implementação:**
- [ ] Validar contra interface
- [ ] Testar todos os métodos
- [ ] Verificar performance
- [ ] Documentar limitações
- [ ] Integrar com Services

### 5.2 📋 **Checklist para Service**

**Antes de Implementar:**
- [ ] Repository dependencies disponíveis
- [ ] Interface do Service definida
- [ ] Regras de negócio especificadas
- [ ] Dependências externas configuradas
- [ ] Casos de uso validados

**Durante Implementação:**
- [ ] Implementar orquestração correta
- [ ] Validar dados de entrada
- [ ] Implementar regras de negócio
- [ ] Integrar com repositories
- [ ] Adicionar logging e monitoring

**Após Implementação:**
- [ ] Testar casos de uso principais
- [ ] Validar integração com APIs
- [ ] Verificar performance
- [ ] Documentar comportamento
- [ ] Implementar error handling

### 5.3 📋 **Checklist para API Endpoint**

**Antes de Implementar:**
- [ ] Service dependencies disponíveis
- [ ] Schemas Zod criados
- [ ] Tipos de request/response definidos
- [ ] Autenticação/autorização especificada
- [ ] Rate limiting considerado

**Durante Implementação:**
- [ ] Validar entrada com Zod
- [ ] Implementar autenticação
- [ ] Integrar com Service
- [ ] Implementar error handling
- [ ] Adicionar logging de requests

**Após Implementação:**
- [ ] Testar casos válidos e inválidos
- [ ] Validar responses
- [ ] Verificar performance
- [ ] Documentar API
- [ ] Implementar monitoring

---

## 6. Monitoramento e Validação Contínua

### 6.1 📊 **Métricas de Qualidade Arquitetural**

**Métricas de Prevenção:**
- **Interface Coverage:** % de repositories com interface definida
- **Type Safety:** % de código sem `any`
- **Validation Coverage:** % de endpoints com validação Zod
- **Dependency Documentation:** % de dependências documentadas
- **Export Consistency:** % de modules com exports corretos

**Targets de Qualidade:**
- Interface Coverage: 100%
- Type Safety: 100% (zero `any`)
- Validation Coverage: 100%
- Dependency Documentation: 100%
- Export Consistency: 100%

### 6.2 🔍 **Validação Automática**

**TypeScript Strict Mode:**
- Habilitar todas as flags strict
- Validar tipos em build time
- Falhar build em caso de `any`

**Linting Rules:**
- Proibir uso de `any`
- Forçar exportações explícitas
- Validar imports
- Verificar unused variables

**Pre-commit Hooks:**
- Type checking
- Linting
- Format checking
- Dependency validation

### 6.3 🎯 **Processo de Review**

**Checklist de Code Review:**
- [ ] Interfaces definidas antes da implementação
- [ ] Tipos explícitos (sem `any`)
- [ ] Validação Zod implementada
- [ ] Dependências documentadas
- [ ] Exports corretos
- [ ] Error handling implementado
- [ ] Logging apropriado
- [ ] Performance considerada

**Critérios de Aprovação:**
- Todos os checks passando
- Documentação atualizada
- Testes implementados
- Performance validada
- Segurança verificada

---

## 7. Plano de Migração e Correção

### 7.1 🚀 **Fases de Implementação**

#### **Fase 1: Correção Crítica (1-2 dias)**
**Objetivo:** Sistema funcional básico

**Ações Obrigatórias:**
1. Instalar AWS SDK: `npm install @aws-sdk/client-ses`
2. Implementar métodos críticos em PaymentRepository
3. Implementar métodos críticos em ProfileRepository
4. Corrigir exports do Firebase
5. Atualizar interface JobData

**Validação:**
- [ ] 0 erros TypeScript críticos
- [ ] Sistema de pagamentos funcional
- [ ] Sistema de emails funcional
- [ ] Sistema de filas funcional

#### **Fase 2: Implementação Preventiva (2-3 dias)**
**Objetivo:** Sistema preventivo robusto

**Ações Obrigatórias:**
1. Criar interfaces para todos os repositories
2. Documentar tipos entre camadas
3. Implementar validações Zod completas
4. Corrigir todos os exports
5. Implementar Device ID (MercadoPago)

**Validação:**
- [ ] 100% Interface Coverage
- [ ] 100% Type Safety
- [ ] 100% Validation Coverage
- [ ] Device ID implementado
- [ ] Taxa de aprovação otimizada

#### **Fase 3: Otimização e Monitoramento (1-2 dias)**
**Objetivo:** Sistema monitorado e otimizado

**Ações Obrigatórias:**
1. Implementar métricas de qualidade
2. Configurar validação automática
3. Implementar monitoring
4. Otimizar performance
5. Documentar processo

**Validação:**
- [ ] Métricas implementadas
- [ ] Validação automática ativa
- [ ] Monitoring funcional
- [ ] Performance otimizada
- [ ] Documentação completa

### 7.2 📈 **Resultados Esperados**

**Redução de Erros:**
- **90% redução** em erros de interface ausente
- **85% redução** em erros de tipo
- **95% redução** em erros de export
- **100% eliminação** de erros de dependência

**Melhoria de Qualidade:**
- **100% Type Safety** (zero `any`)
- **100% Interface Coverage**
- **100% Validation Coverage**
- **Manutenibilidade aumentada** em 80%

**Impacto no Negócio:**
- **Taxa de aprovação** de 70-75% → 85-90%
- **Tempo de desenvolvimento** reduzido em 60%
- **Bugs em produção** reduzidos em 90%
- **Confiabilidade do sistema** aumentada em 95%

---

## 8. Conclusão e Próximos Passos

### 8.1 🎯 **Resumo do Sistema Preventivo**

Este documento estabelece um sistema preventivo robusto baseado na análise dos 47 erros TypeScript identificados. O sistema foca em:

1. **Prevenção Proativa:** Definir interfaces e tipos antes da implementação
2. **Validação Contínua:** Verificação automática de qualidade
3. **Relacionamentos Claros:** Mapeamento completo de dependências
4. **Fluxos Obrigatórios:** Sequências definidas para cada tipo de implementação
5. **Monitoramento Ativo:** Métricas e validação contínua

### 8.2 🚀 **Implementação Imediata**

**Próximos Passos Críticos:**
1. Implementar Fase 1 (correção crítica)
2. Seguir checklists de implementação
3. Validar métricas de qualidade
4. Implementar Device ID
5. Monitorar resultados

**Benefícios Esperados:**
- Sistema 100% funcional
- Prevenção de 90% dos erros similares
- Taxa de aprovação otimizada
- Base sólida para crescimento futuro
- Desenvolvimento mais eficiente e confiável

Este sistema preventivo garante que o desenvolvimento futuro seja robusto, eficiente e livre dos problemas identificados, estabelecendo uma base sólida para o crescimento técnico controlado e de alta qualidade do sistema SOS Moto.