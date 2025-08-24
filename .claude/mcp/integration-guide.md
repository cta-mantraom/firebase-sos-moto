# 🔌 Guia de Integração MCP Servers - Sistema Memoryys

## 🎯 Visão Geral

Os servidores MCP (Model Context Protocol) permitem que os agentes especializados do Memoryys se integrem diretamente com serviços externos, proporcionando automação avançada e operações em tempo real.

## 📊 Servidores MCP Configurados

### **🚀 Vercel Server**
**Responsável**: Deploy Orchestrator  
**Finalidade**: Gerenciamento de deploys e ambiente Vercel

**Capacidades**:
- Deploy preview/production automatizado
- Gerenciamento de environment variables
- Monitoramento de logs de deployment
- Status de health check de deploys

**Uso pelo Deploy Orchestrator**:
```typescript
// Exemplo de deploy automatizado
await mcp.vercel.deployPreview({
  branch: 'feature/payment-fix',
  environment: 'preview',
  healthCheck: true
});

// Monitoramento de deployment
const status = await mcp.vercel.getDeploymentStatus(deploymentId);
if (status.state !== 'READY') {
  await mcp.vercel.rollbackToPrevious();
}
```

### **💳 MercadoPago Server** 
**Responsável**: Payment Agent  
**Finalidade**: Integração direta com APIs MercadoPago

**Capacidades**:
- Criação de preferências de pagamento
- Validação de webhooks HMAC
- Métricas de taxa de aprovação
- Gerenciamento de clientes

**Uso pelo Payment Agent**:
```typescript
// Criação de pagamento com Device ID validation
const preference = await mcp.mercadopago.createPreference({
  items: [planData],
  payer: payerData,
  device_id: deviceId, // ⚠️ OBRIGATÓRIO
  additional_info: additionalInfo
});

// Validação HMAC automática
const isValid = await mcp.mercadopago.validateWebhookSignature({
  signature: req.headers['x-signature'],
  payload: req.body,
  secret: process.env.MERCADOPAGO_WEBHOOK_SECRET
});
```

### **🎨 Shadcn/UI Server**
**Responsável**: Frontend Agent  
**Finalidade**: Gerenciamento de componentes UI

**Capacidades**:
- Instalação automática de componentes
- Atualização de biblioteca de componentes  
- Geração de código de componentes customizados
- Verificação de compatibilidade

**Uso pelo Frontend Agent**:
```typescript
// Adicionar novo componente automaticamente
await mcp.shadcn.addComponent('calendar');

// Verificar componentes desatualizados
const outdated = await mcp.shadcn.checkOutdatedComponents();
if (outdated.length > 0) {
  await mcp.shadcn.updateComponents(outdated);
}
```

### **🔥 Firebase Server**
**Responsável**: Backend Agent, Medical Validator  
**Finalidade**: Gerenciamento Firebase/Firestore

**Capacidades**:
- Deploy de functions automatizado
- Backup de dados médicos  
- Gerenciamento de rules de segurança
- Métricas de uso

**Uso pelo Backend Agent**:
```typescript
// Deploy automático de functions
await mcp.firebase.deployFunctions(['createPayment', 'processWebhook']);

// Backup de dados médicos (Medical Validator)
await mcp.firebase.backupCollection('profiles', {
  includeSubcollections: true,
  anonymize: true // LGPD compliance
});
```

### **⚡ Upstash Server**
**Responsável**: Backend Agent, Payment Agent  
**Finalidade**: Cache Redis e filas QStash

**Capacidades**:
- Gerenciamento de cache Redis
- Publicação de jobs QStash
- Monitoramento de filas
- Métricas de performance

**Uso pelo Backend Agent**:
```typescript
// Cache de dados médicos para emergência
await mcp.upstash.setCacheWithTTL(`emergency:${profileId}`, profileData, 86400);

// Enfileiramento de job via QStash
await mcp.upstash.publishJob({
  endpoint: '/api/processors/final-processor',
  payload: { paymentId, correlationId },
  delay: 0
});
```

### **📧 AWS SES Server**
**Responsável**: Backend Agent, Medical Validator  
**Finalidade**: Envio de emails transacionais

**Capacidades**:
- Envio de emails com templates
- Métricas de entrega
- Gerenciamento de bounce/complaint
- Templates de emergência médica

