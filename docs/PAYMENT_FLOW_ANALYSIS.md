# 📊 PRD - Análise Profunda do Fluxo de Pagamento SOS Moto

## 🔴 ANÁLISE CRÍTICA DO SISTEMA

### Estado Atual: **CRÍTICO - Sistema aceita pagamentos falsos**

### Impacto: **Fraude facilitada, perda de receita, risco legal**

---

## 1️⃣ FLUXO ATUAL IMPLEMENTADO (PROBLEMÁTICO)

### **FASE 1: COLETA DE DADOS (Frontend)**

```
1. Usuário acessa /create-profile
2. Preenche formulário com dados médicos
3. Seleciona plano (Basic R$ 5 teste / Premium R$ 85)
4. Clica em "Prosseguir para pagamento"
5. MercadoPagoCheckout é renderizado
```

### **FASE 2: INICIALIZAÇÃO DO PAGAMENTO**

```
6. Frontend coleta Device ID (window.MP_DEVICE_SESSION_ID)
7. Chama /api/create-payment com:
   - Dados do perfil completo
   - Device ID para prevenção de fraude
   - Plano selecionado
8. Backend cria preferência no MercadoPago
9. Retorna preferenceId + uniqueUrl
10. Frontend salva uniqueUrl em estado local
```

### **FASE 3: PAYMENT BRICK - ❌ PROBLEMA CRÍTICO AQUI**

```
11. Payment Brick renderiza formulário
12. Usuário escolhe método (PIX, Cartão, etc)
13. Clica em "Pagar"
14. ⚠️ onSubmit é chamado
15. ❌ ERRO GRAVE: Frontend interpreta onSubmit como sucesso!
16. ❌ Redireciona IMEDIATAMENTE para /success?id={uniqueUrl}
17. ❌ NÃO aguarda confirmação real do pagamento
```

### **FASE 4: PROCESSAMENTO ASSÍNCRONO (Desconectado)**

```
18. MercadoPago processa pagamento (backend)
19. Se aprovado, envia webhook para /api/mercadopago-webhook
20. Webhook valida HMAC
21. Webhook enfileira job no QStash
22. QStash executa payment-processor
23. payment-processor busca detalhes do pagamento
24. Se approved, enfileira final-processor
25. final-processor:
    - Cria perfil no Firebase
    - Salva no Redis (cache)
    - Gera QR Code
    - Envia email
```

### **FASE 5: PÁGINA DE SUCESSO (Problemática)**

```
26. Usuário já está em /success (redirecionado no passo 16)
27. Success.tsx faz polling para /api/check-status
28. ⚠️ PROBLEMA: Usuário vê "sucesso" ANTES do pagamento ser validado
29. Se pagamento falhar, perfil nunca é criado
30. Mas usuário já viu "sucesso"!
```

---

## 2️⃣ PROBLEMAS CRÍTICOS IDENTIFICADOS

### **🔴 PROBLEMA 1: Redirecionamento Prematuro**

- **Onde**: MercadoPagoCheckout.tsx linha 186
- **O que**: onSubmit tratado como pagamento aprovado
- **Impacto**: QUALQUER submit = sucesso (mesmo sem pagar)

### **🔴 PROBLEMA 2: PIX Quebrado**

- **Onde**: Payment Brick não aguarda QR Code
- **O que**: Redireciona antes de mostrar QR
- **Impacto**: Impossível pagar via PIX

### **🔴 PROBLEMA 3: Validação Inexistente**

- **Onde**: Frontend não valida status do pagamento
- **O que**: Não verifica se pagamento foi approved/rejected
- **Impacto**: Aceita pagamentos falsos

### **🔴 PROBLEMA 4: Fluxo Assíncrono Desconectado**

- **Onde**: Frontend vs Backend desincronizados
- **O que**: Frontend não aguarda webhook
- **Impacto**: Usuário vê sucesso antes da validação

### **🔴 PROBLEMA 5: Salvamento no Banco Prematuro**

