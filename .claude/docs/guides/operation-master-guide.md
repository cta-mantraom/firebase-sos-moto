# 🎯 Guia Mestre de Operação - Sistema de Agentes SOS Moto

**Documento Principal**: Guia completo para operar o sistema de agentes especializados  
**Versão**: 1.0  
**Data**: 19 de agosto de 2025  
**Sistema**: SOS Moto - Emergency Medical System

## 📋 Índice
- [🚀 Setup Inicial](#-setup-inicial)
- [🤖 Agentes Especializados](#-agentes-especializados)
- [🔌 MCP Servers](#-mcp-servers)
- [⚡ Execução de Comandos](#-execução-de-comandos)
- [🔍 Validação de Funcionamento](#-validação-de-funcionamento)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🚀 Setup Inicial

### **1. Configuração MCP Server Vercel (CRÍTICO)**

O comando mencionado deve ser executado para configurar o MCP server específico do projeto:

```bash
# Comando correto para adicionar MCP server Vercel específico
claude mcp add --transport http mcp-firebase-sos-moto https://mcp.vercel.com/cta-mantraom/firebase-sos-moto
```

**⚠️ IMPORTANTE**: Este comando NÃO vai para `.claude/mcp/` - ele configura o MCP server globalmente no Claude Code CLI.

### **Estrutura de Configuração**

```
Claude Code Global Config:
├── mcp-servers/
│   └── mcp-firebase-sos-moto  ← Configurado pelo comando CLI
│
Projeto Local:
├── .claude/
│   ├── settings.json          ← enableAllProjectMcpServers: true
│   └── mcp/                   ← Configurações locais de fallback
│       ├── servers.json       ← Backup config se MCP global falhar
│       └── integration-guide.md
```

### **2. Verificação de Setup**

```bash
# Verificar MCP servers disponíveis
claude mcp list

# Verificar conectividade
claude mcp status mcp-firebase-sos-moto

# Testar comunicação
claude mcp test mcp-firebase-sos-moto
```

### **3. Validação do Sistema**

```bash
# Verificar estrutura .claude/
ls -la .claude/

# Validar hooks
python3 .claude/hooks/typescript-validator.py
python3 .claude/hooks/mercadopago-validator.py
python3 .claude/hooks/secrets-scanner.py

# Testar agentes
/validate-flow
```

---

## 🤖 Agentes Especializados

### **Sistema de Acionamento**

Os agentes são acionados através de **trigger patterns** e podem ser chamados:

1. **Automaticamente**: Claude Code detecta padrões e aciona agente apropriado
2. **Manualmente**: Usando Task tool com nome específico
3. **Via Comandos**: Comandos slash pré-configurados

### **⚠️ IMPORTANTE: Análise vs Implementação**

#### **Solicitações de ANÁLISE (criar apenas documentação)**
- "Analise o fluxo de pagamento"
- "Verifique os problemas no componente"
- "Faça uma análise profunda do sistema"
- "Documente o processo de deploy"

#### **Solicitações de IMPLEMENTAÇÃO (criar código)**
- "Corrija o bug no pagamento"
- "Implemente a validação de CPF"
- "Crie o componente de checkout"
- "Adicione o endpoint de status"

**🔴 REGRA CRÍTICA**: Agentes NUNCA devem criar código sem solicitação explícita de implementação

### **🎨 Frontend Agent**

**Trigger Patterns**: `react`, `component`, `tsx`, `frontend`, `ui`, `tailwind`, `shadcn`

**Exemplos de Prompts**:

```typescript
// Prompt 1: Componente React
"Criar um componente de formulário médico com validação Zod para alergias usando Shadcn/UI"

// Prompt 2: MercadoPago Integration
"Implementar Device ID collection no checkout MercadoPago com error handling"

// Prompt 3: Performance
"Otimizar componente QRCodePreview para carregar em menos de 2 segundos"

// Prompt 4: Acessibilidade
"Adicionar ARIA labels e navegação por teclado no formulário de emergência"

// Prompt 5: Responsive Design
"Tornar o componente MedicalData responsivo para telas de 320px"
```

**Fluxo de Execução**:
1. Claude Principal detecta padrão frontend
2. Task tool aciona `frontend-agent`
3. Frontend Agent analisa componentes existentes
4. Implementa solução seguindo padrões Shadcn/UI
5. Hook TypeScript valida código automaticamente
6. Retorna resultado para Claude Principal

### **⚙️ Backend Agent**

**Trigger Patterns**: `api`, `firebase`, `serverless`, `vercel`, `function`, `backend`, `endpoint`

**Exemplos de Prompts**:

```typescript
// Prompt 1: API Endpoint
"Criar endpoint /api/update-medical-data com validação Zod e Factory Pattern Firebase"

// Prompt 2: Serverless Optimization
"Otimizar função create-payment para cold start < 500ms"

// Prompt 3: Integration
"Implementar backup automático de dados médicos via AWS SES"

// Prompt 4: Cache Strategy
"Implementar cache Redis para acelerar acesso a perfis de emergência"

// Prompt 5: Health Check
"Criar endpoint de health check que valida Firebase, Redis e AWS SES"
```

**Fluxo de Execução**:
1. Detecta padrão backend
2. Task tool aciona `backend-agent`
3. Backend Agent verifica arquitetura serverless
4. Implementa usando Factory Pattern obrigatório
5. Structured logging com correlation IDs
6. Hooks validam secrets e TypeScript

### **💳 Payment Agent**

**Trigger Patterns**: `mercadopago`, `payment`, `device id`, `hmac`, `webhook`, `checkout`

**Exemplos de Prompts**:

```typescript
// Prompt 1: Device ID Crítico
"Garantir que 100% dos pagamentos tenham Device ID coletado antes do checkout"

// Prompt 2: Taxa de Aprovação
"Otimizar preferência MercadoPago para taxa de aprovação 85%+"

// Prompt 3: HMAC Security
"Implementar validação HMAC rigorosa no webhook mercadopago-webhook.ts"

// Prompt 4: Webhook Performance
"Otimizar webhook para responder em < 5 segundos e processar assincronamente"

// Prompt 5: Payment Recovery
"Implementar retry logic para pagamentos falhados com exponential backoff"
```

**Fluxo de Execução**:
1. Detecta padrão payment
2. Task tool aciona `payment-agent`
3. Payment Agent verifica Device ID obrigatório
4. Implementa com MercadoPagoService (nunca API direta)
5. Hook MercadoPago valida integração
6. Valida HMAC e processamento assíncrono

### **🏥 Medical Validator**

**Trigger Patterns**: `medical`, `emergency`, `bloodtype`, `allergy`, `medication`, `lgpd`, `qr`

**Exemplos de Prompts**:

```typescript
// Prompt 1: Validação LGPD
"Implementar anonimização de dados médicos em logs conforme LGPD"

// Prompt 2: QR Code Emergência
"Otimizar QR Code para carregar dados críticos em < 2 segundos"

// Prompt 3: Validação Médica
"Validar tipo sanguíneo e alergias com schemas Zod rigorosos"

// Prompt 4: Cache Emergência
"Implementar cache Redis para dados médicos com TTL 24h"

// Prompt 5: Audit Trail
"Criar auditoria completa de acesso a dados médicos"
```

**Fluxo de Execução**:
1. Detecta padrão medical
2. Task tool aciona `medical-validator`
3. Medical Validator prioriza dados críticos
4. Implementa LGPD compliance rigorosa
5. Valida schemas médicos Zod
6. Otimiza para performance de emergência

### **🚀 Deploy Orchestrator**

**Trigger Patterns**: `deploy`, `build`, `preview`, `production`, `ci`, `cd`, `vercel`

**Exemplos de Prompts**:

```typescript
// Prompt 1: Deploy Seguro
"Executar deploy preview com validação completa antes de produção"

// Prompt 2: Health Monitoring
"Implementar monitoramento contínuo pós-deploy com rollback automático"

// Prompt 3: Emergency Deploy
"Executar deploy emergencial para corrigir falha crítica em < 10 minutos"

// Prompt 4: Performance Validation
"Validar que deploy não degradou performance de QR Code loading"

// Prompt 5: Blue-Green Deploy
"Implementar deploy blue-green com zero downtime"
```

**Fluxo de Execução**:
1. Detecta padrão deploy
2. Task tool aciona `deploy-orchestrator`
3. Deploy Orchestrator executa validações pré-deploy
4. Coordena deploy com health checks
5. Monitora métricas pós-deploy
6. Rollback automático se falhas detectadas

---

## 🔌 MCP Servers

### **Configuração Global vs Local**

**Global (CLI Command)**:
```bash
# Adiciona MCP server globalmente
claude mcp add --transport http mcp-firebase-sos-moto https://mcp.vercel.com/cta-mantraom/firebase-sos-moto

# Listagem global
claude mcp list
```

**Local (Projeto)**:
```json
// .claude/settings.json
{
  "enableAllProjectMcpServers": true  // Ativa MCP servers do projeto
}

// .claude/mcp/servers.json  
// Configuração de fallback se global falhar
```

### **Servers Disponíveis**

1. **mcp-firebase-sos-moto**: Server específico do projeto (Vercel)
2. **vercel**: Deploy e environment management
3. **mercadopago**: Payment processing e webhooks
4. **firebase**: Database e storage operations
5. **upstash**: Cache Redis e QStash queues
6. **aws-ses**: Email service management

### **Uso pelos Agentes**

```typescript
// Backend Agent usando MCP Vercel
await mcp.vercel.deployPreview({
  environment: 'preview',
  healthCheck: true
});

// Payment Agent usando MCP MercadoPago
const preference = await mcp.mercadopago.createPreference(paymentData);

// Medical Validator usando MCP Firebase
await mcp.firebase.backupCollection('profiles', { anonymize: true });
```

---

## ⚡ Execução de Comandos

### **Comandos Slash Disponíveis**

#### **/validate-flow**
```bash
# Executa validação completa end-to-end
/validate-flow

# Resultado esperado:
✅ TypeScript check passed
✅ ESLint validation passed  
✅ Build completed successfully
✅ MercadoPago integration validated
✅ Medical data schemas validated
✅ Deploy readiness confirmed
```

#### **/security-audit [scope]**
```bash
# Auditoria completa
/security-audit full

# Auditoria médica específica
/security-audit medical

# Auditoria de pagamentos
/security-audit payment

# Auditoria LGPD
/security-audit lgpd
```

#### **/emergency-fix [type]**
```bash
# Problemas de pagamento
/emergency-fix payment

# QR Code não carrega
/emergency-fix qr-access

# Webhook falhando
/emergency-fix webhook

# Performance crítica
/emergency-fix performance

# Dados corrompidos
/emergency-fix data-corruption
```

### **Execução Manual de Agentes**

```typescript
// Acionar agente específico via Task tool
> Use frontend-agent to optimize QR Code component performance

> Use backend-agent to implement Firebase backup strategy

> Use payment-agent to improve MercadoPago approval rate

> Use medical-validator to ensure LGPD compliance for emergency data

> Use deploy-orchestrator to execute zero-downtime deployment
```

---

## 🔍 Validação de Funcionamento

### **1. Validação de Hooks**

```bash
# Testar hook TypeScript
echo "let test: any = 'invalid';" > test.ts
# Esperado: Hook deve bloquear com erro

# Testar hook MercadoPago
grep -r "createHmac" api/
# Esperado: Validação HMAC encontrada

# Testar hook Secrets
echo 'export const token = "APP_USR-secret";' > test.ts
# Esperado: Hook deve detectar secret exposure
```

### **2. Validação de Agentes**

```typescript
// Teste Frontend Agent
"Criar botão Shadcn/UI simples"
// Esperado: Componente React com import correto

// Teste Backend Agent  
"Criar endpoint /api/test com validação Zod"
// Esperado: Function com Factory Pattern

// Teste Payment Agent
"Validar Device ID em checkout"
// Esperado: Implementação com MP_DEVICE_SESSION_ID

// Teste Medical Validator
"Validar tipo sanguíneo A+"
// Esperado: Schema Zod com enum correto

// Teste Deploy Orchestrator
"Verificar status de deploy"
// Esperado: Health checks implementados
```

### **3. Validação de MCP**

```bash
# Verificar conectividade
claude mcp status

# Testar server específico
claude mcp test mcp-firebase-sos-moto

# Validar fallback
# Desconectar MCP e verificar se fallback funciona
```

### **4. Métricas de Sucesso**

| Componente | Métrica | Valor Esperado |
|------------|---------|----------------|
| TypeScript | Errors | 0 |
| ESLint | Errors | 0 |
| Build Time | Duration | < 30s |
| Hook Response | Time | < 2s |
| Agent Response | Time | < 10s |
| MCP Connectivity | Status | Connected |

---

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **Hook TypeScript Falhando**
```bash
# Sintomas: Edições não validam TypeScript
# Causa: Hook Python com erro
# Solução:
python3 .claude/hooks/typescript-validator.py
npx tsc --noEmit
```

#### **Agente Não Responde**
```bash
# Sintomas: Task tool não aciona agente
# Causa: Trigger pattern não reconhecido
# Solução: Use nome específico
> Use payment-agent to fix MercadoPago integration
```

#### **MCP Server Desconectado**
```bash
# Sintomas: Comandos MCP falham
# Causa: Servidor indisponível
# Solução:
claude mcp restart mcp-firebase-sos-moto
# Fallback: Usar config local em .claude/mcp/
```

#### **Hooks Executando Múltiplas Vezes**
```bash
# Sintomas: Hook executa repetidamente
# Causa: Configuração duplicada em settings.json
# Solução: Verificar matchers únicos
```

### **Debug Mode**

```bash
# Ativar debug completo
export CLAUDE_DEBUG=1
export CLAUDE_MCP_DEBUG=1

# Ver logs detalhados
tail -f ~/.claude/logs/debug.log

# Verificar execução de hooks
tail -f ~/.claude/logs/hooks.log
```

### **Recovery Procedures**

```bash
# Reset completo de configuração
claude config reset

# Re-adicionar MCP server
claude mcp add --transport http mcp-firebase-sos-moto https://mcp.vercel.com/cta-mantraom/firebase-sos-moto

# Validar sistema
/validate-flow
```

---

## 📊 Monitoramento Contínuo

### **Health Checks Automáticos**

```bash
# Executar a cada 5 minutos
watch -n 300 '/validate-flow'

# Monitorar performance
watch -n 60 'curl -w "%{time_total}" https://sosmoto.com.br/api/health'
```

### **Métricas Críticas**

- **Agent Response Time**: < 10s
- **Hook Execution Time**: < 2s  
- **MCP Connectivity**: 99.9%
- **Build Success Rate**: 100%
- **Deploy Success Rate**: > 95%

### **Alertas Configurados**

- TypeScript errors → Block commit
- Secret exposure → Block command
- MCP disconnection → Fallback mode
- Agent timeout → Manual intervention
- Deploy failure → Automatic rollback

---

## 🎯 Próximos Passos

1. **Executar setup inicial** com comando MCP
2. **Validar funcionamento** com `/validate-flow`
3. **Testar cada agente** individualmente
4. **Configurar monitoramento** contínuo
5. **Documentar workflows** específicos do projeto

**⚠️ CRÍTICO**: Este é um sistema de emergência médica. Cada componente deve funcionar perfeitamente para salvar vidas.

---

**📞 Suporte**: Consulte os outros guias em `.claude/docs/guides/` para informações específicas sobre prompts, fluxos e recovery procedures.