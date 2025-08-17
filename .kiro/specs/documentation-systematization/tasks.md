# Implementation Plan

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

## Plano de Implementação

### Fase 1: Correções Críticas (Prioridade ALTA)

#### 1.1 🔴 CRÍTICO: Implementar Device ID no Frontend
- **Problema**: Device ID do MercadoPago NÃO está sendo coletado
- **Impacto**: Redução de 15-30% na taxa de aprovação de pagamentos
- **Solução**: 
  1. Adicionar script de segurança no index.html
  2. Implementar coleta de Device ID no MercadoPagoCheckout.tsx
  3. Incluir no payload de create-payment
- **Arquivos**: `index.html`, `src/components/MercadoPagoCheckout.tsx`, `api/create-payment.ts`
- **Estimativa**: 2-4 horas
- **Prioridade**: MÁXIMA (impacto direto na receita)

#### 1.2 🔴 CRÍTICO: Refatorar Webhook para Usar MercadoPagoService
- **Problema**: Webhook chama MercadoPago API diretamente, não usa `MercadoPagoService`
- **Impacto**: Viola arquitetura modular, inconsistência
- **Solução**: 
  1. Refatorar webhook para usar serviço implementado
  2. Remover chamadas diretas à API
  3. Manter validação HMAC
- **Arquivos**: `api/mercadopago-webhook.ts`
- **Estimativa**: 2-3 horas
- **Prioridade**: ALTA (manutenibilidade e consistência)

### Fase 2: Correções Médias (Próxima Sprint)

#### 2.1 🟡 MÉDIO: Definir Arquitetura Final (Síncrono vs Assíncrono)
- **Problema**: Inconsistência entre documentação (assíncrono) e implementação (síncrono)
- **Impacto**: Clareza arquitetural e performance
- **Solução**: 
  1. Decidir: Processamento síncrono OU assíncrono
  2. Atualizar documentação para refletir decisão
  3. Ajustar implementação se necessário
- **Arquivos**: Documentação + `api/mercadopago-webhook.ts`
- **Estimativa**: 4-6 horas
- **Prioridade**: MÉDIA (clareza arquitetural)

#### 2.2 🟡 MÉDIO: Eliminar Código Duplicado
- **Problema**: Lógica `processApprovedPayment` duplicada entre webhook e final-processor
- **Impacto**: Manutenibilidade e princípio DRY
- **Solução**: 
  1. Centralizar lógica de processamento
  2. Criar serviço compartilhado
  3. Refatorar ambos os arquivos
- **Arquivos**: `api/mercadopago-webhook.ts`, `api/processors/final-processor.ts`
- **Estimativa**: 3-4 horas
- **Prioridade**: MÉDIA (manutenibilidade)

### Fase 3: Otimizações (Prioridade BAIXA)

#### 3.1 Finalização do email-sender.ts
- **Status**: 95% completo
- **Pendência**: Validação final de templates
- **Solução**: Testar envio de emails em diferentes cenários
- **Arquivos**: `api/processors/email-sender.ts`
- **Estimativa**: 1 hora

#### 3.2 Otimizações de Performance
- **Objetivo**: Cache de validações, otimização de queries
- **Impacto**: Performance marginal
- **Estimativa**: 2-4 horas

### Fase 4: Documentação e Fluxos (Contínuo)

### Tarefas Detalhadas por Prioridade

- [ ] 1. **CORREÇÃO CRÍTICA**: Corrigir MercadoPagoCheckout.tsx

  - Implementar Device ID obrigatório (`window.MP_DEVICE_SESSION_ID`)
  - Adicionar callback `onReady` no Payment Brick
  - Implementar gerenciamento de `unmount` do Brick
  - Adicionar Device ID no payload para create-payment
  - _Requirements: 3.3, 5.2_

- [ ] 2. **REFATORAÇÃO**: Remover código duplicado em create-payment.ts

  - Remover função `processApprovedPayment` de create-payment.ts
  - Manter apenas criação de preferência MercadoPago
  - Garantir que webhook → QStash → final-processor seja o único fluxo
  - Validar que não há processamento síncrono de pagamento aprovado
  - _Requirements: 3.1, 3.2_

- [ ] 3. **IMPLEMENTAÇÃO**: Completar email-sender.ts

  - Verificar se api/processors/email-sender.ts está funcional
  - Implementar templates HTML para confirmação
  - Configurar retry logic com AWS SES
  - Testar integração completa QStash → email-sender → SES
  - _Requirements: 4.4, 5.4_

- [ ] 4. **DOCUMENTAÇÃO**: Mapear fluxo completo de dados

  - Documentar jornada: Form → pending_profiles → payment → user_profiles
  - Mapear todos os pontos de ativação do Redis (cache/invalidação)
  - Documentar triggers do QStash e tipos de jobs
  - Criar diagrama de sequência completo do sistema
  - _Requirements: 1.1, 4.1, 4.2_

- [ ] 5. **OTIMIZAÇÃO**: Analisar performance e custos

  - Revisar TTL do Redis (24h é otimizado?)
  - Analisar frequência de jobs QStash
  - Verificar queries Firebase desnecessárias
  - Documentar métricas de performance atuais
  - _Requirements: 2.1, 2.2_