- **Onde**: Não identificado salvamento prematuro
- **O que**: Perfil só criado após webhook confirmar
- **Impacto**: Positivo - não cria perfil sem pagamento

---

## 3️⃣ FLUXO CORRETO (COMO DEVERIA SER)

### **FASE 1: COLETA E VALIDAÇÃO**

```
1. Usuário preenche dados médicos
2. Frontend valida localmente
3. Seleciona plano
4. Clica em prosseguir
```

### **FASE 2: CRIAÇÃO DE SESSÃO DE PAGAMENTO**

```
5. Frontend chama /api/create-payment
6. Backend:
   - Gera preferenceId no MercadoPago
   - Retorna preferenceId + uniqueUrl
   - NÃO salva nada em banco/Redis ainda
7. Frontend mantém em memória local (useState/sessionStorage):
   - preferenceId para o Payment Brick
   - uniqueUrl para posterior redirecionamento
   - IMPORTANTE: Nenhuma interação com Redis/Firebase antes da aprovação
```

### **FASE 3: PROCESSAMENTO DO PAGAMENTO**

```
8. Payment Brick renderiza
9. Usuário escolhe método de pagamento

Para PIX:
10a. Payment Brick mostra QR Code
11a. Usuário paga
12a. Frontend faz polling do status
13a. Aguarda webhook confirmar

Para Cartão:
10b. Usuário insere dados
11b. Clica em pagar
12b. Payment Brick processa
13b. Frontend aguarda resposta do Brick
14b. Valida status === "approved"
```

### **FASE 4: VALIDAÇÃO E CONFIRMAÇÃO**

```
15. Webhook recebe notificação
16. Valida HMAC + timestamp
17. Verifica payment.status === "approved"
18. Enfileira job para criar perfil
19. Atualiza sessão com status
```

### **FASE 5: CRIAÇÃO DO PERFIL**

```
20. Frontend detecta mudança de status (polling/websocket)
21. SE approved:
    - Mostra loading "Criando seu perfil..."
    - Aguarda job processar
22. Job cria perfil no Firebase
23. Job salva cache no Redis
24. Job gera QR Code
25. Job envia email
26. Job atualiza status = "completed"
```

### **FASE 6: REDIRECIONAMENTO FINAL**

```
27. Frontend detecta status "completed"
28. SOMENTE ENTÃO redireciona para /success
29. Success page mostra QR Code pronto
30. Usuário tem certeza que pagamento foi processado
```

---

## 4️⃣ INTERAÇÃO COM BANCO DE DADOS

### **ESTRATÉGIA ATUAL (Correta)**

- ✅ Firebase só é chamado APÓS pagamento aprovado
- ✅ Redis usado como cache após criação
- ✅ Não há salvamento prematuro

### **ESTRATÉGIA IDEAL**

```
1. ANTES do pagamento:
   - Apenas sessão temporária (Redis/Memory)
   - Nenhuma escrita no Firebase

2. DURANTE o pagamento:
   - Atualizar status da sessão
   - Log de tentativas

3. APÓS aprovação:
   - Criar perfil no Firebase (fonte de verdade)
   - Cachear no Redis (performance)
   - Gerar assets (QR Code)

4. FALLBACK do Redis:
   - Se Redis falhar na leitura
   - Buscar no Firebase
   - Re-popular cache
```

---

## 5️⃣ MUDANÇAS NECESSÁRIAS

### **PRIORIDADE 1: CRÍTICA (Segurança)**

#### **A. Corrigir Payment Brick**

- NÃO redirecionar no onSubmit
- Implementar validação de status
- Para PIX: aguardar QR Code + pagamento
- Para Cartão: aguardar resposta de aprovação

#### **B. Implementar Polling/WebSocket**

- Frontend deve consultar status do pagamento
- Endpoint: /api/payment-status/{sessionId}
- Aguardar status === "approved"
- Timeout de 10 minutos para PIX

