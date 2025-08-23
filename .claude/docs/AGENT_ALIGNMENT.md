# 📋 DOCUMENTO DE ALINHAMENTO DOS AGENTES - SOS MOTO

## 🎯 PROPÓSITO
Este documento estabelece as regras e diretrizes que TODOS os agentes devem seguir ao trabalhar no projeto SOS Moto.

---

## 🔴 REGRAS CRÍTICAS PARA TODOS OS AGENTES

### **1. ESCOPO DE ATUAÇÃO**

#### **ANÁLISE vs IMPLEMENTAÇÃO**
- **Quando solicitado ANÁLISE**: Criar apenas documentação, relatórios, PRDs
- **Quando solicitado IMPLEMENTAÇÃO**: Criar código somente com permissão explícita
- **NUNCA**: Criar código por iniciativa própria ou "para ajudar"

#### **Exemplo de Solicitação de Análise**
```
"Analise o fluxo de pagamento"
"Verifique os problemas no sistema"
"Faça uma análise profunda"
```
**Resposta**: Criar documento de análise SEM implementar código

#### **Exemplo de Solicitação de Implementação**
```
"Corrija o problema do pagamento"
"Implemente a validação"
"Crie o endpoint de status"
```
**Resposta**: Implementar código conforme solicitado

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### **FLUXO DE PAGAMENTO QUEBRADO**

#### **Problema Principal**
- Frontend redireciona no `onSubmit` do Payment Brick
- `onSubmit` ≠ pagamento aprovado
- Sistema aceita qualquer tentativa como sucesso

#### **Solução Necessária**
1. NÃO redirecionar no onSubmit
2. Implementar polling de status
3. Aguardar webhook confirmar pagamento
4. Só então redirecionar para success

#### **Interação com Banco de Dados**
- **ANTES da aprovação**: NENHUMA escrita em banco/Redis
- **DURANTE processamento**: Apenas memória local (useState/sessionStorage)
- **APÓS aprovação confirmada**: Criar perfil no Firebase e cachear no Redis

---

## 📝 DIRETRIZES DE DESENVOLVIMENTO

### **TypeScript**
```typescript
// ❌ NUNCA
function processPayment(data: any) { // PROIBIDO usar any
  const result: any = data; // PROIBIDO
}

// ✅ SEMPRE
interface PaymentData {
  amount: number;
  payerId: string;
  status: 'pending' | 'approved' | 'rejected';
}

function processPayment(data: PaymentData): PaymentResult {
  // Código tipado corretamente
}
```

### **Ambiente de Produção**
- Sistema REAL com pagamentos REAIS
- NÃO criar código de teste/mock
- NÃO adicionar console.log desnecessários
- SEMPRE considerar performance e segurança

### **Valores dos Planos**
- **Basic**: R$ 5,00 (TESTE TEMPORÁRIO)
- **Premium**: R$ 85,00
- Valor R$ 5 é INTENCIONAL para testes reais

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Camadas (NÃO MODIFICAR)**
```
lib/
├── domain/         # Entidades e validações
├── services/       # Lógica de negócio
├── repositories/   # Acesso a dados
└── config/         # Configuração centralizada

api/
├── endpoints/      # Vercel Functions
└── processors/     # Jobs assíncronos
```

### **Fluxo de Dados**
1. **Frontend** → API endpoints
2. **API** → Services (validação e lógica)
3. **Services** → Repositories (persistência)
4. **Webhooks** → QStash (processamento assíncrono)
5. **Processors** → Firebase/Redis (após aprovação)

---

## ⚠️ PROBLEMAS COMUNS A EVITAR

### **1. Criar Código Sem Permissão**
- **Problema**: Agente cria código quando pedido apenas análise
- **Solução**: Verificar se a solicitação é de análise ou implementação

### **2. Usar `any` em TypeScript**
- **Problema**: Código sem type safety
- **Solução**: Sempre criar interfaces e tipos específicos

### **3. Processar Síncronamente em Webhooks**
- **Problema**: Timeout e falhas em webhooks
- **Solução**: Webhooks devem APENAS enfileirar jobs

### **4. Salvar Antes da Aprovação**
- **Problema**: Criar perfil sem pagamento confirmado
- **Solução**: Aguardar webhook confirmar status "approved"

### **5. Redirecionar Prematuramente**
- **Problema**: Mostrar sucesso sem pagamento real
- **Solução**: Implementar polling e aguardar confirmação

---

## 📊 MÉTRICAS DE SUCESSO

### **Taxa de Aprovação de Pagamentos**
- **Meta**: 85%+
- **Fatores Críticos**:
  - Device ID sempre presente
  - HMAC validation em webhooks
  - Dados completos do pagador

### **Segurança**
- **Zero** vulnerabilidades de pagamento
- **100%** dos webhooks validados com HMAC
- **Zero** exposição de secrets em logs

### **Performance**
- **Webhooks**: < 3s resposta
- **Carregamento**: < 2s páginas críticas
- **QStash**: Processamento assíncrono sempre

---

## 🔄 PROCESSO DE TRABALHO

### **1. Receber Solicitação**
- Identificar se é análise ou implementação
- Verificar escopo e permissões

### **2. Executar Tarefa**
- Se análise: criar documentação
- Se implementação: desenvolver código
- Sempre seguir arquitetura existente

### **3. Validar Resultado**
- TypeScript: `npm run type-check`
- Build: `npm run build`
- Sem `any`, sem mocks, sem testes em produção

### **4. Documentar Ações**
- Registrar em logs do agente
- Atualizar TODOs se necessário
- Sincronizar com outros agentes

---

## 🚀 CHECKLIST PARA AGENTES

Antes de executar qualquer ação:

- [ ] Solicitação é de análise ou implementação?
- [ ] Tenho permissão explícita para criar código?
- [ ] Estou seguindo a arquitetura existente?
- [ ] Código está tipado corretamente (sem `any`)?
- [ ] É código de produção (sem mocks/testes)?
- [ ] Webhooks apenas enfileiram jobs?
- [ ] Banco só é acessado após aprovação?
- [ ] Frontend aguarda confirmação real?

---

## 📚 DOCUMENTOS DE REFERÊNCIA

- **Arquitetura**: `/CLAUDE.md`
- **Fluxo de Pagamento**: `/docs/PAYMENT_FLOW_ANALYSIS.md`
- **Deploy**: `/.claude/agents/deploy-orchestrator.md`
- **Configuração**: `/lib/config/env.ts`

---

**IMPORTANTE**: Este documento deve ser consultado por TODOS os agentes antes de executar qualquer tarefa. O não cumprimento destas diretrizes resultará em código rejeitado e retrabalho.

---

*Última atualização: 22/01/2025*
*Versão: 1.0*
*Status: ATIVO - Leitura obrigatória para todos os agentes*