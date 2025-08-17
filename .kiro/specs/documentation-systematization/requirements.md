# Requirements Document

---

## ⚠️ Regras CRÍTICAS para o Projeto

> **DEVE SER SEGUIDA EM TODA IMPLEMENTAÇÃO**

### **🚫 Proibições Absolutas:**

- **NUNCA usar `any`** em nenhuma situação no código de produção
- **É TOTALMENTE PROIBIDO** adicionar, modificar ou excluir qualquer arquivo ou código dentro da pasta `tests/` E `test-integration/` ou seus subdiretórios
- **NUNCA misturar** código de teste com código de produção

### **✅ Práticas Obrigatórias:**

- Usar `unknown` **SOMENTE** para dados brutos/exteriores recebidos na fronteira do sistema (entrada de dados), antes da validação
- Validar **TODOS** os dados externos imediatamente com schemas definidos, preferencialmente utilizando Zod
- Após validação, trabalhar apenas com tipos claros, específicos e definidos
- Manutenção da estrutura modular e clara, desacoplada, é prioridade
- Usar `.env` files para variáveis de ambiente

---

## Requisitos do Projeto

Este documento define os requisitos para compreensão, análise e otimização do sistema SOS Moto sob diferentes perspectivas de usuários técnicos.

**ESTADO ATUAL**: Sistema 90% implementado com problemas críticos identificados que afetam taxa de aprovação de pagamentos e consistência arquitetural.

### Como Desenvolvedor

**Objetivo**: Compreender a arquitetura e implementar correções críticas

**Necessidades**:
- Mapear fluxo completo de dados do sistema
- Identificar pontos de integração entre serviços
- Compreender padrões arquiteturais utilizados (Domain, Service, Repository, Processors)
- **CRÍTICO**: Implementar Device ID no MercadoPagoCheckout.tsx (impacto 15-30% na taxa de aprovação)
- **CRÍTICO**: Refatorar webhook para usar MercadoPagoService (consistência arquitetural)
- Localizar e corrigir código duplicado entre webhook e final-processor
- Seguir regras críticas: sem `any`, validação Zod obrigatória, arquitetura modular

## Introduction

**REANÁLISE DO PROJETO EM PRODUÇÃO**: Este documento foi atualizado após análise completa do código atual do SOS Moto. O projeto está **70% implementado** e em produção, com nova arquitetura parcialmente implementada.

Esta reanálise visa documentar o estado atual real, identificar fluxos de dados, orquestradores, e próximos passos para finalização, mantendo performance e minimizando custos sem over-engineering, preservando o desacoplamento de serviços externos.

## Requirements

### Requirement 1

**User Story:** As a developer working on the SOS Moto project (70% implementado), I want to understand the current system architecture and data flows, so that I can contribute effectively without breaking existing production functionality.

#### Acceptance Criteria

1. WHEN a developer needs to understand data flow THEN the system SHALL document complete user journey from form submission to QR code generation
2. WHEN working with external services THEN the system SHALL document MercadoPago, Firebase, Redis, QStash, and AWS SES integration points
3. WHEN following coding standards THEN the system SHALL enforce `unknown` usage rules and Zod validation patterns
4. WHEN implementing new features THEN the system SHALL provide clear service orchestration patterns
5. WHEN debugging issues THEN the system SHALL document correlation IDs and logging patterns across all services

### Requirement 2

**User Story:** As a technical lead, I want to understand the current production system's orchestration and identify optimization opportunities, so that I can maintain performance while minimizing costs.

#### Acceptance Criteria

1. WHEN analyzing system performance THEN the system SHALL document Redis cache hit rates and Firebase query patterns
2. WHEN reviewing costs THEN the system SHALL document QStash job frequency and AWS SES usage patterns
3. WHEN identifying bottlenecks THEN the system SHALL map all async processing flows and their triggers
4. WHEN ensuring data consistency THEN the system SHALL document when data is written to Firebase (pending vs final)
5. WHEN preventing security issues THEN the system SHALL document all validation points and HMAC signature verification

### Requirement 3

**User Story:** As a developer maintaining production code, I want to understand the current service orchestration and identify redundant code, so that I can optimize without breaking existing functionality.

#### Acceptance Criteria

1. WHEN identifying redundant code THEN the system SHALL document duplicate logic between create-payment.ts and final-processor.ts
2. WHEN understanding async flows THEN the system SHALL document QStash job triggers and processing sequences
3. WHEN working with MercadoPago THEN the system SHALL document Payment Brick integration and webhook validation
4. WHEN managing data persistence THEN the system SHALL document pending_profiles vs user_profiles collections usage
5. WHEN debugging payment flows THEN the system SHALL document correlation ID tracking across all services

### Requirement 4

**User Story:** As a developer working on production system, I want to understand the complete user journey and data flow orchestration, so that I can identify where optimizations can be made safely.

#### Acceptance Criteria

1. WHEN tracing user journey THEN the system SHALL document: Form → create-payment → MercadoPago → webhook → QStash → final-processor → email-sender
2. WHEN understanding data persistence THEN the system SHALL document when pending_profiles becomes user_profiles
3. WHEN analyzing cache strategy THEN the system SHALL document Redis TTL patterns and cache invalidation triggers
4. WHEN reviewing async processing THEN the system SHALL document QStash job types and their processing order
5. WHEN ensuring data integrity THEN the system SHALL document transaction boundaries and rollback scenarios

### Requirement 5

**User Story:** As a system architect, I want to identify the main orchestrators and potential security vulnerabilities in the current production system, so that I can ensure data consistency and security.

#### Acceptance Criteria

1. WHEN identifying orchestrators THEN the system SHALL document: create-payment.ts, mercadopago-webhook.ts, final-processor.ts, email-sender.ts as main flow controllers
2. WHEN analyzing security THEN the system SHALL document HMAC validation, Device ID usage, and correlation ID tracking
3. WHEN reviewing data consistency THEN the system SHALL document atomic operations and eventual consistency patterns
4. WHEN identifying vulnerabilities THEN the system SHALL document where data is persisted before payment confirmation
5. WHEN optimizing performance THEN the system SHALL document Redis cache patterns and QStash job optimization opportunities
