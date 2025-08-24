# 🔄 Fluxogramas de Execução - Sistema de Agentes Memoryys

**Documentação Técnica**: Fluxos detalhados de execução dos agentes especializados  
**Última Atualização**: 19 de agosto de 2025  
**Sistema**: Claude Code Agent Orchestration

## 📚 Índice
- [🎭 Fluxo Principal de Orquestração](#-fluxo-principal-de-orquestração)
- [🎨 Frontend Agent - Execução Detalhada](#-frontend-agent---execução-detalhada)
- [⚙️ Backend Agent - Execução Detalhada](#️-backend-agent---execução-detalhada)
- [💳 Payment Agent - Execução Detalhada](#-payment-agent---execução-detalhada)
- [🏥 Medical Validator - Execução Detalhada](#-medical-validator---execução-detalhada)
- [🚀 Deploy Orchestrator - Execução Detalhada](#-deploy-orchestrator---execução-detalhada)
- [🔗 Hooks Automáticos](#-hooks-automáticos)
- [⚡ MCP Integration Flow](#-mcp-integration-flow)
- [🛡️ Error Handling & Recovery](#️-error-handling--recovery)

---

## 🎭 Fluxo Principal de Orquestração

```mermaid
graph TD
    A[👤 User Request] --> B{🔍 Pattern Detection}
    
    B -->|react, component, tsx| C[🎨 Frontend Agent]
    B -->|api, firebase, backend| D[⚙️ Backend Agent]
    B -->|mercadopago, payment| E[💳 Payment Agent]
    B -->|medical, lgpd, emergency| F[🏥 Medical Validator]
    B -->|deploy, build, ci| G[🚀 Deploy Orchestrator]
    B -->|No Match| H[💬 Claude Principal]
    
    C --> I[📋 Task Tool Invocation]
    D --> I
    E --> I
    F --> I
    G --> I
    
    I --> J[🔧 Agent Execution]
    J --> K[⚡ Hooks Triggered]
    K --> L{✅ Validation Pass?}
    
    L -->|Yes| M[📤 Result to Principal]
    L -->|No| N[❌ Error Handling]
    
    N --> O[🔄 Retry/Rollback]
    O --> P{🎯 Recovery Possible?}
    
    P -->|Yes| J
    P -->|No| Q[🚨 Error Report]
    
    M --> R[📊 Context Update]
    Q --> R
    R --> S[✅ Task Complete]
```

### **Timing Breakdown**
- **Pattern Detection**: ~100ms
- **Agent Selection**: ~50ms  
- **Task Tool Invocation**: ~200ms
- **Agent Execution**: 2-30s (depends on complexity)
- **Hook Validation**: ~1-3s
- **Result Processing**: ~100ms
- **Total**: 3-35s typical

---

## 🎨 Frontend Agent - Execução Detalhada

### **Trigger Flow**
```mermaid
sequenceDiagram
    participant U as User
    participant CP as Claude Principal
    participant FA as Frontend Agent
    participant TH as TypeScript Hook
    participant FS as File System
    
    U->>CP: "Create React component with Shadcn/UI"
    CP->>CP: Detect: react, component, shadcn
    CP->>FA: Task("frontend-agent", context)
    
    FA->>FA: Analyze existing components
    FA->>FA: Check Shadcn/UI compatibility
    FA->>FA: Generate component code
    
    FA->>FS: Write component file
    FS->>TH: PostToolUse hook triggered
    TH->>TH: TypeScript validation
    TH->>FA: Validation result
    
    alt Validation Success
        FA->>CP: Component created successfully
    else Validation Failed
        TH->>FA: TypeScript errors
        FA->>FA: Fix errors
        FA->>FS: Update component
    end
    
    FA->>CP: Final result with metrics
    CP->>U: Component ready + documentation
```

### **Frontend Agent Internal Process**
```mermaid
graph TD
    A[📥 Task Received] --> B[📊 Context Analysis]
    B --> C{🎯 Task Type?}
    
    C -->|Component Creation| D[🧩 Component Flow]
    C -->|MercadoPago Integration| E[💳 Payment Flow]
    C -->|Performance Optimization| F[⚡ Performance Flow]
    C -->|Bug Fix| G[🔧 Bug Fix Flow]
    
    D --> D1[🔍 Analyze existing components]
    D1 --> D2[📋 Check Shadcn/UI patterns]
    D2 --> D3[⚡ Generate TypeScript interfaces]
    D3 --> D4[🎨 Create component structure]
    D4 --> D5[🔧 Add error handling]
    D5 --> D6[♿ Implement accessibility]
    D6 --> H[📝 Write Files]
    
    E --> E1[🔍 Check Device ID patterns]
    E1 --> E2[🔧 Implement collection logic]
    E2 --> E3[⚠️ Add error states]
    E3 --> E4[🔄 Add retry mechanisms]
    E4 --> H
    
    F --> F1[📊 Analyze current performance]
    F1 --> F2[🎯 Identify bottlenecks]
    F2 --> F3[⚡ Apply optimizations]
    F3 --> F4[📈 Add monitoring]
    F4 --> H
    
    G --> G1[🔍 Identify issue location]
    G1 --> G2[🧪 Reproduce problem]
    G2 --> G3[🔧 Implement fix]
    G3 --> G4[✅ Verify fix]
    G4 --> H
    
    H --> I[⚡ TypeScript Hook]
    I --> J{✅ Validation OK?}
    
    J -->|Yes| K[📊 Performance Check]
    J -->|No| L[🔧 Auto-fix Attempt]
    
    L --> M{🎯 Fix Successful?}
    M -->|Yes| K
    M -->|No| N[❌ Error Report]
    
    K --> O[📤 Success Result]
    N --> P[📤 Error Result]
```

### **File Operations Sequence**
1. **Read existing components** (pattern analysis)
2. **Generate new component code** 
3. **Write TypeScript file** → Triggers Hook
4. **Write test file** (if applicable)
5. **Update index exports** (if needed)
6. **Generate documentation** (JSDoc)

### **Validation Points**
- ✅ TypeScript strict mode compliance
- ✅ Shadcn/UI pattern adherence
- ✅ Accessibility standards (WCAG)
- ✅ Performance benchmarks
- ✅ Error handling completeness

---

## ⚙️ Backend Agent - Execução Detalhada

### **Execution Flow**
```mermaid
graph TD
    A[📥 Backend Task] --> B[🏗️ Architecture Check]
    B --> C{📋 Task Category?}
    
    C -->|API Endpoint| D[🌐 API Flow]
    C -->|Firebase Integration| E[🔥 Firebase Flow]
    C -->|Cache Strategy| F[📊 Cache Flow]
    C -->|Email Service| G[📧 Email Flow]
    
    D --> D1[📝 Define Zod Schema]
    D1 --> D2[🏭 Factory Pattern Check]
    D2 --> D3[⚡ Implement Endpoint]
    D3 --> D4[📊 Add Structured Logging]
    D4 --> D5[🔒 Security Validation]
    D5 --> H[📁 Write API File]
    
    E --> E1[🔍 Check Firebase App Init]
    E1 --> E2{🏭 Factory Pattern Present?}
    E2 -->|No| E3[🔧 Implement Factory Pattern]
    E2 -->|Yes| E4[📊 Use Existing Pattern]
    E3 --> E4
    E4 --> E5[🔥 Firebase Operations]
    E5 --> H
    
    F --> F1[📊 Analyze Cache Requirements]
    F1 --> F2[⏱️ Define TTL Strategy]
    F2 --> F3[🔄 Implement Cache Logic]
    F3 --> F4[📈 Add Metrics]
    F4 --> H
    
    G --> G1[📧 AWS SES Configuration]
    G1 --> G2[📝 Template Management]
    G2 --> G3[🔄 Queue Integration]
    G3 --> G4[📊 Delivery Tracking]
    G4 --> H
    
    H --> I[⚡ Multiple Hooks]
    I --> I1[🔍 TypeScript Hook]
    I --> I2[🔒 Secrets Hook]
    I --> I3[💳 MercadoPago Hook]
    
    I1 --> J{✅ All Validations Pass?}
    I2 --> J
    I3 --> J
    
    J -->|Yes| K[🔄 Deploy Readiness Check]
    J -->|No| L[🔧 Auto-fix Attempts]
    
    L --> M{🎯 Fixable?}
    M -->|Yes| N[🔧 Apply Fixes]
    M -->|No| O[❌ Detailed Error Report]
    
    N --> K
    K --> P[📤 Success + Metrics]
    O --> Q[📤 Error + Suggestions]
```

### **Serverless Optimization Process**
```mermaid
sequenceDiagram
    participant BA as Backend Agent
    participant FS as File System
    participant FB as Firebase
    participant RD as Redis
    participant QS as QStash
    
    BA->>BA: Analyze serverless requirements
    BA->>FS: Check for Factory Pattern
    
    alt Factory Pattern Missing
        BA->>FS: Implement getFirebaseApp()
        BA->>FS: Update all Firebase imports
    end
    
    BA->>FB: Test Firebase connection
    BA->>RD: Test Redis connectivity
    BA->>QS: Test QStash availability
    
    BA->>FS: Write optimized function
    FS->>BA: Trigger validation hooks
    
    BA->>BA: Cold start optimization
    BA->>BA: Memory usage analysis
    BA->>FS: Apply optimizations
```

### **Performance Targets**
- 🎯 **Cold Start**: < 500ms
- 🎯 **API Response**: < 500ms P95
- 🎯 **Firebase Query**: < 200ms
- 🎯 **Cache Hit**: < 50ms
- 🎯 **Memory Usage**: < 128MB

---

## 💳 Payment Agent - Execução Detalhada

### **Payment Workflow Critical Path**
```mermaid
graph TD
    A[💳 Payment Task] --> B[🔍 Device ID Check]
    B --> C{📱 Device ID Required?}
    
    C -->|Yes| D[⚠️ CRITICAL: Validate Device ID]
    C -->|No| E[📊 Standard Payment Flow]
    
    D --> D1{📱 Device ID Present?}
    D1 -->|No| D2[🚨 BLOCK: Missing Device ID]
    D1 -->|Yes| D3[✅ Continue with Device ID]
    
    D2 --> D4[📝 Log Critical Error]
    D4 --> D5[❌ Return Error to User]
    
    D3 --> F[🔒 HMAC Validation Check]
    E --> F
    
    F --> G{🔐 Webhook Security?}
    G -->|Required| H[🔒 Implement HMAC]
    G -->|Not Required| I[📊 Payment Processing]
    
    H --> H1[🔐 Generate HMAC Logic]
    H1 --> H2[🔍 Signature Validation]
    H2 --> H3[⏱️ Timestamp Verification]
    H3 --> H4[🔄 Replay Attack Prevention]
    H4 --> I
    
    I --> J[⚡ Async Processing Check]
    J --> K{🔄 Webhook Processing?}
    
    K -->|Yes| L[🚨 CRITICAL: Must be Async]
    K -->|No| M[📊 Sync Processing OK]
    
    L --> L1{⚡ QStash Integration?}
    L1 -->|No| L2[🔧 Implement QStash Queue]
    L1 -->|Yes| L3[✅ Use Existing Queue]
    
    L2 --> L3
    L3 --> N[📝 Write Payment Code]
    M --> N
    
    N --> O[⚡ MercadoPago Hook]
    O --> P{✅ Validation Pass?}
    
    P -->|Yes| Q[📊 Approval Rate Analysis]
    P -->|No| R[🔧 Fix Critical Issues]
    
    R --> S{🎯 Auto-fixable?}
    S -->|Yes| T[🔧 Apply Auto-fixes]
    S -->|No| U[❌ Manual Intervention Required]
    
    T --> Q
    Q --> V[📈 Performance Metrics]
    V --> W[📤 Success Result]
    U --> X[📤 Error with Fix Guide]
```

### **Device ID Collection Flow**
```mermaid
sequenceDiagram
    participant PA as Payment Agent
    participant MP as MercadoPago
    participant JS as JavaScript Runtime
    participant UI as User Interface
    
    PA->>PA: Analyze Device ID requirement
    PA->>JS: Check MP script loading
    
    alt Script Not Loaded
        PA->>UI: Add MP security script
        PA->>UI: Set view="checkout" attribute
    end
    
    PA->>JS: Implement polling logic
    PA->>JS: Add timeout safety (10s)
    PA->>UI: Add error handling
    
    loop Device ID Collection
        JS->>MP: Check MP_DEVICE_SESSION_ID
        MP-->>JS: Device ID or undefined
        
        alt Device ID Available
            JS->>UI: Store device_id
            break
        else Timeout Reached
            JS->>UI: Error - Device ID timeout
            break
        end
    end
    
    PA->>PA: Validate implementation
    PA->>UI: Add user feedback
```

### **Critical Validation Points**
1. ✅ **Device ID**: 100% collection rate
2. ✅ **HMAC**: Rigorosa validação webhook
3. ✅ **Async**: Zero processamento síncrono
4. ✅ **Service Layer**: Nunca API direta
5. ✅ **Approval Rate**: Target 85%+

---

## 🏥 Medical Validator - Execução Detalhada

### **Medical Data Validation Pipeline**
```mermaid
graph TD
    A[🏥 Medical Task] --> B[🔍 Data Type Analysis]
    B --> C{📋 Validation Type?}
    
    C -->|Blood Type| D[🩸 Blood Type Flow]
    C -->|Allergies| E[⚠️ Allergy Flow]
    C -->|Medications| F[💊 Medication Flow]
    C -->|Emergency Contacts| G[📞 Contact Flow]
    C -->|LGPD Compliance| H[🔒 LGPD Flow]
    C -->|QR Optimization| I[📱 QR Flow]
    
    D --> D1[📋 Validate Enum A+,A-,B+,B-,AB+,AB-,O+,O-]
    D1 --> D2[🔍 Check Format Consistency]
    D2 --> D3[⚡ Generate Zod Schema]
    D3 --> J[📝 Implementation]
    
    E --> E1[🧹 Sanitize Input (lowercase, trim)]
    E1 --> E2[🔍 Check Common Allergies DB]
    E2 --> E3[⚠️ Cross-reference with Medications]
    E3 --> E4[📊 Severity Classification]
    E4 --> J
    
    F --> F1[📋 Validate Medication Names]
    F1 --> F2[🔍 Check Controlled Substances]
    F2 --> F3[⚠️ Drug Interaction Analysis]
    F3 --> F4[👶 Age-appropriate Dosage Check]
    F4 --> J
    
    G --> G1[📞 Validate Brazilian Phone Format]
    G1 --> G2[👥 Relationship Validation]
    G2 --> G3[📊 Contact Prioritization]
    G3 --> G4[🔍 Duplicate Detection]
    G4 --> J
    
    H --> H1[🔒 Anonymization Implementation]
    H1 --> H2[📊 Audit Trail Setup]
    H2 --> H3[⏱️ TTL Configuration]
    H3 --> H4[📋 User Rights Implementation]
    H4 --> J
    
    I --> I1[📱 QR Size Optimization < 2KB]
    I1 --> I2[⚡ Cache Strategy Implementation]
    I2 --> I3[📊 Performance Monitoring]
    I3 --> I4[🔄 Fallback Mechanism]
    I4 --> J
    
    J --> K[📝 Generate Validation Code]
    K --> L[⚡ Medical Validation Hooks]
    L --> M{✅ LGPD Compliant?}
    
    M -->|No| N[🔒 Fix LGPD Issues]
    M -->|Yes| O{⚡ Performance OK?}
    
    N --> O
    O -->|No| P[⚡ Performance Optimization]
    O -->|Yes| Q[📊 Consistency Validation]
    
    P --> Q
    Q --> R{🔍 Data Consistent?}
    
    R -->|No| S[⚠️ Generate Warnings]
    R -->|Yes| T[✅ Validation Complete]
    
    S --> U[📝 Warning Documentation]
    U --> T
    T --> V[📤 Validated Medical System]
```

### **LGPD Compliance Automation**
```mermaid
sequenceDiagram
    participant MV as Medical Validator
    participant LOG as Logging System
    participant DB as Database
    participant CACHE as Redis Cache
    participant AUDIT as Audit System
    
    MV->>MV: Analyze medical data access
    MV->>LOG: Implement anonymization
    
    loop For Each Medical Data Point
        MV->>LOG: hash(personalData)
        MV->>LOG: category(medicalData)
        LOG->>AUDIT: Log anonymized access
    end
    
    MV->>CACHE: Set TTL 24h for emergency data
    MV->>DB: Implement user rights endpoints
    MV->>AUDIT: Create compliance dashboard
    
    MV->>MV: Generate compliance report
    MV->>DB: Schedule automatic cleanup
```

### **Emergency Optimization Targets**
- 🎯 **QR Load Time**: < 2 seconds
- 🎯 **Cache Hit Rate**: > 95%
- 🎯 **Data Validation**: < 100ms
- 🎯 **LGPD Compliance**: 100%
- 🎯 **Emergency Access**: < 1 second

---

## 🚀 Deploy Orchestrator - Execução Detalhada

### **Zero-Downtime Deployment Flow**
```mermaid
graph TD
    A[🚀 Deploy Request] --> B[📊 Pre-Deploy Validation]
    B --> C[🧪 All Tests Pass?]
    
    C -->|No| D[❌ Block Deploy]
    C -->|Yes| E[🔄 Blue-Green Setup]
    
    D --> D1[📝 Generate Test Report]
    D1 --> D2[🔧 Fix Suggestions]
    D2 --> Z[❌ Deploy Blocked]
    
    E --> F[🌿 Deploy to Green Environment]
    F --> G[⏱️ Wait for Deployment]
    G --> H[🏥 Health Check Green]
    
    H --> I{✅ Green Healthy?}
    I -->|No| J[🔄 Retry Deployment]
    I -->|Yes| K[🧪 Smoke Tests]
    
    J --> L{🔄 Retry Count < 3?}
    L -->|Yes| F
    L -->|No| M[❌ Deploy Failed]
    
    K --> N{🧪 Smoke Tests Pass?}
    N -->|No| O[🔄 Rollback to Blue]
    N -->|Yes| P[📊 Performance Validation]
    
    P --> Q{📈 Performance OK?}
    Q -->|No| O
    Q -->|Yes| R[🔄 Traffic Switch Blue→Green]
    
    R --> S[📊 Monitor for 10 minutes]
    S --> T[📈 Continuous Monitoring]
    
    T --> U{⚠️ Issues Detected?}
    U -->|Yes| V[🚨 Auto-Rollback]
    U -->|No| W[✅ Deploy Successful]
    
    O --> X[📝 Rollback Complete]
    V --> X
    M --> Y[📝 Deploy Failed Report]
    X --> Y
    W --> AA[📊 Success Metrics]
    Y --> BB[📊 Failure Analysis]
```

### **Health Check Automation**
```mermaid
sequenceDiagram
    participant DO as Deploy Orchestrator
    participant API as Health API
    participant FB as Firebase
    participant RD as Redis
    participant MP as MercadoPago
    participant AWS as AWS SES
    
    DO->>API: GET /api/health
    API->>FB: Check Firebase connectivity
    API->>RD: Check Redis availability
    API->>MP: Check MercadoPago API
    API->>AWS: Check AWS SES status
    
    FB-->>API: Status + response time
    RD-->>API: Status + response time
    MP-->>API: Status + response time
    AWS-->>API: Status + response time
    
    API->>API: Aggregate health status
    
    alt All Services Healthy
        API-->>DO: 200 OK + detailed status
        DO->>DO: Continue deployment
    else Any Service Unhealthy
        API-->>DO: 503 Service Unavailable
        DO->>DO: Block deployment/trigger rollback
    end
    
    DO->>DO: Log health check results
    DO->>DO: Update monitoring dashboard
```

### **Critical Monitoring Points**
1. ✅ **API Response Time**: < 500ms P95
2. ✅ **Error Rate**: < 0.1%
3. ✅ **QR Code Load**: < 2s
4. ✅ **Payment Success**: > 85%
5. ✅ **System Uptime**: 99.9%

---

## 🔗 Hooks Automáticos

### **TypeScript Validator Hook**
```mermaid
graph LR
    A[📝 File Edit] --> B[⚡ PostToolUse Hook]
    B --> C{📄 .ts/.tsx file?}
    C -->|No| D[⏭️ Skip Hook]
    C -->|Yes| E[🐍 typescript-validator.py]
    
    E --> F[📊 Run npx tsc --noEmit]
    F --> G{✅ No Errors?}
    
    G -->|Yes| H[✅ Hook Success]
    G -->|No| I[❌ TypeScript Errors]
    
    I --> J[📝 Display Errors]
    J --> K[🔧 Auto-fix Attempt]
    K --> L{🔧 Fix Successful?}
    
    L -->|Yes| H
    L -->|No| M[❌ Block Operation]
    
    H --> N[⏭️ Continue]
    M --> O[🛑 Stop Process]
```

### **MercadoPago Validator Hook**
```mermaid
graph LR
    A[📝 Payment File Edit] --> B[⚡ PostToolUse Hook]
    B --> C{💳 Payment Related?}
    C -->|No| D[⏭️ Skip Hook]
    C -->|Yes| E[🐍 mercadopago-validator.py]
    
    E --> F[🔍 Check Device ID]
    F --> G[🔒 Check HMAC Validation]
    G --> H[⚡ Check Async Processing]
    H --> I[🔧 Check Service Usage]
    
    I --> J{✅ All Checks Pass?}
    J -->|Yes| K[✅ Hook Success]
    J -->|No| L[❌ Critical Issues]
    
    L --> M[📝 List Issues]
    M --> N[🔧 Suggest Fixes]
    N --> O[❌ Block Operation]
    
    K --> P[⏭️ Continue]
    O --> Q[🛑 Stop Process]
```

### **Secrets Scanner Hook**
```mermaid
graph LR
    A[💻 Bash Command] --> B[⚡ PreToolUse Hook]
    B --> C[🐍 secrets-scanner.py]
    
    C --> D[🔍 Scan for Secrets]
    D --> E[🔒 Check Dangerous Commands]
    E --> F[⚡ Check Serverless Compat]
    
    F --> G{🚨 Threats Detected?}
    G -->|No| H[✅ Command Approved]
    G -->|Yes| I[❌ Security Block]
    
    I --> J[📝 List Threats]
    J --> K[🔒 Security Warning]
    K --> L[❌ Block Command]
    
    H --> M[⏭️ Execute Command]
    L --> N[🛑 Command Blocked]
```

### **Hook Execution Timing**
- **PreToolUse**: ~100-500ms
- **PostToolUse**: ~1-3s  
- **Total Overhead**: ~1-4s per operation

---

## ⚡ MCP Integration Flow

### **MCP Server Communication**
```mermaid
sequenceDiagram
    participant Agent as Specialized Agent
    participant MCP as MCP Server
    participant Vercel as Vercel API
    participant MP as MercadoPago API
    participant FB as Firebase API
    
    Agent->>MCP: Request MCP operation
    MCP->>MCP: Validate credentials
    MCP->>MCP: Check server availability
    
    alt Vercel Operation
        MCP->>Vercel: Deploy/manage request
        Vercel-->>MCP: Operation result
    else MercadoPago Operation
        MCP->>MP: Payment/webhook request
        MP-->>MCP: Payment result
    else Firebase Operation
        MCP->>FB: Database/storage request
        FB-->>MCP: Data result
    end
    
    MCP->>Agent: Operation result
    
    alt MCP Server Down
        MCP->>Agent: Fallback to direct API
        Agent->>Agent: Use local config
    end
```

### **Fallback Strategy**
```mermaid
graph TD
    A[🔌 MCP Request] --> B{🔍 MCP Available?}
    B -->|Yes| C[⚡ Use MCP Server]
    B -->|No| D[🔄 Fallback Mode]
    
    C --> E{✅ MCP Success?}
    E -->|Yes| F[📤 Return Result]
    E -->|No| G[⚠️ MCP Error]
    
    G --> H[📝 Log MCP Failure]
    H --> D
    
    D --> I[📁 Check Local Config]
    I --> J[🔗 Direct API Call]
    J --> K[📝 Log Fallback Usage]
    K --> F
```

---

## 🛡️ Error Handling & Recovery

### **Error Propagation Chain**
```mermaid
graph TD
    A[❌ Error Detected] --> B{🔍 Error Type?}
    
    B -->|Validation Error| C[🔧 Auto-fix Attempt]
    B -->|System Error| D[🔄 Retry Logic]
    B -->|Security Error| E[🚨 Immediate Block]
    B -->|Performance Error| F[⚡ Optimization]
    
    C --> G{🔧 Fix Successful?}
    G -->|Yes| H[✅ Continue]
    G -->|No| I[📝 Manual Intervention]
    
    D --> J{🔄 Retry Successful?}
    J -->|Yes| H
    J -->|No| K[📊 Escalate Issue]
    
    E --> L[🛑 Block Operation]
    L --> M[📝 Security Report]
    
    F --> N{⚡ Optimization OK?}
    N -->|Yes| H
    N -->|No| O[📈 Performance Report]
    
    I --> P[📤 Error to User]
    K --> P
    M --> P
    O --> P
    H --> Q[✅ Success]
```

### **Recovery Procedures**
1. **Auto-fix**: TypeScript errors, format issues
2. **Retry**: Network failures, temporary issues  
3. **Rollback**: Deploy failures, breaking changes
4. **Escalate**: Security issues, system failures
5. **Manual**: Complex issues requiring human intervention

### **Recovery Timing Targets**
- 🎯 **Auto-fix**: < 5 seconds
- 🎯 **Retry**: < 30 seconds
- 🎯 **Rollback**: < 2 minutes
- 🎯 **Escalation**: Immediate
- 🎯 **Manual Response**: < 15 minutes

---

## 📊 Performance Metrics

### **Agent Performance Benchmarks**
| Agent | Avg Execution | P95 Execution | Success Rate | Error Recovery |
|-------|---------------|---------------|--------------|----------------|
| Frontend | 5-15s | 25s | 98% | 90% |
| Backend | 10-30s | 45s | 95% | 85% |
| Payment | 3-10s | 20s | 99% | 95% |
| Medical | 2-8s | 15s | 99% | 98% |
| Deploy | 60-300s | 600s | 97% | 80% |

### **System-wide SLIs**
- **Agent Availability**: 99.9%
- **Hook Success Rate**: 98%
- **MCP Connectivity**: 95%
- **Overall Success**: 97%
- **Error Recovery**: 90%

---

## 🎯 Debugging & Monitoring

### **Debug Information Access**
```bash
# Enable debug mode
export CLAUDE_DEBUG=1

# Monitor agent execution
tail -f ~/.claude/logs/agent-execution.log

# Check hook performance
tail -f ~/.claude/logs/hooks-performance.log

# MCP connectivity
claude mcp status --detailed
```

### **Performance Monitoring**
```bash
# Real-time metrics
watch -n 5 '/validate-flow'

# Agent response times
grep "Agent.*completed" ~/.claude/logs/debug.log | tail -20

# Hook execution times
grep "Hook.*duration" ~/.claude/logs/hooks.log | tail -20
```

### **Alerting Thresholds**
- ⚠️ **Agent timeout**: > 60s
- 🚨 **Hook failure**: > 3 consecutive
- ⚠️ **MCP disconnect**: > 5 minutes
- 🚨 **Error rate**: > 5% in 10 minutes

---

**📈 Este fluxograma documentado garante total transparência do sistema de agentes, permitindo debugging eficiente e otimização contínua para o sistema crítico Memoryys.**