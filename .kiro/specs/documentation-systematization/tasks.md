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

## TAREFAS BASEADAS NO ESTADO ATUAL (70% IMPLEMENTADO)

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

**CONCLUSÃO**: O sistema está bem arquitetado e 70% funcional. Foco deve ser na correção dos problemas identificados e finalização dos 30% restantes, mantendo a qualidade e desacoplamento existentes.
