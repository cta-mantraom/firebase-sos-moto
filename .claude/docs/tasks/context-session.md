# 📋 Contexto da Sessão - Sistema Memoryys

## 🎯 Projeto: Memoryys - Sistema de Emergência Médica

### **Visão Geral**
Sistema serverless que permite motociclistas criarem perfis médicos de emergência acessíveis via QR Code, facilitando atendimento médico rápido em acidentes.

### **Arquitetura Atual**
- **Frontend**: React 18 + Vite + TypeScript + Tailwind + Shadcn/UI
- **Backend**: Vercel Functions (Node.js 18) + Firebase + AWS SES
- **Pagamentos**: MercadoPago SDK com Device ID obrigatório
- **Cache**: Upstash Redis + QStash para filas
- **Deploy**: Vercel com preview/production

### **Stack Técnico Validado**
```
✅ Domain-Driven Design implementado
✅ Factory Pattern para Firebase (Serverless)
✅ Event-driven com QStash (Async processing)
✅ TypeScript strict mode (noImplicitAny: true)
✅ Zod validation em todos endpoints
✅ HMAC validation em webhooks MercadoPago
✅ Structured logging com correlation IDs
```

## 🤖 Sistema de Agentes Implementado

### **1. Frontend Agent** 
- **Especialidade**: React, TypeScript, Tailwind, Shadcn/UI
- **Responsabilidade**: Componentes UI, formulários, MercadoPago Checkout
- **Trigger**: `react`, `component`, `tsx`, `ui`, `tailwind`
- **Status**: ✅ Implementado

### **2. Backend Agent**
- **Especialidade**: Firebase, Vercel Functions, APIs serverless
- **Responsabilidade**: Endpoints, integração Firebase/AWS, Factory Pattern
- **Trigger**: `api`, `firebase`, `serverless`, `backend`, `vercel`
- **Status**: ✅ Implementado

### **3. Payment Agent** 
- **Especialidade**: MercadoPago, Device ID, HMAC, taxa aprovação
- **Responsabilidade**: Pagamentos seguros, webhook validation
- **Trigger**: `mercadopago`, `payment`, `device id`, `hmac`, `webhook`
- **Status**: ✅ Implementado

### **4. Medical Validator**
- **Especialidade**: Dados médicos, LGPD, emergência médica
- **Responsabilidade**: Validação dados críticos, compliance LGPD
- **Trigger**: `medical`, `emergency`, `bloodtype`, `allergy`, `lgpd`
- **Status**: ✅ Implementado

### **5. Deploy Orchestrator**
- **Especialidade**: Deploy, CI/CD, monitoring, operações
- **Responsabilidade**: Deploy seguro, rollback, health checks
- **Trigger**: `deploy`, `build`, `preview`, `production`, `ci`
- **Status**: ✅ Implementado

## 🔧 Hooks Automáticos Ativos

### **Pre-Tool Hooks**
- **Secrets Scanner**: Valida comandos bash para evitar exposição de secrets
- **Status**: ✅ Ativo

### **Post-Tool Hooks** 
- **TypeScript Validator**: Executa após edição de .ts/.tsx
- **MercadoPago Validator**: Executa após edição de arquivos de pagamento
- **Status**: ✅ Ativo

## 📁 Estrutura Organizacional

```
.claude/
├── settings.json                 ✅ Configurações principais
├── agents/                       ✅ 5 agentes especializados
│   ├── frontend-agent.md        ✅ React/TypeScript specialist
│   ├── backend-agent.md         ✅ Firebase/APIs specialist
│   ├── payment-agent.md         ✅ MercadoPago specialist
│   ├── medical-validator.md     ✅ Medical data specialist
│   └── deploy-orchestrator.md   ✅ Deploy/Operations specialist
├── commands/                     ✅ Comandos personalizados
│   ├── validate-flow.md         ✅ Validação end-to-end
│   ├── security-audit.md        ✅ Auditoria segurança
│   └── emergency-fix.md         ✅ Correções emergenciais
├── docs/                        ✅ Documentação viva
│   ├── tasks/
│   │   └── context-session.md   ✅ Este arquivo
│   ├── plans/                   📝 Em desenvolvimento
│   └── review-reports/          📝 Em desenvolvimento
├── hooks/                       ✅ Validadores Python
│   ├── mercadopago-validator.py ✅ Valida integração MP
│   ├── typescript-validator.py  ✅ Valida TypeScript
│   └── secrets-scanner.py       ✅ Escaneia secrets
└── mcp/                         📝 Próxima implementação
```