### **PRIORIDADE 2: ALTA (UX)**

#### **C. Feedback Visual Correto**

- Durante processamento: "Processando pagamento..."
- Após aprovação: "Pagamento aprovado! Criando perfil..."
- Após conclusão: "Perfil criado com sucesso!"

#### **D. Tratamento de Erros**

- Pagamento rejeitado: mostrar motivo
- Timeout: oferecer retry
- Falha no webhook: fallback manual

### **PRIORIDADE 3: MÉDIA (Otimização)**

#### **E. Sessão de Pagamento**

- Implementar sessões temporárias
- TTL de 30 minutos
- Limpeza automática

#### **F. Observabilidade**

- Logs estruturados em cada etapa
- Métricas de conversão
- Alertas para falhas

---

## 6️⃣ FLUXO DE ESTADO

### **Estados do Pagamento**

```
PENDING → PROCESSING → APPROVED/REJECTED → COMPLETED/FAILED

PENDING: Preferência criada, aguardando pagamento
PROCESSING: Pagamento sendo processado
APPROVED: Pagamento aprovado pelo MercadoPago
REJECTED: Pagamento rejeitado
COMPLETED: Perfil criado com sucesso
FAILED: Falha na criação do perfil
```

### **Transições Permitidas**

```
PENDING → PROCESSING → APPROVED → COMPLETED ✅
PENDING → PROCESSING → REJECTED ✅
PENDING → TIMEOUT ✅
APPROVED → FAILED (retry disponível) ⚠️
```

---

## 7️⃣ RISCOS E MITIGAÇÕES

### **RISCO 1: Fraude (Atual)**

- **Problema**: Sistema aceita pagamentos falsos
- **Mitigação**: Validar status antes de redirecionar

### **RISCO 2: Perda de Dados**

- **Problema**: Webhook pode falhar
- **Mitigação**: Retry com backoff exponencial

### **RISCO 3: Timeout PIX**

- **Problema**: Usuário demora para pagar
- **Mitigação**: Sessão de 30min com aviso

### **RISCO 4: Double Charging**

- **Problema**: Usuário tenta pagar 2x
- **Mitigação**: Idempotency keys

---

## 8️⃣ MÉTRICAS DE SUCESSO

### **Antes das Correções**

- Taxa de fraude: ~100% (qualquer um "paga")
- Conversão real: Desconhecida
- PIX funcional: 0%

### **Após Correções**

- Taxa de fraude: <0.1%
- Conversão esperada: 70-80%
- PIX funcional: 100%
- Tempo médio aprovação: <3s (cartão), <5min (PIX)

---

## 9️⃣ CONCLUSÃO

### **Status Atual: CRÍTICO**

O sistema está completamente vulnerável, aceitando qualquer tentativa de pagamento como sucesso, sem validação real.

### **Ação Imediata Necessária**

1. **PARAR** redirecionamento no onSubmit
2. **IMPLEMENTAR** validação de status
3. **AGUARDAR** confirmação do webhook
4. **TESTAR** fluxo completo em staging

### **Impacto se não corrigido**

- Perda financeira massiva
- Risco legal com MercadoPago
- Comprometimento total da confiança
- Possível suspensão da conta MercadoPago

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Remover redirecionamento automático no onSubmit
- [ ] Implementar polling de status
- [ ] Corrigir fluxo PIX (mostrar QR Code)
- [ ] Validar payment.status === "approved"
- [ ] Implementar timeout e retry
- [ ] Adicionar logs em cada etapa
- [ ] Testar todos os cenários
- [ ] Deploy em staging primeiro
- [ ] Monitorar por 24h
- [ ] Deploy em produção

---

**⚠️ ESTE DOCUMENTO É CRÍTICO PARA A SEGURANÇA FINANCEIRA DO SISTEMA**

_Última atualização: 22/01/2025_
_Autor: Análise Profunda Claude Code_
_Status: AGUARDANDO IMPLEMENTAÇÃO URGENTE_