- [ ] 6. **SEGURANÇA**: Validar implementação de segurança

  - Verificar HMAC validation no webhook (✅ já implementado)
  - Confirmar Device ID obrigatório em todas transações MercadoPago
  - Validar correlation ID tracking em todos os serviços
  - Revisar logs para não exposição de dados sensíveis
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 7. **MONITORAMENTO**: Implementar observabilidade

  - Adicionar métricas de performance nos orquestradores principais
  - Implementar alertas para falhas críticas (payment processing)
  - Configurar dashboards para Redis hit rate e QStash job status
  - Documentar correlation ID para debugging distribuído
  - _Requirements: 2.1, 2.3_

- [ ] 8. **VALIDAÇÃO**: Revisar consistência de dados

  - Verificar transações atômicas no Firebase
  - Validar rollback scenarios em caso de falha
  - Confirmar eventual consistency entre pending_profiles e user_profiles
  - Testar cenários de falha em cada orquestrador
  - _Requirements: 4.5, 5.4_

- [ ] 9. **DOCUMENTAÇÃO TÉCNICA**: Criar guias específicos

  - Documentar padrões de uso do `unknown` vs tipos definidos
  - Criar guia de debugging com correlation IDs
  - Documentar padrões de retry e circuit breaker
  - Mapear todos os pontos de validação Zod
  - _Requirements: 1.2, 3.1, 3.4_

- [ ] 10. **FINALIZAÇÃO**: Preparar para produção otimizada

  - Revisar todas as configurações de TTL e timeouts
  - Otimizar queries Firebase para reduzir custos
  - Configurar rate limiting adequado
  - Documentar procedimentos de deploy e rollback
  - _Requirements: 2.2, 2.4_

## Métricas de Sucesso

### Antes das Correções
- Taxa de aprovação: ~70-75% (estimativa sem Device ID)
- Tempo de processamento: Variável (processamento síncrono)
- Manutenibilidade: Baixa (código duplicado)
- Conformidade arquitetural: 90% (problemas críticos identificados)

### Após Correções
- Taxa de aprovação: ~85-90% (com Device ID)
- Tempo de processamento: Consistente (arquitetura definida)
- Manutenibilidade: Alta (arquitetura modular respeitada)
- Conformidade arquitetural: 100%

## Checklist de Implementação

### Device ID (Prioridade 1)
- [ ] Adicionar script de segurança no index.html
- [ ] Implementar coleta de Device ID no MercadoPagoCheckout.tsx
- [ ] Atualizar payload de create-payment
- [ ] Testar em ambiente de desenvolvimento
- [ ] Validar aumento na taxa de aprovação

### Refatoração Webhook (Prioridade 2)
- [ ] Refatorar webhook para usar MercadoPagoService
- [ ] Remover chamadas diretas à API
- [ ] Testar validação HMAC
- [ ] Verificar logs de processamento

### Documentação (Contínuo)
- [x] Atualizar arquitetura-tecnica-sos-moto.md
- [x] Documentar problemas-criticos-e-correcoes.md
- [x] Integrar informações em .kiro
- [ ] Atualizar fluxos após correções

## RESUMO DO ESTADO ATUAL E PRÓXIMOS PASSOS

### ✅ **JÁ IMPLEMENTADO E FUNCIONANDO (70%)**

1. **Frontend**: React + shadcn/ui + MercadoPago Payment Brick
2. **APIs Core**: create-payment, webhook, get-profile, check-status
3. **Nova Arquitetura**: Domain entities, repositories, services (70% completo)
4. **Integrações**: MercadoPago, Firebase, Redis, QStash, AWS SES
5. **Processamento Assíncrono**: final-processor.ts funcionando
6. **Cache Strategy**: Redis com TTL 24h e graceful degradation

### ❌ **PROBLEMAS CRÍTICOS IDENTIFICADOS**

1. **MercadoPagoCheckout.tsx**: Falta Device ID e callbacks obrigatórios
2. **create-payment.ts**: Código duplicado com final-processor.ts
3. **email-sender.ts**: Precisa validação se está 100% funcional
4. **Documentação**: Desatualizada em relação ao código real

### 🎯 **PRIORIDADES PARA FINALIZAÇÃO (30% restante)**

1. **CRÍTICO**: Corrigir MercadoPagoCheckout.tsx (segurança)
2. **ALTO**: Remover código duplicado (manutenibilidade)
3. **MÉDIO**: Completar email-sender.ts (funcionalidade)
4. **BAIXO**: Otimizar performance e custos (eficiência)

### 📊 **ORQUESTRADORES PRINCIPAIS MAPEADOS**

| Orquestrador               | Responsabilidade               | Status                   | Próxima Ação                   |
| -------------------------- | ------------------------------ | ------------------------ | ------------------------------ |
| **create-payment.ts**      | Form → MercadoPago             | ⚠️ Tem código duplicado  | Remover processApprovedPayment |
| **mercadopago-webhook.ts** | Payment → QStash               | ✅ Funcionando           | Manter                         |
| **final-processor.ts**     | Payment → Profile → QR → Cache | ✅ Funcionando           | Manter                         |
| **email-sender.ts**        | Profile → Email                | ❓ Validar funcionamento | Testar completamente           |

### 🔄 **FLUXO DE DADOS MAPEADO**

```
Usuário → Form → create-payment → MercadoPago → webhook → QStash → final-processor → email-sender
         ↓                                                    ↓              ↓
   pending_profiles                                     user_profiles    Redis Cache
```

**Estado**: 90% implementado com arquitetura sólida, problemas críticos identificados
**Foco**: Correções críticas (Device ID + Webhook) e eliminação de código duplicado
**Próximos passos**: Implementar Device ID (MÁXIMA prioridade), refatorar webhook, definir arquitetura final
**Meta**: Sistema 100% funcional com taxa de aprovação otimizada e arquitetura consistente