**Uso pelo Backend Agent**:
```typescript
// Envio de email de confirmação
await mcp.awsSes.sendTemplatedEmail({
  template: 'profile-created',
  recipient: userEmail,
  templateData: {
    name: profileData.name,
    qrCodeUrl: qrCodeUrl,
    planType: planType
  }
});
```

## 🤝 Integração por Agente

### **Frontend Agent + MCP**
```typescript
// Workflow: Atualização de componentes UI
async function updateUIComponents() {
  // 1. Verificar componentes desatualizados
  const outdated = await mcp.shadcn.checkOutdatedComponents();
  
  // 2. Atualizar se necessário
  if (outdated.length > 0) {
    logInfo('Updating outdated Shadcn components', { components: outdated });
    await mcp.shadcn.updateComponents(outdated);
  }
  
  // 3. Validar compatibilidade
  const compatibility = await mcp.shadcn.checkCompatibility();
  if (!compatibility.isCompatible) {
    logWarning('Component compatibility issues detected', compatibility.issues);
  }
}
```

### **Backend Agent + MCP**
```typescript
// Workflow: Deploy coordenado
async function coordinatedDeploy() {
  // 1. Deploy Firebase Functions
  await mcp.firebase.deployFunctions(['api-functions']);
  
  // 2. Deploy Vercel
  const deployment = await mcp.vercel.deployProduction({
    environmentVariables: await mcp.vercel.getEnvironmentVariables()
  });
  
  // 3. Validar deploy
  const healthCheck = await mcp.vercel.runHealthCheck(deployment.url);
  if (!healthCheck.healthy) {
    await mcp.vercel.rollbackToPrevious();
    throw new Error('Health check failed - rolled back');
  }
  
  // 4. Cache warmup
  await mcp.upstash.warmupCache(['emergency-profiles', 'payment-data']);
}
```

### **Payment Agent + MCP**
```typescript
// Workflow: Processamento completo de pagamento
async function processPaymentWorkflow(paymentData: PaymentData) {
  // 1. Validar Device ID
  if (!paymentData.device_id) {
    throw new Error('Device ID obrigatório para aprovação MercadoPago');
  }
  
  // 2. Criar preferência via MCP
  const preference = await mcp.mercadopago.createPreference({
    ...paymentData,
    notification_url: await mcp.vercel.getWebhookURL('mercadopago-webhook')
  });
  
  // 3. Monitorar aprovação
  const approvalMetrics = await mcp.mercadopago.getApprovalMetrics();
  logInfo('Payment approval metrics', approvalMetrics);
  
  return preference;
}
```

### **Medical Validator + MCP**
```typescript
// Workflow: Backup e compliance LGPD
async function medicalDataCompliance() {
  // 1. Backup automático
  const backupId = await mcp.firebase.backupCollection('profiles', {
    anonymize: true, // LGPD compliance
    retention: '5-years'
  });
  
  // 2. Validar dados em cache
  const cacheMetrics = await mcp.upstash.getCacheMetrics('emergency:*');
  
  // 3. Limpar dados expirados
  if (cacheMetrics.expiredKeys > 0) {
    await mcp.upstash.cleanupExpiredKeys('emergency:*');
  }
  
  // 4. Relatório de compliance
  logInfo('LGPD compliance check completed', {
    backupId,
    cacheMetrics,
    complianceScore: calculateComplianceScore()
  });
}
```

### **Deploy Orchestrator + MCP**
```typescript
// Workflow: Deploy com zero downtime
async function zeroDowntimeDeploy() {
  // 1. Pre-deploy validation
  const preDeployChecks = await runPreDeployValidation();
  if (!preDeployChecks.passed) {
    throw new Error('Pre-deploy validation failed');
  }
  
  // 2. Deploy preview
  const previewDeploy = await mcp.vercel.deployPreview({
    runSmokeTests: true
  });
  
  // 3. Smoke tests via MCP
  const smokeTestResults = await runSmokeTestsViaMCP(previewDeploy.url);
  if (!smokeTestResults.passed) {
    await mcp.vercel.deleteDeployment(previewDeploy.id);
    throw new Error('Smoke tests failed');
  }
  
  // 4. Deploy production
  const prodDeploy = await mcp.vercel.deployProduction({
    promoteFrom: previewDeploy.id
  });
  
  // 5. Post-deploy monitoring
  await monitorDeploymentHealth(prodDeploy.id, {
    duration: '10-minutes',
    alertOnErrors: true
  });
}
```