## 🚨 Regras Críticas em Vigor

### **Arquiteturais**
- **NUNCA usar `any`** em TypeScript - Hook bloqueia
- **SEMPRE validar dados** com Zod - Obrigatório em endpoints
- **Factory Pattern obrigatório** para Firebase - Serverless requirement
- **Event-driven apenas** - Webhooks não processam síncronamente
- **Device ID obrigatório** - MercadoPago approval rate crítica

### **Médicas**
- **Tipo sanguíneo obrigatório** - Crítico para transfusão
- **Alergias validadas** - Evitar medicação perigosa
- **QR Code < 2s carregamento** - Emergência médica
- **LGPD compliance rigorosa** - Dados sensíveis protegidos
- **Auditoria de acesso** - Rastreabilidade obrigatória

### **Operacionais**
- **99.9% uptime** - Sistema de emergência 24/7
- **Zero downtime deploys** - Blue-green strategy
- **Rollback automático** - Em caso de falha
- **Health checks obrigatórios** - Pré e pós deploy

## 📊 Métricas Atuais

### **Qualidade de Código**
- TypeScript: ✅ Strict mode ativo
- ESLint: ✅ Configurado e funcionando
- Build: ✅ Sem erros
- Testes: ⚠️ Coverage a melhorar

### **Performance**
- QR Code loading: 🎯 Meta < 2s
- API responses: 🎯 Meta < 500ms P95
- Build time: ✅ ~30s
- Deploy time: ✅ ~2min

### **Segurança**
- Secrets scanning: ✅ Ativo
- HMAC validation: ✅ Implementado
- Input validation: ✅ Zod em uso
- LGPD compliance: ✅ Em desenvolvimento

## 🔄 Comunicação Entre Agentes

### **Protocolo de Handoff**
1. **Agente Principal** identifica tarefa especializada
2. **Agente Principal** aciona agente especializado via Task tool
3. **Agente Especializado** executa com contexto completo
4. **Agente Principal** recebe resultado e continua workflow

### **Contexto Compartilhado**
- **Correlation ID**: Rastreamento cross-agent
- **Session State**: Mantido em arquivos .md
- **Error Propagation**: Erros reportados ao agente principal
- **Progress Tracking**: Via TodoWrite tool

### **Exemplo de Comunicação**
```
User: "Implementar checkout MercadoPago com Device ID"

1. Claude Principal → Identifica tarefa de pagamento
2. Claude Principal → Task(payment-agent) 
3. Payment Agent → Implementa Device ID collection
4. Payment Agent → Aciona frontend-agent para UI
5. Frontend Agent → Implementa componente React
6. Payment Agent → Valida integração completa
7. Payment Agent → Reporta sucesso ao Principal
```

## 📝 Estado da Sessão Atual

### **Tarefas Completadas** ✅
- [x] Estrutura de diretórios criada
- [x] Settings.json configurado
- [x] 5 agentes especializados implementados
- [x] Hooks automáticos funcionando
- [x] Comandos slash personalizados criados

### **Tarefas Em Progresso** 🔄
- [ ] Sistema de comunicação entre agentes
- [ ] Configuração MCP servers

### **Próximos Passos** 📋
- [ ] Templates de relatórios automáticos
- [ ] Dashboard de métricas
- [ ] Integração CI/CD avançada

## ⚠️ Alertas e Monitoramento

### **Health Checks Ativos**
- TypeScript validation em cada edit
- MercadoPago validation em arquivos de pagamento
- Secrets scanning em comandos bash

### **Alertas Configurados**
- Build failure = Block deploy
- TypeScript errors = Block commit
- Secrets exposure = Block command
- HMAC missing = Block webhook

## 🎯 Objetivos da Sessão

### **Curto Prazo (Esta sessão)**
- ✅ Implementar sistema de agentes especializados
- 🔄 Configurar comunicação entre agentes
- 📋 Configurar MCP servers

### **Médio Prazo (Próximas sessões)**
- Otimizar performance de QR Code (< 2s)
- Melhorar taxa aprovação MercadoPago (85%+)
- Implementar testes automatizados completos

### **Longo Prazo (Roadmap)**
- Dashboard de métricas em tempo real
- Alertas proativos de performance
- Integração com sistemas de emergência

---

**📌 Este contexto é atualizado automaticamente pelos agentes durante a sessão para manter sincronização e historicidade das decisões técnicas.**

**Última atualização**: $(date) - Sistema de agentes especializados implementado com sucesso