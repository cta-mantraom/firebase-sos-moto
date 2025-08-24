# 🎯 Manual de Prompts por Agente - Sistema Memoryys

**Guia Prático**: Como usar cada agente especializado com prompts eficazes  
**Última Atualização**: 19 de agosto de 2025  
**Sistema**: Claude Code Agent System

## 📚 Índice
- [🎨 Frontend Agent](#-frontend-agent)
- [⚙️ Backend Agent](#️-backend-agent)
- [💳 Payment Agent](#-payment-agent)
- [🏥 Medical Validator](#-medical-validator)
- [🚀 Deploy Orchestrator](#-deploy-orchestrator)
- [🔄 Combinações de Agentes](#-combinações-de-agentes)
- [❌ Anti-Padrões](#-anti-padrões)

---

## 🎨 Frontend Agent

### **Trigger Patterns**
`react`, `component`, `tsx`, `frontend`, `ui`, `interface`, `tailwind`, `css`, `design`, `responsive`, `modal`, `form`, `shadcn`

### **Especialidades**
- React 18 + TypeScript strict
- Shadcn/UI components
- Tailwind CSS styling
- MercadoPago Checkout integration
- Responsive design
- Acessibilidade (WCAG)

### **Prompts Eficazes**

#### **🔥 Prompt 1: Componente Médico Completo**
```typescript
"Criar componente MedicalDataForm usando Shadcn/UI que coleta:
- Tipo sanguíneo (select com A+, A-, B+, B-, AB+, AB-, O+, O-)
- Lista de alergias (input array com validação)
- Medicamentos atuais (textarea com separação por linha)
- Contatos de emergência (form array com nome e telefone)

Requisitos:
- Validação Zod completa
- React Hook Form integration
- Error states visuais
- ARIA labels para acessibilidade
- Loading states durante submit"
```

**Resultado Esperado**: Componente React tipado, validação rigorosa, UX otimizada para emergência médica.

#### **🔥 Prompt 2: MercadoPago Checkout Otimizado**
```typescript
"Otimizar componente MercadoPagoCheckout para taxa aprovação 85%+:
- Garantir Device ID collection OBRIGATÓRIA
- Pré-preencher dados do usuário
- Implementar retry logic para falhas
- Estados de loading claros
- Error handling com mensagens específicas
- Progress indicator durante processamento

Validar:
- MP_DEVICE_SESSION_ID está sendo coletado
- Email está pré-preenchido
- Device fingerprinting completo"
```

**Resultado Esperado**: Checkout otimizado para aprovação máxima, UX fluida, error handling robusto.

#### **🔥 Prompt 3: QR Code Preview Emergência**
```typescript
"Criar QRCodePreview component otimizado para EMERGÊNCIA:
- Carregamento < 2 segundos OBRIGATÓRIO
- Alto contraste para visibilidade
- Botão download PNG grande
- Instruções de uso em português
- Responsive para mobile-first
- Fallback se QR não carrega

Design:
- Background branco puro
- QR Code centralizado
- Texto grande e legível
- Botões touch-friendly (44px mínimo)"
```

**Resultado Esperado**: Interface crítica para emergência, performance otimizada, usabilidade máxima.

#### **🔥 Prompt 4: Página Memorial Responsiva**
```typescript
"Otimizar página Memorial.tsx para acesso RÁPIDO por socorristas:
- Layout mobile-first (320px → desktop)
- Informações hierarquizadas por criticidade
- Botões de ligação direta para contatos
- Alto contraste para legibilidade
- Carregamento progressivo
- Offline-first design

Prioridade visual:
1. TIPO SANGUÍNEO (maior destaque)
2. Alergias principais
3. Medicamentos críticos
4. Contatos emergência
5. Informações complementares"
```

**Resultado Esperado**: Interface de emergência otimizada para salvamento de vidas, acesso instantâneo a dados críticos.

#### **🔥 Prompt 5: Formulário Acessível**
```typescript
"Implementar acessibilidade WCAG AA no formulário principal:
- Navegação completa por teclado
- Screen reader compatibility
- Labels descritivos
- Contrast ratio 4.5:1 mínimo
- Error announcements
- Focus management

Testar com:
- Tab navigation
- Screen reader (NVDA/JAWS)
- Zoom 200% functionality
- High contrast mode"
```

**Resultado Esperado**: Formulário 100% acessível, inclusivo para usuários com deficiências.

### **Prompts de Manutenção**

```typescript
// Atualização de componentes
"Atualizar todos os componentes Shadcn/UI para versão mais recente e verificar compatibilidade"

// Performance audit
"Analisar bundle size e otimizar componentes com lazy loading"

// Responsive testing
"Testar todos os componentes em breakpoints 320px, 768px, 1024px, 1440px"
```

---

## ⚙️ Backend Agent

### **Trigger Patterns**
`api`, `endpoint`, `firebase`, `serverless`, `vercel`, `function`, `database`, `firestore`, `aws`, `email`, `backend`, `service`

### **Especialidades**
- Vercel Functions (serverless)
- Firebase Factory Pattern
- AWS SES integration
- Upstash Redis/QStash
- API design RESTful
- Structured logging

### **Prompts Eficazes**

#### **🔥 Prompt 1: API Endpoint Completo**
```typescript
"Criar endpoint /api/update-medical-profile com:
- Validação Zod completa do payload
- Firebase Factory Pattern OBRIGATÓRIO
- Structured logging com correlation ID
- Error handling padronizado
- Rate limiting (100 req/min)
- CORS apropriado

Funcionalidades:
- Atualizar dados médicos existentes
- Validar permissão do usuário
- Cache Redis atualizado
- Auditoria LGPD compliance
- Backup automático das mudanças"
```

**Resultado Esperado**: Endpoint seguro, performante, com logging completo e conformidade LGPD.

#### **🔥 Prompt 2: Backup Strategy Automático**
```typescript
"Implementar backup automático de dados médicos:
- Execução diária via cron job
- Anonimização para LGPD compliance
- Backup incremental quando possível
- Armazenamento Firebase Storage
- Notificação AWS SES em falhas
- Retention policy 5 anos

Estrutura:
- Collection profiles backup
- Metadata com timestamps
- Verificação de integridade
- Recovery procedures documentados"
```

**Resultado Esperado**: Sistema de backup robusto, LGPD compliant, com recovery automático.

#### **🔥 Prompt 3: Cache Strategy Emergência**
```typescript
"Implementar cache Redis otimizado para EMERGÊNCIA:
- TTL 24h para dados médicos críticos
- Cache warming para perfis ativos
- Fallback Firebase se Redis falha
- Invalidação inteligente
- Métricas de hit rate

Cache keys:
- emergency:{profileId} → dados completos
- medical:{profileId} → apenas críticos
- contacts:{profileId} → emergência only

Performance target: < 100ms cache hit"
```

**Resultado Esperado**: Cache ultra-rápido para acesso de emergência, fallback seguro.

#### **🔥 Prompt 4: Health Check Robusto**
```typescript
"Criar sistema de health check completo /api/health:
- Firebase connectivity
- Redis availability  
- AWS SES status
- QStash queue health
- Performance metrics

Response format:
- HTTP 200 se tudo OK
- HTTP 503 se algum serviço down
- Detailed status por service
- Response time metrics
- Error tracking

Implementar também:
- /api/health/deep para verificação completa
- Alertas automáticos se falhas > 1min"
```

**Resultado Esperado**: Monitoramento completo da saúde do sistema, alertas proativos.

#### **🔥 Prompt 5: Queue Processing Otimizado**
```typescript
"Otimizar processamento QStash para ZERO perda de jobs:
- Retry exponential backoff
- Dead letter queue após 5 tentativas
- Job deduplication por correlation ID
- Timeout handling adequado
- Progress tracking

Jobs críticos:
- payment-approved → criar perfil
- profile-created → gerar QR
- qr-generated → enviar email
- emergency-access → log auditoria

Performance: < 30s processamento completo"
```

**Resultado Esperado**: Processamento assíncrono ultra-confiável, zero perda de dados.

### **Prompts de Monitoramento**

```typescript
// Análise de performance
"Analisar performance de todas as APIs e identificar gargalos"

// Auditoria de segurança
"Verificar se todos os endpoints têm validação de entrada adequada"

// Otimização de cold start
"Reduzir cold start das functions para < 500ms"
```

---

## 💳 Payment Agent

### **Trigger Patterns**
`mercadopago`, `payment`, `pagamento`, `checkout`, `webhook`, `device id`, `hmac`, `preference`, `brick`, `approval`

### **Especialidades**
- MercadoPago SDK integration
- Device ID collection (CRÍTICO)
- HMAC validation rigorosa
- Taxa de aprovação 85%+
- Webhook security
- Async payment processing

### **Prompts Eficazes**

#### **🔥 Prompt 1: Device ID Collection Bulletproof**
```typescript
"Implementar Device ID collection 100% confiável:
- Carregar script MercadoPago SEMPRE
- Polling até device_id estar disponível
- Timeout safety 10 segundos
- Error handling se não conseguir
- Validation antes de cada pagamento
- Fallback se script falha

Validação rigorosa:
- Bloquear pagamento sem device_id
- Log tentativas sem device_id
- Retry automático se falha inicial
- User feedback claro

META: 100% dos pagamentos com device_id"
```

**Resultado Esperado**: Device ID coletado em 100% dos casos, taxa de aprovação otimizada.

#### **🔥 Prompt 2: Webhook HMAC Ultra-Seguro**
```typescript
"Implementar validação HMAC invulnerável no webhook:
- Verificação signature obrigatória
- Validation timestamp para replay attacks
- Rate limiting rigoroso
- IP whitelist MercadoPago
- Request deduplication
- Async processing OBRIGATÓRIO

Security layers:
1. HMAC signature validation
2. Timestamp check (5min window)
3. Request ID uniqueness  
4. Payload integrity check
5. Source IP validation

ZERO tolerância para webhooks inválidos"
```

**Resultado Esperado**: Webhook ultra-seguro, impossível de comprometer.

#### **🔥 Prompt 3: Otimização Taxa Aprovação**
```typescript
"Otimizar preferência MercadoPago para aprovação 85%+:
- Device ID OBRIGATÓRIO
- Dados completos do payer
- Additional info maximizada
- Payment methods otimizados
- Anti-fraude cooperativo
- Customer history se disponível

Dados críticos:
- Email verified
- Phone com área code
- CPF quando disponível
- Address completo
- Device fingerprinting
- Browser/OS info

Testar com: pagamentos reais, múltiplos cartões"
```

**Resultado Esperado**: Taxa de aprovação máxima, pagamentos otimizados.

#### **🔥 Prompt 4: Recovery Payment Strategy**
```typescript
"Implementar recovery strategy para pagamentos falhados:
- Retry automático com delay
- Alternative payment methods
- User communication clara
- Partial data recovery
- Session persistence
- Analytics de falhas

Recovery flow:
1. Detect payment failure
2. Analyze failure reason
3. Suggest alternative method
4. Preserve form data
5. Guide user through recovery
6. Log for analysis

Target: < 5% abandonment após falha"
```

**Resultado Esperado**: Recovery robusto, redução máxima de abandono.

#### **🔥 Prompt 5: Payment Analytics Avançado**
```typescript
"Implementar analytics completo de pagamentos:
- Taxa aprovação em tempo real
- Breakdown por método pagamento
- Device ID impact analysis
- Failure categorization
- Geographic performance
- Cohort analysis

Métricas críticas:
- Approval rate por hour/day
- Device ID collection rate
- Webhook success rate  
- Payment method distribution
- Error categorization
- Recovery success rate

Dashboard: métricas executivas + operacionais"
```

**Resultado Esperado**: Analytics completo para otimização contínua.

---

## 🏥 Medical Validator

### **Trigger Patterns**
`medical`, `medico`, `emergencia`, `emergency`, `sangue`, `alergia`, `medicamento`, `contato`, `lgpd`, `dados`, `qr`, `perfil`

### **Especialidades**
- Validação dados médicos críticos
- LGPD compliance rigorosa
- QR Code emergência
- Cache dados sensíveis
- Auditoria acesso
- Performance crítica < 2s

### **Prompts Eficazes**

#### **🔥 Prompt 1: Validação Médica Rigorosa**
```typescript
"Implementar validação ULTRA-RIGOROSA de dados médicos:
- Tipo sanguíneo: enum exactly A+,A-,B+,B-,AB+,AB-,O+,O-
- Alergias: array sanitizado, lowercase, trim
- Medicamentos: validation contra controlled substances
- Contatos: telefone format brasileiro
- Consistência: alergias vs medicamentos conflict check

Schemas Zod:
- BloodTypeSchema com error messages
- AllergyArraySchema com sanitização
- MedicationArraySchema com warnings
- EmergencyContactSchema com validation

ZERO tolerância para dados inválidos"
```

**Resultado Esperado**: Dados médicos 100% válidos, zero inconsistências.

#### **🔥 Prompt 2: LGPD Compliance Total**
```typescript
"Implementar LGPD compliance RIGOROSA:
- Anonimização automática em logs
- Auditoria completa de acessos
- Base legal documentada (vida)
- TTL automático dados cache
- Direitos titular implementados
- Relatórios compliance

Anonimização:
- Nome → hash
- Email → domain only  
- Telefone → área code only
- Dados médicos → categories only

Auditoria: who, when, what, why, correlation_id"
```

**Resultado Esperado**: LGPD 100% compliant, auditoria completa.

#### **🔥 Prompt 3: QR Code Emergência Otimizado**
```typescript
"Otimizar QR Code para EMERGÊNCIA MÉDICA:
- URL ultra-compacta (< 100 chars)
- Carregamento garantido < 2 segundos
- Cache Redis pré-aquecido
- Fallback se dados indisponíveis
- Mobile-optimized sempre
- Offline capability

Performance targets:
- QR generation: < 500ms
- Data retrieval: < 1s
- Page render: < 2s total
- Cache hit rate: > 95%

Emergency mode: dados mínimos críticos only"
```

**Resultado Esperado**: QR Code ultra-rápido, confiável em emergências.

#### **🔥 Prompt 4: Cache Emergência Inteligente**
```typescript
"Implementar cache inteligente para EMERGÊNCIA:
- Cache warming para perfis ativos
- TTL diferenciado por criticidade
- Invalidação automática em updates
- Backup cache se Redis falha
- Metrics detalhadas

Cache strategy:
- emergency:{id} → TTL 24h (dados críticos)
- full:{id} → TTL 1h (dados completos)  
- stats:{id} → TTL 5min (estatísticas)

Warming: profiles acessados últimos 30 dias"
```

**Resultado Esperado**: Cache inteligente, acesso instantâneo em emergências.

#### **🔥 Prompt 5: Validação Consistência Dados**
```typescript
"Implementar validação CRUZADA de dados médicos:
- Alergias vs medicamentos: conflict detection
- Idade vs medicamentos: pediatric warnings  
- Tipo sanguíneo vs procedimentos: compatibility
- Condições vs alergias: logical consistency
- Contatos vs dados pessoais: relationship validation

Validation matrix:
- Allergy + Medicine → interaction check
- Age + Medicine → dosage appropriateness
- Condition + Allergy → medical logic
- Emergency contact → relationship validation

Warnings não bloqueiam, errors sim"
```

**Resultado Esperado**: Dados médicos logicamente consistentes, validação cruzada completa.

---

## 🚀 Deploy Orchestrator

### **Trigger Patterns**
`deploy`, `build`, `preview`, `production`, `ci`, `cd`, `pipeline`, `test`, `lint`, `type-check`, `quality`

### **Especialidades**
- Zero-downtime deployments
- Health check automation
- Rollback strategies
- Performance monitoring
- Blue-green deployment
- Incident response

### **Prompts Eficazes**

#### **🔥 Prompt 1: Deploy Zero-Downtime**
```typescript
"Implementar deploy ZERO-DOWNTIME para sistema emergência:
- Blue-green deployment strategy
- Health checks automáticos
- Rollback em < 30 segundos
- Smoke tests obrigatórios
- Performance validation
- User impact monitoring

Deploy sequence:
1. Pre-deploy validation (all tests)
2. Deploy to green environment
3. Automated smoke tests
4. Performance validation
5. Traffic switch (blue→green)
6. Monitor for 10 minutes
7. Rollback if any issues

Target: 100% deploy success rate"
```

**Resultado Esperado**: Deploy seguro, zero impacto em usuários.

#### **🔥 Prompt 2: Health Check Automation**
```typescript
"Implementar health checks RIGOROSOS:
- Pre-deploy: all systems green
- Post-deploy: continuous monitoring
- Performance benchmarks
- Error rate thresholds
- Recovery procedures
- Alert escalation

Health metrics:
- API response time < 500ms
- Error rate < 0.1%
- Database connectivity 100%
- Cache hit rate > 90%
- QR Code load time < 2s

Auto-rollback triggers: any metric red > 2min"
```

**Resultado Esperado**: Monitoramento automático, rollback proativo.

#### **🔥 Prompt 3: Emergency Deploy Procedure**
```typescript
"Criar procedimento EMERGENCY DEPLOY:
- Deploy crítico em < 5 minutos
- Bypass validações não-críticas
- Hot-fix strategy
- Immediate rollback plan
- Communication template
- Post-mortem automático

Emergency criteria:
- Sistema down > 2 minutos
- Dados médicos inacessíveis
- Taxa erro > 5%
- Security breach detected

Fast track: skip non-critical tests, deploy, monitor"
```

**Resultado Esperado**: Procedure de emergência para correção rápida.

#### **🔥 Prompt 4: Performance Monitoring**
```typescript
"Implementar monitoring CONTÍNUO pós-deploy:
- Real user monitoring (RUM)
- Core Web Vitals tracking
- API performance metrics
- Error tracking detalhado
- User journey monitoring
- Alertas proativos

Critical metrics Memoryys:
- QR Code load time (< 2s)
- Payment success rate (> 85%)
- Emergency data access (< 1s)
- System availability (99.9%)

Dashboard: real-time + historical trends"
```

**Resultado Esperado**: Monitoramento completo, alertas proativos.

#### **🔥 Prompt 5: Rollback Strategy Automático**
```typescript
"Implementar rollback AUTOMÁTICO inteligente:
- Trigger conditions definidas
- Rollback execution < 30s
- Data consistency preservation
- User communication
- Recovery validation
- Incident documentation

Auto-rollback triggers:
- Error rate > 1% for 2min
- Response time > 5s for 1min
- Health check failure > 2min
- User reports > 10/min

Rollback validation: smoke tests pass before complete"
```

**Resultado Esperado**: Rollback automático, sistema sempre estável.

---

## 🔄 Combinações de Agentes

### **Fluxo Completo: Nova Feature**
```typescript
// 1. Frontend + Backend + Medical Validator
"Implementar feature de atualização de dados médicos:
- Frontend: formulário React com validação
- Backend: endpoint seguro com auditoria  
- Medical Validator: LGPD compliance total"

// 2. Payment + Backend + Deploy
"Otimizar fluxo de pagamento end-to-end:
- Payment: Device ID + aprovação 85%+
- Backend: processamento assíncrono robusto
- Deploy: deploy seguro sem downtime"
```

### **Fluxo Emergência: Critical Fix**
```typescript
// Deploy + Medical + Backend
"Corrigir bug crítico acesso dados emergência:
- Medical Validator: identifica inconsistência dados
- Backend: implementa fix no cache Redis
- Deploy Orchestrator: deploy emergencial < 5min"
```

### **Fluxo Otimização: Performance**
```typescript
// Frontend + Backend + Deploy
"Otimizar performance sistema completo:
- Frontend: lazy loading + code splitting
- Backend: cache warming + query optimization
- Deploy: performance validation automática"
```

---

## ❌ Anti-Padrões

### **❌ Não Faça - Frontend**
```typescript
// ❌ Usar any type
"Criar componente com props any"

// ❌ Bypass TypeScript
"Implementar sem validação Zod"

// ❌ CSS inline
"Usar style={{}} ao invés de Tailwind"

// ❌ Componentização inadequada
"Criar componente monolítico de 500+ linhas"
```

### **❌ Não Faça - Backend**
```typescript
// ❌ API direta sem service
"Chamar MercadoPago API diretamente"

// ❌ Processamento síncrono
"Processar pagamento no webhook síncronamente"

// ❌ Sem validação
"Criar endpoint sem schema Zod"

// ❌ Logs não estruturados
"Usar console.log para debugging"
```

### **❌ Não Faça - Payment**
```typescript
// ❌ Pagamento sem Device ID
"Processar pagamento sem device_id"

// ❌ Webhook sem HMAC
"Aceitar webhook sem validação HMAC"

// ❌ Secrets expostos
"Hardcode access token no código"
```

### **❌ Não Faça - Medical**
```typescript
// ❌ Dados médicos em logs
"Logar tipo sanguíneo e alergias"

// ❌ Sem anonimização
"Armazenar dados sem LGPD compliance"

// ❌ Cache sem TTL
"Cache dados médicos indefinidamente"
```

### **❌ Não Faça - Deploy**
```typescript
// ❌ Deploy sem testes
"Fazer deploy sem validação"

// ❌ Sem rollback plan
"Deploy sem estratégia de rollback"

// ❌ Sem monitoring
"Deploy sem health checks"
```

---

## 🎯 Prompt Templates Rápidos

### **Template: Bug Fix**
```typescript
"Use [AGENTE] to fix [PROBLEMA] in [ARQUIVO]:
- Root cause analysis
- Minimal invasive fix
- Regression test coverage
- Performance impact validation"
```

### **Template: Feature Implementation**
```typescript
"Use [AGENTE] to implement [FEATURE]:
- Requirements analysis
- Architecture compliance
- Security validation
- Performance benchmarks
- Documentation update"
```

### **Template: Optimization**
```typescript
"Use [AGENTE] to optimize [COMPONENT] for [METRIC]:
- Current performance baseline
- Optimization strategy
- Implementation plan
- Validation criteria
- Monitoring setup"
```

---

**💡 Dica Final**: Combine agentes para tasks complexas. Use prompts específicos e mensuráveis. Sempre valide resultados com métricas objetivas.

**📞 Para troubleshooting específico**, consulte `validation-testing-guide.md` e `rollback-recovery-manual.md`.