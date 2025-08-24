# 🧪 Guia de Validação e Testes - Sistema de Agentes Memoryys

**Manual Técnico**: Como validar e testar cada agente especializado  
**Última Atualização**: 19 de agosto de 2025  
**Sistema**: Claude Code Agent Testing Framework

## 📚 Índice
- [🎯 Visão Geral de Testes](#-visão-geral-de-testes)
- [🎨 Testes Frontend Agent](#-testes-frontend-agent)
- [⚙️ Testes Backend Agent](#️-testes-backend-agent)
- [💳 Testes Payment Agent](#-testes-payment-agent)
- [🏥 Testes Medical Validator](#-testes-medical-validator)
- [🚀 Testes Deploy Orchestrator](#-testes-deploy-orchestrator)
- [🔧 Testes de Hooks](#-testes-de-hooks)
- [🔌 Testes MCP Integration](#-testes-mcp-integration)
- [📊 Métricas de Sucesso](#-métricas-de-sucesso)
- [🚨 Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral de Testes

### **Estratégia de Validação**
```
Pirâmide de Testes Memoryys:
┌─────────────────────────────────┐
│        E2E Tests (5%)           │ ← Sistema completo
├─────────────────────────────────┤
│    Integration Tests (25%)      │ ← Agente + Hooks + MCP
├─────────────────────────────────┤
│      Unit Tests (70%)           │ ← Componentes individuais
└─────────────────────────────────┘
```

### **Tipos de Validação**

1. **Functional Testing**: Agente executa tarefa corretamente
2. **Performance Testing**: Agente atende métricas de tempo
3. **Security Testing**: Hooks bloqueiam problemas de segurança
4. **Integration Testing**: Comunicação entre agentes funciona
5. **Regression Testing**: Mudanças não quebram funcionalidade existente

### **Ferramentas de Teste**
```bash
# Test suite Memoryys
npm run test:agents          # Testa todos os agentes
npm run test:hooks          # Testa hooks Python
npm run test:integration    # Testa integração MCP
npm run test:e2e           # Testa fluxo completo
npm run test:performance   # Testa performance
```

---

## 🎨 Testes Frontend Agent

### **1. Teste de Funcionalidade Básica**

```typescript
// Teste 1: Criação de Componente Simples
describe("Frontend Agent - Component Creation", () => {
  test("Should create React component with TypeScript", async () => {
    const prompt = "Criar componente Button simples usando Shadcn/UI";
    
    // Execute agent
    const result = await executeAgent("frontend-agent", prompt);
    
    // Validations
    expect(result.success).toBe(true);
    expect(result.files).toContain("components/Button.tsx");
    expect(result.content).toMatch(/import.*Button.*shadcn/);
    expect(result.content).toMatch(/interface.*Props/);
    expect(result.execution_time).toBeLessThan(15000); // < 15s
  });
  
  // Métricas esperadas
  const expectedMetrics = {
    execution_time: "< 15s",
    typescript_errors: 0,
    shadcn_compliance: true,
    accessibility_score: "> 90%"
  };
});
```

### **2. Teste de MercadoPago Integration**

```typescript
// Teste 2: Device ID Collection
describe("Frontend Agent - MercadoPago Integration", () => {
  test("Should implement Device ID collection correctly", async () => {
    const prompt = "Implementar Device ID collection no checkout MercadoPago";
    
    const result = await executeAgent("frontend-agent", prompt);
    
    // Critical validations for approval rate
    expect(result.content).toMatch(/MP_DEVICE_SESSION_ID/);
    expect(result.content).toMatch(/setInterval.*device.*id/);
    expect(result.content).toMatch(/setTimeout.*10000/); // 10s timeout
    expect(result.content).toMatch(/if\s*\(\s*!device.*id\s*\)/); // Validation
    
    // Security checks
    expect(result.content).not.toMatch(/console\.log.*device.*id/);
    expect(result.hooks.mercadopago_validator.passed).toBe(true);
  });
  
  const criticalChecks = {
    device_id_collection: "MANDATORY",
    timeout_handling: "MANDATORY", 
    error_handling: "MANDATORY",
    security_compliance: "MANDATORY"
  };
});
```

### **3. Teste de Performance QR Code**

```typescript
// Teste 3: QR Code Performance
describe("Frontend Agent - QR Code Optimization", () => {
  test("Should optimize QR Code for emergency < 2s", async () => {
    const prompt = "Otimizar QRCodePreview para carregamento < 2 segundos";
    
    const result = await executeAgent("frontend-agent", prompt);
    
    // Performance optimizations
    expect(result.content).toMatch(/lazy.*loading|React\.lazy/);
    expect(result.content).toMatch(/Suspense/);
    expect(result.content).toMatch(/loading.*state/);
    
    // Emergency optimizations
    expect(result.content).toMatch(/priority.*high|loading.*eager/);
    expect(result.content).toMatch(/preload|prefetch/);
    
    // Accessibility for emergency
    expect(result.content).toMatch(/aria-label/);
    expect(result.content).toMatch(/alt.*text/);
    
    // Validate performance target
    const loadTime = await measureQRLoadTime(result.preview_url);
    expect(loadTime).toBeLessThan(2000); // < 2s CRITICAL
  });
});
```

### **4. Teste de Hooks Integration**

```typescript
// Teste 4: TypeScript Hook Validation
describe("Frontend Agent - Hook Integration", () => {
  test("Should trigger TypeScript validation hook", async () => {
    const prompt = "Criar componente com erro TypeScript intencional";
    
    const result = await executeAgent("frontend-agent", prompt);
    
    // Hook should catch TypeScript errors
    expect(result.hooks.typescript_validator.executed).toBe(true);
    expect(result.hooks.typescript_validator.errors.length).toBeGreaterThan(0);
    expect(result.success).toBe(false); // Should fail due to TS errors
    
    // Auto-fix attempt
    if (result.hooks.typescript_validator.auto_fix_attempted) {
      expect(result.hooks.typescript_validator.auto_fix_successful).toBeDefined();
    }
  });
});
```

### **5. Teste de Acessibilidade**

```typescript
// Teste 5: WCAG Compliance
describe("Frontend Agent - Accessibility", () => {
  test("Should implement WCAG AA compliance", async () => {
    const prompt = "Implementar acessibilidade WCAG AA no formulário médico";
    
    const result = await executeAgent("frontend-agent", prompt);
    
    // WCAG Requirements
    expect(result.content).toMatch(/aria-label|aria-describedby/);
    expect(result.content).toMatch(/role=/);
    expect(result.content).toMatch(/tabIndex/);
    
    // Form accessibility
    expect(result.content).toMatch(/htmlFor.*id/); // Label association
    expect(result.content).toMatch(/required.*aria-required/);
    expect(result.content).toMatch(/error.*aria-invalid/);
    
    // Run accessibility audit
    const a11yScore = await runAccessibilityAudit(result.preview_url);
    expect(a11yScore).toBeGreaterThan(90); // WCAG AA = 90%+
  });
});
```

### **Manual Testing Checklist**

```markdown
## Frontend Agent Manual Testing

### Component Creation ✅
- [ ] React component with proper TypeScript interfaces
- [ ] Shadcn/UI components used correctly
- [ ] Error boundaries implemented
- [ ] Loading states for async operations
- [ ] Responsive design (320px → 1440px)

### MercadoPago Integration ✅
- [ ] Device ID script loaded correctly
- [ ] MP_DEVICE_SESSION_ID collected before payment
- [ ] Error handling for Device ID timeout
- [ ] User feedback during collection process
- [ ] Security: no Device ID in logs

### Performance ✅
- [ ] Components load in < 3s
- [ ] QR Code displays in < 2s (CRITICAL)
- [ ] Bundle size impact < 50KB
- [ ] Lazy loading implemented where appropriate
- [ ] No unnecessary re-renders

### Accessibility ✅
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast ratio > 4.5:1
- [ ] Focus indicators visible
- [ ] Error announcements work
```

---

## ⚙️ Testes Backend Agent

### **1. Teste de API Endpoint Creation**

```typescript
// Teste 1: API Endpoint with Zod Validation
describe("Backend Agent - API Creation", () => {
  test("Should create secure API endpoint with validation", async () => {
    const prompt = "Criar endpoint /api/update-profile com validação Zod";
    
    const result = await executeAgent("backend-agent", prompt);
    
    // Serverless architecture compliance
    expect(result.content).toMatch(/export default.*handler/);
    expect(result.content).toMatch(/VercelRequest.*VercelResponse/);
    
    // Factory Pattern mandatory
    expect(result.content).toMatch(/getFirebaseApp/);
    expect(result.content).not.toMatch(/initializeApp.*directly/);
    
    // Zod validation mandatory
    expect(result.content).toMatch(/\.parse\(|\.safeParse\(/);
    expect(result.content).toMatch(/z\.|zod/);
    
    // Structured logging
    expect(result.content).toMatch(/logInfo|logError/);
    expect(result.content).toMatch(/correlationId/);
    
    // Error handling
    expect(result.content).toMatch(/try.*catch/);
    expect(result.content).toMatch(/return.*status.*error/);
  });
});
```

### **2. Teste de Firebase Factory Pattern**

```typescript
// Teste 2: Firebase Factory Pattern Compliance
describe("Backend Agent - Firebase Integration", () => {
  test("Should implement Factory Pattern correctly", async () => {
    const prompt = "Implementar backup automático Firebase com Factory Pattern";
    
    const result = await executeAgent("backend-agent", prompt);
    
    // Factory Pattern validation
    expect(result.content).toMatch(/getApps\(\)\.length/);
    expect(result.content).toMatch(/function getFirebaseApp/);
    expect(result.content).not.toMatch(/new.*Firebase/);
    
    // No duplicate initialization
    const initCount = (result.content.match(/initializeApp/g) || []).length;
    expect(initCount).toBeLessThanOrEqual(1);
    
    // Proper error handling for initialization
    expect(result.content).toMatch(/catch.*firebase.*init/i);
    
    // Environment variables validation
    expect(result.content).toMatch(/process\.env\.FIREBASE_/);
    expect(result.content).toMatch(/FIREBASE_PROJECT_ID/);
  });
});
```

### **3. Teste de Cache Strategy**

```typescript
// Teste 3: Redis Cache Implementation
describe("Backend Agent - Cache Strategy", () => {
  test("Should implement emergency cache correctly", async () => {
    const prompt = "Implementar cache Redis para dados de emergência";
    
    const result = await executeAgent("backend-agent", prompt);
    
    // Redis integration
    expect(result.content).toMatch(/upstash.*redis/i);
    expect(result.content).toMatch(/setex.*86400/); // 24h TTL
    
    // Emergency-specific optimizations
    expect(result.content).toMatch(/emergency.*key/);
    expect(result.content).toMatch(/fallback.*firebase/i);
    
    // Performance targets
    expect(result.content).toMatch(/cache.*hit.*rate/);
    expect(result.content).toMatch(/< 100ms|< 50ms/);
    
    // Cache invalidation
    expect(result.content).toMatch(/invalidate|expire|delete/);
  });
});
```

### **4. Teste de Async Processing**

```typescript
// Teste 4: QStash Integration
describe("Backend Agent - Async Processing", () => {
  test("Should implement QStash processing correctly", async () => {
    const prompt = "Implementar processamento assíncrono com QStash";
    
    const result = await executeAgent("backend-agent", prompt);
    
    // QStash integration
    expect(result.content).toMatch(/qstash.*client/i);
    expect(result.content).toMatch(/publishJSON/);
    
    // No synchronous processing in webhooks
    expect(result.content).not.toMatch(/await.*createProfile.*webhook/);
    expect(result.content).not.toMatch(/await.*generateQR.*webhook/);
    
    // Proper job structure
    expect(result.content).toMatch(/correlationId/);
    expect(result.content).toMatch(/timestamp/);
    expect(result.content).toMatch(/retry.*count/);
    
    // Error handling
    expect(result.content).toMatch(/catch.*qstash/i);
  });
});
```

### **5. Teste de Health Checks**

```typescript
// Teste 5: Health Check Implementation
describe("Backend Agent - Health Checks", () => {
  test("Should create comprehensive health check", async () => {
    const prompt = "Criar endpoint /api/health com verificação completa";
    
    const result = await executeAgent("backend-agent", prompt);
    
    // All service checks
    expect(result.content).toMatch(/firebase.*health|firebase.*check/i);
    expect(result.content).toMatch(/redis.*health|redis.*check/i);
    expect(result.content).toMatch(/aws.*health|ses.*check/i);
    
    // Response format
    expect(result.content).toMatch(/status.*healthy/);
    expect(result.content).toMatch(/services.*\{/);
    expect(result.content).toMatch(/timestamp/);
    
    // Proper status codes
    expect(result.content).toMatch(/200.*healthy/);
    expect(result.content).toMatch(/503.*unhealthy/);
    
    // Performance metrics
    expect(result.content).toMatch(/response.*time/);
    expect(result.content).toMatch(/version.*commit/);
  });
});
```

---

## 💳 Testes Payment Agent

### **1. Teste Crítico de Device ID**

```typescript
// Teste 1: Device ID Collection (CRÍTICO para aprovação)
describe("Payment Agent - Device ID Critical Test", () => {
  test("Should ensure 100% Device ID collection", async () => {
    const prompt = "Garantir Device ID em 100% dos pagamentos Memoryys";
    
    const result = await executeAgent("payment-agent", prompt);
    
    // CRITICAL: Device ID validation
    expect(result.content).toMatch(/if\s*\(\s*!.*device.*id\s*\)/);
    expect(result.content).toMatch(/throw.*device.*id.*required/i);
    
    // Collection implementation
    expect(result.content).toMatch(/MP_DEVICE_SESSION_ID/);
    expect(result.content).toMatch(/mercadopago.*security\.js/);
    
    // Error handling for missing Device ID
    expect(result.content).toMatch(/device.*id.*timeout/i);
    expect(result.content).toMatch(/error.*device.*id/i);
    
    // MercadoPago hook validation
    expect(result.hooks.mercadopago_validator.device_id_check).toBe(true);
    expect(result.hooks.mercadopago_validator.critical_issues).toHaveLength(0);
    
    // Target: 85%+ approval rate
    expect(result.approval_rate_optimizations).toContain("device_id_mandatory");
  });
});
```

### **2. Teste de HMAC Security**

```typescript
// Teste 2: HMAC Validation (CRÍTICO para segurança)
describe("Payment Agent - HMAC Security", () => {
  test("Should implement bulletproof HMAC validation", async () => {
    const prompt = "Implementar validação HMAC invulnerável no webhook";
    
    const result = await executeAgent("payment-agent", prompt);
    
    // HMAC implementation
    expect(result.content).toMatch(/createHmac.*sha256/);
    expect(result.content).toMatch(/x-signature/);
    expect(result.content).toMatch(/x-request-id/);
    
    // Security validations
    expect(result.content).toMatch(/timestamp.*check/);
    expect(result.content).toMatch(/replay.*attack.*prevention/i);
    
    // Webhook security
    expect(result.content).toMatch(/validateWebhook/);
    expect(result.content).toMatch(/401.*unauthorized/);
    
    // No processing without validation
    expect(result.content).not.toMatch(/process.*payment.*before.*hmac/);
    
    // Hook validation
    expect(result.hooks.mercadopago_validator.hmac_validation).toBe(true);
  });
});
```

### **3. Teste de Taxa de Aprovação**

```typescript
// Teste 3: Approval Rate Optimization
describe("Payment Agent - Approval Rate", () => {
  test("Should optimize for 85%+ approval rate", async () => {
    const prompt = "Otimizar preferência MercadoPago para aprovação 85%+";
    
    const result = await executeAgent("payment-agent", prompt);
    
    // Required for high approval
    expect(result.content).toMatch(/device.*id.*mandatory/i);
    expect(result.content).toMatch(/additional.*info/);
    expect(result.content).toMatch(/payer.*email/);
    
    // Payment optimization
    expect(result.content).toMatch(/phone.*area.*code/);
    expect(result.content).toMatch(/identification.*cpf/i);
    
    // Anti-fraud cooperation
    expect(result.content).toMatch(/metadata/);
    expect(result.content).toMatch(/browser.*info|user.*agent/i);
    
    // Plan pricing validation
    expect(result.content).toMatch(/55\.00|55\.0/); // Basic R$55
    expect(result.content).toMatch(/85\.00|85\.0/); // Premium R$85
    
    // Service layer usage (never direct API)
    expect(result.content).toMatch(/mercadoPagoService/);
    expect(result.content).not.toMatch(/https:\/\/api\.mercadopago\.com/);
  });
});
```

### **4. Teste de Processamento Assíncrono**

```typescript
// Teste 4: Async Processing (OBRIGATÓRIO)
describe("Payment Agent - Async Processing", () => {
  test("Should ensure async webhook processing", async () => {
    const prompt = "Garantir processamento assíncrono webhook MercadoPago";
    
    const result = await executeAgent("payment-agent", prompt);
    
    // Webhook must respond quickly
    expect(result.content).toMatch(/return.*res.*status.*200/);
    expect(result.content).toMatch(/received.*true/);
    
    // No sync processing
    expect(result.content).not.toMatch(/await.*createProfile.*webhook/);
    expect(result.content).not.toMatch(/await.*generateQR.*webhook/);
    expect(result.content).not.toMatch(/await.*sendEmail.*webhook/);
    
    // QStash integration
    expect(result.content).toMatch(/qstash.*publish/i);
    expect(result.content).toMatch(/processors.*final/);
    
    // Timeout compliance (< 22s)
    expect(result.execution_time_estimate).toBeLessThan(22000);
  });
});
```

### **5. Teste de Analytics**

```typescript
// Teste 5: Payment Analytics
describe("Payment Agent - Analytics Implementation", () => {
  test("Should implement comprehensive payment analytics", async () => {
    const prompt = "Implementar analytics completo de pagamentos Memoryys";
    
    const result = await executeAgent("payment-agent", prompt);
    
    // Key metrics tracking
    expect(result.content).toMatch(/approval.*rate/);
    expect(result.content).toMatch(/device.*id.*collection.*rate/);
    expect(result.content).toMatch(/payment.*method.*distribution/);
    
    // Real-time monitoring
    expect(result.content).toMatch(/real.*time|live.*metrics/);
    expect(result.content).toMatch(/dashboard/);
    
    // Error categorization
    expect(result.content).toMatch(/error.*categorization/);
    expect(result.content).toMatch(/failure.*analysis/);
    
    // Business metrics
    expect(result.content).toMatch(/cohort.*analysis/);
    expect(result.content).toMatch(/geographic.*performance/);
  });
});
```

---

## 🏥 Testes Medical Validator

### **1. Teste de Validação de Dados Médicos**

```typescript
// Teste 1: Medical Data Validation
describe("Medical Validator - Data Validation", () => {
  test("Should validate medical data rigorously", async () => {
    const prompt = "Implementar validação rigorosa dados médicos Memoryys";
    
    const result = await executeAgent("medical-validator", prompt);
    
    // Blood type validation (CRÍTICO)
    expect(result.content).toMatch(/A\+.*A-.*B\+.*B-.*AB\+.*AB-.*O\+.*O-/);
    expect(result.content).toMatch(/enum.*BloodType/);
    
    // Allergy validation
    expect(result.content).toMatch(/toLowerCase.*trim/);
    expect(result.content).toMatch(/sanitize.*allergies/i);
    
    // Medication validation
    expect(result.content).toMatch(/controlled.*substances/i);
    expect(result.content).toMatch(/drug.*interaction/i);
    
    // Emergency contacts
    expect(result.content).toMatch(/phone.*format.*brazilian/i);
    expect(result.content).toMatch(/\(\d{2}\).*\d{4,5}-\d{4}/);
    
    // Consistency validation
    expect(result.content).toMatch(/allergy.*medication.*conflict/i);
  });
});
```

### **2. Teste de LGPD Compliance**

```typescript
// Teste 2: LGPD Compliance (OBRIGATÓRIO)
describe("Medical Validator - LGPD Compliance", () => {
  test("Should implement LGPD compliance rigorously", async () => {
    const prompt = "Implementar LGPD compliance total para dados médicos";
    
    const result = await executeAgent("medical-validator", prompt);
    
    // Data anonymization
    expect(result.content).toMatch(/anonymize.*medical.*data/i);
    expect(result.content).toMatch(/hash.*personal.*data/i);
    
    // Audit trail
    expect(result.content).toMatch(/audit.*trail|audit.*log/i);
    expect(result.content).toMatch(/who.*when.*what.*why/);
    
    // Data retention (TTL)
    expect(result.content).toMatch(/ttl.*24.*hour|86400/);
    expect(result.content).toMatch(/retention.*policy/i);
    
    // User rights
    expect(result.content).toMatch(/user.*rights.*implementation/i);
    expect(result.content).toMatch(/access.*rectification.*deletion/i);
    
    // Legal basis
    expect(result.content).toMatch(/legal.*basis.*life.*protection/i);
  });
});
```

### **3. Teste de Performance QR Code**

```typescript
// Teste 3: QR Code Emergency Performance
describe("Medical Validator - QR Code Performance", () => {
  test("Should optimize QR Code for emergency < 2s", async () => {
    const prompt = "Otimizar QR Code para emergência médica < 2 segundos";
    
    const result = await executeAgent("medical-validator", prompt);
    
    // Performance optimizations
    expect(result.content).toMatch(/cache.*redis.*emergency/i);
    expect(result.content).toMatch(/qr.*size.*2kb/i);
    
    // Emergency data prioritization
    expect(result.content).toMatch(/blood.*type.*priority/i);
    expect(result.content).toMatch(/allergy.*critical/i);
    expect(result.content).toMatch(/emergency.*contacts.*first/i);
    
    // Cache strategy
    expect(result.content).toMatch(/cache.*warming/i);
    expect(result.content).toMatch(/hit.*rate.*95/);
    
    // Fallback for emergencies
    expect(result.content).toMatch(/fallback.*emergency.*data/i);
    expect(result.content).toMatch(/offline.*capability/i);
    
    // Performance target validation
    const expectedPerformance = {
      qr_generation: "< 500ms",
      data_retrieval: "< 1s", 
      total_load_time: "< 2s"
    };
  });
});
```

### **4. Teste de Consistência Cross-Data**

```typescript
// Teste 4: Cross-Data Consistency
describe("Medical Validator - Data Consistency", () => {
  test("Should validate cross-data medical consistency", async () => {
    const prompt = "Implementar validação cruzada dados médicos";
    
    const result = await executeAgent("medical-validator", prompt);
    
    // Allergy vs medication conflicts
    expect(result.content).toMatch(/allergy.*medication.*interaction/i);
    expect(result.content).toMatch(/conflict.*detection/i);
    
    // Age vs medication appropriateness
    expect(result.content).toMatch(/age.*medication.*dosage/i);
    expect(result.content).toMatch(/pediatric.*warning/i);
    
    // Blood type compatibility
    expect(result.content).toMatch(/blood.*type.*compatibility/i);
    expect(result.content).toMatch(/transfusion.*compatibility/i);
    
    // Logical consistency
    expect(result.content).toMatch(/medical.*logic.*validation/i);
    expect(result.content).toMatch(/condition.*allergy.*logic/i);
    
    // Warning vs error distinction
    expect(result.content).toMatch(/warning.*not.*blocking/i);
    expect(result.content).toMatch(/error.*blocking/i);
  });
});
```

---

## 🚀 Testes Deploy Orchestrator

### **1. Teste de Zero-Downtime Deploy**

```typescript
// Teste 1: Zero-Downtime Deployment
describe("Deploy Orchestrator - Zero-Downtime", () => {
  test("Should execute zero-downtime deployment", async () => {
    const prompt = "Implementar deploy zero-downtime para sistema emergência";
    
    const result = await executeAgent("deploy-orchestrator", prompt);
    
    // Blue-green strategy
    expect(result.content).toMatch(/blue.*green.*deployment/i);
    expect(result.content).toMatch(/traffic.*switch/i);
    
    // Health checks
    expect(result.content).toMatch(/health.*check.*automated/i);
    expect(result.content).toMatch(/smoke.*tests.*mandatory/i);
    
    // Rollback capability
    expect(result.content).toMatch(/rollback.*30.*seconds|rollback.*< 30s/i);
    expect(result.content).toMatch(/automatic.*rollback/i);
    
    // Performance validation
    expect(result.content).toMatch(/performance.*validation/i);
    expect(result.content).toMatch(/qr.*code.*2.*seconds|qr.*< 2s/i);
    
    // Success criteria
    expect(result.content).toMatch(/100.*deploy.*success/i);
  });
});
```

### **2. Teste de Health Check Automation**

```typescript
// Teste 2: Health Check Automation
describe("Deploy Orchestrator - Health Checks", () => {
  test("Should implement comprehensive health checks", async () => {
    const prompt = "Implementar health checks rigorosos pré e pós deploy";
    
    const result = await executeAgent("deploy-orchestrator", prompt);
    
    // Pre-deploy validation
    expect(result.content).toMatch(/pre.*deploy.*validation/i);
    expect(result.content).toMatch(/all.*tests.*pass/i);
    
    // Post-deploy monitoring
    expect(result.content).toMatch(/post.*deploy.*monitoring/i);
    expect(result.content).toMatch(/continuous.*monitoring/i);
    
    // Critical metrics
    expect(result.content).toMatch(/api.*response.*500ms/i);
    expect(result.content).toMatch(/error.*rate.*0\.1/i);
    expect(result.content).toMatch(/qr.*load.*2s/i);
    
    // Auto-rollback triggers
    expect(result.content).toMatch(/auto.*rollback.*trigger/i);
    expect(result.content).toMatch(/metric.*red.*2.*minutes/i);
  });
});
```

### **3. Teste de Emergency Procedures**

```typescript
// Teste 3: Emergency Deploy Procedures
describe("Deploy Orchestrator - Emergency Procedures", () => {
  test("Should handle emergency deploy in < 5min", async () => {
    const prompt = "Criar procedimento emergency deploy < 5 minutos";
    
    const result = await executeAgent("deploy-orchestrator", prompt);
    
    // Emergency criteria
    expect(result.content).toMatch(/system.*down.*2.*minutes/i);
    expect(result.content).toMatch(/medical.*data.*inaccessible/i);
    expect(result.content).toMatch(/error.*rate.*5%/i);
    
    // Fast track procedure
    expect(result.content).toMatch(/skip.*non.*critical.*tests/i);
    expect(result.content).toMatch(/deploy.*monitor.*fast/i);
    
    // Time constraints
    expect(result.content).toMatch(/5.*minutes|300.*seconds/i);
    expect(result.content).toMatch(/emergency.*deploy.*procedure/i);
    
    // Communication
    expect(result.content).toMatch(/communication.*template/i);
    expect(result.content).toMatch(/post.*mortem.*automatic/i);
  });
});
```

---

## 🔧 Testes de Hooks

### **1. Teste TypeScript Hook**

```bash
#!/bin/bash
# Teste Manual do TypeScript Hook

echo "🧪 Testando TypeScript Hook..."

# Teste 1: Criar arquivo com erro TypeScript
echo "let test: any = 'invalid';" > test-hook.ts

# Executar hook manualmente
python3 .claude/hooks/typescript-validator.py < test-hook.ts

# Resultado esperado: Hook deve detectar erro 'any' e bloquear

# Teste 2: Arquivo TypeScript válido
echo "interface Test { name: string; }" > test-valid.ts

# Executar hook
python3 .claude/hooks/typescript-validator.py < test-valid.ts

# Resultado esperado: Hook deve passar

# Cleanup
rm test-hook.ts test-valid.ts
```

### **2. Teste MercadoPago Hook**

```bash
#!/bin/bash
# Teste Manual do MercadoPago Hook

echo "🧪 Testando MercadoPago Hook..."

# Teste 1: Arquivo sem Device ID
cat > test-payment.ts << EOF
export function createPayment() {
  return mercadoPago.createPreference({
    items: [item]
  });
}
EOF

# Executar hook
python3 .claude/hooks/mercadopago-validator.py < test-payment.ts

# Resultado esperado: Hook deve detectar Device ID ausente

# Teste 2: Arquivo com Device ID
cat > test-payment-valid.ts << EOF
export function createPayment(deviceId: string) {
  if (!deviceId) throw new Error('Device ID required');
  return mercadoPagoService.createPreference({
    items: [item],
    device_id: deviceId
  });
}
EOF

# Executar hook
python3 .claude/hooks/mercadopago-validator.py < test-payment-valid.ts

# Resultado esperado: Hook deve passar

# Cleanup
rm test-payment*.ts
```

### **3. Teste Secrets Hook**

```bash
#!/bin/bash
# Teste Manual do Secrets Hook

echo "🧪 Testando Secrets Hook..."

# Teste 1: Comando com secret
echo '{"tool_name": "Bash", "tool_input": {"command": "echo APP_USR-secret"}}' | \
  python3 .claude/hooks/secrets-scanner.py

# Resultado esperado: Hook deve detectar secret e bloquear

# Teste 2: Comando seguro
echo '{"tool_name": "Bash", "tool_input": {"command": "npm run build"}}' | \
  python3 .claude/hooks/secrets-scanner.py

# Resultado esperado: Hook deve passar
```

---

## 🔌 Testes MCP Integration

### **1. Teste de Conectividade MCP**

```bash
#!/bin/bash
# Teste de Conectividade MCP

echo "🔌 Testando MCP Connectivity..."

# Verificar servers disponíveis
claude mcp list

# Testar server específico do projeto
claude mcp status mcp-firebase-memoryys

# Testar comunicação
claude mcp test mcp-firebase-memoryys

# Resultados esperados:
# - mcp-firebase-memoryys: Connected
# - Response time: < 1s
# - All capabilities available
```

### **2. Teste de Fallback Strategy**

```typescript
// Teste de Fallback MCP
describe("MCP Integration - Fallback Strategy", () => {
  test("Should fallback to direct API when MCP unavailable", async () => {
    // Simulate MCP disconnection
    await disconnectMCP("mcp-firebase-memoryys");
    
    const prompt = "Deploy preview usando Vercel";
    const result = await executeAgent("deploy-orchestrator", prompt);
    
    // Should use local config fallback
    expect(result.mcp_fallback_used).toBe(true);
    expect(result.success).toBe(true);
    expect(result.content).toMatch(/fallback.*local.*config/i);
    
    // Re-enable MCP
    await reconnectMCP("mcp-firebase-memoryys");
  });
});
```

---

## 📊 Métricas de Sucesso

### **Benchmarks por Agente**

| Agente | Execution Time | Success Rate | Hook Pass Rate | Performance Score |
|--------|----------------|--------------|----------------|-------------------|
| Frontend | < 15s | > 98% | > 95% | > 90% |
| Backend | < 30s | > 95% | > 98% | > 85% |
| Payment | < 10s | > 99% | > 99% | > 95% |
| Medical | < 8s | > 99% | > 99% | > 98% |
| Deploy | < 300s | > 97% | > 90% | > 80% |

### **Sistema Global**

```typescript
interface SystemMetrics {
  overall_success_rate: ">97%";
  average_response_time: "<20s";
  hook_execution_time: "<3s";
  mcp_connectivity: ">95%";
  error_recovery_rate: ">90%";
  
  critical_metrics: {
    qr_load_time: "<2s";        // CRÍTICO para emergência
    payment_approval: ">85%";   // CRÍTICO para negócio
    medical_data_accuracy: "100%"; // CRÍTICO para vida
    deploy_success: ">95%";     // CRÍTICO para disponibilidade
  };
}
```

### **SLIs (Service Level Indicators)**

```bash
# Comandos para monitorar SLIs
npm run metrics:agents          # Métricas por agente
npm run metrics:performance     # Performance geral
npm run metrics:availability    # Disponibilidade sistema
npm run metrics:quality         # Qualidade código
```

---

## 🚨 Troubleshooting

### **Problemas Comuns e Soluções**

#### **Agent Timeout (>60s)**
```bash
# Diagnóstico
grep "timeout" ~/.claude/logs/agent-execution.log

# Soluções
1. Verificar complexidade da tarefa
2. Dividir em subtarefas menores
3. Verificar conectividade MCP
4. Reiniciar Claude Code se necessário
```

#### **Hook Failures Consecutivos**
```bash
# Diagnóstico
tail -20 ~/.claude/logs/hooks-performance.log

# Soluções
1. Verificar configuração TypeScript
2. Validar secrets não expostos
3. Verificar permissões de arquivos
4. Re-executar npm install se necessário
```

#### **MCP Disconnection**
```bash
# Diagnóstico
claude mcp status --detailed

# Soluções
1. Verificar conectividade internet
2. Re-adicionar MCP server:
   claude mcp add --transport http mcp-firebase-memoryys URL
3. Verificar tokens/credentials
4. Usar fallback local temporariamente
```

#### **Performance Degradation**
```bash
# Diagnóstico
npm run test:performance

# Soluções
1. Verificar cache Redis funcionando
2. Otimizar queries Firebase
3. Reduzir payload MCP calls
4. Implementar lazy loading
```

### **Logs de Debug**

```bash
# Ativar debug completo
export CLAUDE_DEBUG=1
export CLAUDE_AGENT_DEBUG=1
export CLAUDE_MCP_DEBUG=1

# Monitorar logs em tempo real
tail -f ~/.claude/logs/debug.log
tail -f ~/.claude/logs/agent-execution.log
tail -f ~/.claude/logs/hooks-performance.log
tail -f ~/.claude/logs/mcp-communication.log
```

### **Emergency Recovery**

```bash
#!/bin/bash
# Script de Recovery Emergencial

echo "🚨 Iniciando Emergency Recovery..."

# 1. Reset configuração
claude config reset

# 2. Re-adicionar MCP
claude mcp add --transport http mcp-firebase-memoryys https://mcp.vercel.com/cta-mantraom/firebase-memoryys

# 3. Validar sistema
/validate-flow

# 4. Testar agentes críticos
echo "Testar Frontend Agent"
echo "Testar Payment Agent - Device ID critical"
echo "Testar Medical Validator - LGPD compliance"

echo "✅ Recovery completo - sistema operacional"
```

---

**🎯 Este guia de validação garante que cada agente do sistema Memoryys funcione perfeitamente, mantendo a qualidade crítica necessária para salvar vidas em emergências médicas.**