## 🔧 Configuração e Setup

### **1. Environment Variables**
```bash
# Vercel
VERCEL_TOKEN=your-vercel-token
VERCEL_PROJECT_ID=your-project-id

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-token
MERCADOPAGO_PUBLIC_KEY=APP_USR-your-public-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# Firebase
GOOGLE_APPLICATION_CREDENTIALS=path-to-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project

# Upstash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
QSTASH_TOKEN=your-qstash-token

# AWS SES
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=sa-east-1
```

### **2. Inicialização de Servidores**
```bash
# Inicializar servidores essenciais
claude mcp start --group=essential

# Inicializar todos os servidores
claude mcp start --group=production

# Verificar status
claude mcp status
```

### **3. Validação de Conectividade**
```typescript
// Testar conectividade de todos os servidores
async function validateMCPConnectivity() {
  const servers = ['vercel', 'mercadopago', 'firebase', 'upstash', 'aws-ses'];
  
  for (const server of servers) {
    try {
      const status = await mcp[server].healthCheck();
      logInfo(`MCP ${server} status`, status);
    } catch (error) {
      logError(`MCP ${server} connection failed`, error);
    }
  }
}
```

## 📊 Monitoramento e Observabilidade

### **Health Checks Automáticos**
```typescript
// Executar health checks a cada 5 minutos
setInterval(async () => {
  const healthResults = await Promise.allSettled([
    mcp.vercel.healthCheck(),
    mcp.mercadopago.healthCheck(), 
    mcp.firebase.healthCheck(),
    mcp.upstash.healthCheck(),
    mcp.awsSes.healthCheck()
  ]);
  
  healthResults.forEach((result, index) => {
    const serverName = servers[index];
    if (result.status === 'rejected') {
      logError(`MCP ${serverName} health check failed`, result.reason);
      // Trigger alert
    }
  });
}, 300000); // 5 minutes
```

### **Performance Metrics**
```typescript
interface MCPMetrics {
  server: string;
  responseTime: number;
  errorRate: number;
  requestCount: number;
  lastHealthCheck: Date;
}

// Coletar métricas de performance
async function collectMCPMetrics(): Promise<MCPMetrics[]> {
  return await Promise.all(
    mcpServers.map(async (server) => ({
      server: server.name,
      responseTime: await server.getAverageResponseTime(),
      errorRate: await server.getErrorRate(),
      requestCount: await server.getRequestCount(),
      lastHealthCheck: await server.getLastHealthCheck()
    }))
  );
}
```

## 🚨 Fallback e Resilência

### **Estratégias de Fallback**
```typescript
// Fallback automático se MCP server falhar
async function resilientMCPCall<T>(
  serverName: string, 
  method: string, 
  params: any,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  try {
    return await mcp[serverName][method](params);
  } catch (error) {
    logWarning(`MCP ${serverName}.${method} failed, using fallback`, error);
    
    if (fallbackFn) {
      return await fallbackFn();
    }
    
    throw new Error(`MCP ${serverName} unavailable and no fallback provided`);
  }
}

// Exemplo de uso com fallback
const preference = await resilientMCPCall(
  'mercadopago',
  'createPreference', 
  paymentData,
  () => mercadoPagoService.createPreference(paymentData) // Fallback direto
);
```

## 🎯 Best Practices

### **1. Error Handling**
- Sempre implementar fallback para operações críticas
- Log detalhado de erros MCP para debugging
- Retry automático com exponential backoff

### **2. Performance** 
- Cache responses quando possível
- Paralelizar calls MCP independentes
- Monitor response times e implementar timeouts

### **3. Security**
- Rotate tokens regularmente
- Validate credentials na inicialização
- Log audit trail de todas as operações

### **4. Monitoring**
- Health checks contínuos
- Alertas proativos para falhas
- Métricas de performance e uso

## ⚠️ Notas Importantes

1. **MCP Servers são críticos** para automação avançada
2. **Fallbacks obrigatórios** para operações de emergência  
3. **Monitoring contínuo** para detectar falhas rapidamente
4. **Credentials security** - nunca expor tokens/keys
5. **Medical data priority** - operações médicas têm precedência

**O sistema MCP permite que os agentes Memoryys operem com automação total, mantendo a qualidade e confiabilidade necessárias para salvar vidas em emergências médicas.**