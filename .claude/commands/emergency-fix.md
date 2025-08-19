---
description: Procedimentos de emergência para correção rápida de problemas críticos no sistema SOS Moto
allowed-tools: Bash(npm:*), Bash(vercel:*), Bash(git:*), Edit, MultiEdit, Read, Task, Grep, Glob
argument-hint: [issue-type] (payment|qr-access|webhook|performance|data-corruption)
---

# 🚨 Emergency Fix - SOS Moto

Procedimentos de emergência para correção rápida de problemas críticos que afetam a capacidade do sistema de salvar vidas.

## 🎯 Tipos de Emergência

### **Comando: `/emergency-fix payment`**
Problemas de pagamento MercadoPago (taxa baixa, webhook falha)

### **Comando: `/emergency-fix qr-access`**
QR Code não carrega dados médicos (emergência crítica)

### **Comando: `/emergency-fix webhook`**
Webhook MercadoPago falhando (pagamentos não processam)

### **Comando: `/emergency-fix performance`**
Performance crítica (> 5s carregamento)

### **Comando: `/emergency-fix data-corruption`**
Dados médicos corrompidos ou inacessíveis

## 🚨 PROCEDIMENTO DE EMERGÊNCIA

### **Passo 1: Avaliação Rápida (< 2 minutos)**

```bash
echo "🚨 INICIANDO PROCEDIMENTO DE EMERGÊNCIA"
echo "⏰ Início: $(date)"

# Health Check rápido
curl -s -w "%{http_code}" -o /dev/null https://sosmoto.com.br/api/health

# Status dos serviços críticos
echo "🔍 Verificando serviços críticos..."
```

**Use o deploy-orchestrator para avaliar:**
- Sistema principal online?
- APIs respondendo?
- Database conectado?
- Cache funcionando?

### **Passo 2: Diagnóstico Específico**

#### **PAYMENT - Problemas de Pagamento**

**Use o payment-agent para diagnosticar:**

1. **Taxa de aprovação baixa (< 70%)**
```bash
# Verificar Device ID collection
grep -r "MP_DEVICE_SESSION_ID" src/components/MercadoPagoCheckout.tsx

# Verificar se Device ID está sendo enviado
grep -r "device_id" api/create-payment.ts

# Fix rápido se ausente
if ! grep -q "device_id" api/create-payment.ts; then
  echo "🔧 CRITICAL: Device ID missing - applying emergency fix"
  # Usar payment-agent para implementar Device ID obrigatório
fi
```

2. **Webhook falhando**
```bash
# Verificar HMAC validation
grep -r "validateWebhook\|createHmac" api/mercadopago-webhook.ts

# Verificar logs de webhook
vercel logs --app=sosmoto-prod | grep webhook | tail -20

# Emergency webhook bypass (TEMPORÁRIO)
if [ "$WEBHOOK_FAILING" = "true" ]; then
  echo "⚠️ EMERGENCY: Implementing webhook bypass"
  # Implementar processamento alternativo via polling
fi
```

#### **QR-ACCESS - Dados Médicos Inacessíveis**

**Use o medical-validator para diagnosticar:**

1. **QR Code não carrega**
```bash
# Testar acesso direto
PROFILE_ID="test-profile-id"
curl -s "https://sosmoto.com.br/emergency/$PROFILE_ID"

# Verificar cache Redis
redis-cli -h redis-server ping 2>/dev/null || echo "❌ Redis down"

# Verificar Firebase
firebase projects:list 2>/dev/null || echo "❌ Firebase access issue"
```

2. **Fix emergencial - Bypass cache**
```typescript
// Emergency fix: Direct Firebase access se Redis falhar
// api/get-profile.ts - Emergency bypass
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Try Redis first
    let profile = await redis.get(`profile:${profileId}`);
    
    if (!profile) {
      // EMERGENCY: Direct Firebase access
      logInfo('EMERGENCY: Redis failed, accessing Firebase directly');
      const db = getFirestore(getFirebaseApp());
      const doc = await db.collection('profiles').doc(profileId).get();
      profile = doc.data();
    }
    
    return res.status(200).json(profile);
  } catch (error) {
    // CRITICAL: Return cached static data se tudo falhar
    logError('EMERGENCY: All systems failing, returning emergency data');
    return res.status(200).json({
      emergency: true,
      message: 'Sistema em manutenção - contactar emergência médica',
      phone: '192' // SAMU
    });
  }
}
```

#### **WEBHOOK - Processamento de Pagamentos**

**Use o backend-agent para diagnosticar:**

1. **Webhook timeout**
```bash
# Verificar timeout de webhook (deve ser < 22s)
grep -r "setTimeout\|timeout" api/mercadopago-webhook.ts

# Emergency fix: Immediate response
if [ "$WEBHOOK_TIMEOUT" = "true" ]; then
  echo "🔧 EMERGENCY: Implementing immediate webhook response"
  # Implementar resposta imediata + processamento em background
fi
```

2. **Queue falha (QStash down)**
```bash
# Verificar QStash status
curl -s "https://qstash.upstash.io/v1/topics" -H "Authorization: Bearer $QSTASH_TOKEN"

# Emergency fallback: Direct processing
if [ "$QSTASH_DOWN" = "true" ]; then
  echo "⚠️ EMERGENCY: QStash down, implementing direct processing"
  # Processar diretamente no webhook (temporário)
fi
```

#### **PERFORMANCE - Sistema Lento**

**Use o deploy-orchestrator para diagnosticar:**

1. **QR Code > 5s carregamento**
```bash
# Testar performance
time curl -s "https://sosmoto.com.br/emergency/test-profile"

# Verificar cache hit rate
redis-cli info stats | grep keyspace_hits

# Emergency CDN bypass
if [ "$QR_SLOW" = "true" ]; then
  echo "🚀 EMERGENCY: Implementing performance fixes"
  # Implementar cache estático para dados críticos
fi
```

2. **Database lentidão**
```bash
# Verificar conexões Firebase
firebase functions:log --only=functions --limit=50

# Emergency read-only mode
if [ "$DB_SLOW" = "true" ]; then
  echo "📚 EMERGENCY: Enabling read-only mode"
  # Cachear dados críticos estaticamente
fi
```

#### **DATA-CORRUPTION - Dados Corrompidos**

**Use o medical-validator para diagnosticar:**

1. **Dados médicos inválidos**
```bash
# Verificar schemas Zod
npm run validate:medical-schemas

# Verificar consistência de dados
find lib/domain -name "*.validator.ts" -exec node {} \;

# Emergency data validation
if [ "$DATA_CORRUPT" = "true" ]; then
  echo "🏥 EMERGENCY: Implementing data validation fixes"
  # Aplicar validação rigorosa em runtime
fi
```

### **Passo 3: Fix Emergencial**

#### **Template de Fix Rápido**

```typescript
// Emergency fix template
interface EmergencyFix {
  issue: string;
  severity: 'P0' | 'P1';
  solution: 'bypass' | 'fallback' | 'patch' | 'rollback';
  duration: string; // tempo estimado
  rollback_plan: string;
}

const emergencyFixes = {
  device_id_missing: {
    issue: 'Device ID não coletado - taxa aprovação baixa',
    severity: 'P0',
    solution: 'patch',
    fix: `
      // src/components/MercadoPagoCheckout.tsx
      useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://www.mercadopago.com/v2/security.js';
        script.setAttribute('view', 'checkout');
        document.head.appendChild(script);
        
        // EMERGENCY: Force Device ID collection
        const forceDeviceId = setInterval(() => {
          if (window.MP_DEVICE_SESSION_ID) {
            setDeviceId(window.MP_DEVICE_SESSION_ID);
            clearInterval(forceDeviceId);
          }
        }, 100);
        
        // Emergency timeout
        setTimeout(() => {
          clearInterval(forceDeviceId);
          if (!deviceId) {
            logError('EMERGENCY: Device ID timeout');
            // Show error to user
          }
        }, 5000);
      }, []);
    `,
    duration: '5 minutos',
    rollback_plan: 'Revert commit se não funcionar'
  },
  
  qr_not_loading: {
    issue: 'QR Code não carrega dados médicos',
    severity: 'P0',
    solution: 'fallback',
    fix: `
      // api/emergency/[id].ts - Emergency fallback
      if (!profile) {
        // EMERGENCY: Static emergency message
        return res.status(200).json({
          emergency_mode: true,
          message: 'EMERGÊNCIA MÉDICA',
          instructions: 'Contactar SAMU 192',
          fallback_data: {
            bloodType: 'VERIFICAR DOCUMENTOS',
            allergies: 'VERIFICAR COM FAMÍLIA',
            emergency_phone: '192'
          }
        });
      }
    `,
    duration: '2 minutos',
    rollback_plan: 'Remove emergency mode quando sistema normalizar'
  }
};
```

### **Passo 4: Deploy Emergencial**

```bash
#!/bin/bash
# Emergency deploy procedure

echo "🚀 EMERGENCY DEPLOY INICIADO"

# Skip normal validations para emergência
export EMERGENCY_DEPLOY=true

# Deploy direto para produção
vercel --prod --confirm

# Verificar se fix funcionou
sleep 30
curl -s "https://sosmoto.com.br/api/health" | grep "healthy"

if [ $? -eq 0 ]; then
  echo "✅ Emergency fix deployed successfully"
else
  echo "❌ Emergency fix failed - ROLLBACK NEEDED"
  vercel promote [previous-deployment] --confirm
fi
```

### **Passo 5: Monitoramento Pós-Fix**

```bash
# Monitorar sistema por 30 minutos
for i in {1..30}; do
  echo "📊 Monitoring minute $i/30"
  
  # Health check
  curl -s "https://sosmoto.com.br/api/health"
  
  # Performance check
  time curl -s "https://sosmoto.com.br/emergency/test-profile" > /dev/null
  
  # Error rate check
  vercel logs --app=sosmoto-prod | grep -c ERROR
  
  sleep 60
done
```

## 📋 Emergency Response Checklist

### **Detecção (< 2 min)**
- [ ] Alerta recebido/problema identificado
- [ ] Severidade avaliada (P0, P1, P2)
- [ ] Agente especializado acionado
- [ ] Timeline definida

### **Diagnóstico (< 5 min)**
- [ ] Health checks executados
- [ ] Logs analisados
- [ ] Root cause identificada
- [ ] Fix strategy definida

### **Correção (< 15 min)**
- [ ] Emergency fix aplicado
- [ ] Deploy realizado
- [ ] Validation executada
- [ ] Rollback plan pronto

### **Validação (< 10 min)**
- [ ] Sistema funcionando normalmente
- [ ] Performance restaurada
- [ ] Error rate normal
- [ ] Usuários não afetados

### **Follow-up (< 24h)**
- [ ] Post-mortem agendado
- [ ] Permanent fix planejado
- [ ] Prevention measures definidas
- [ ] Documentation atualizada

## 🚨 Escalation Matrix

### **P0 - Sistema Down (< 5 min response)**
- QR Code não carrega dados médicos
- Sistema completamente inacessível
- Dados médicos corrompidos
- **Action**: All-hands incident + immediate fix

### **P1 - Funcionalidade Crítica (< 15 min response)**  
- Pagamentos falhando > 50%
- Performance > 10s carregamento
- Webhook processamento falha
- **Action**: On-call engineer + urgent fix

### **P2 - Degradação (< 1h response)**
- Performance 5-10s carregamento  
- Taxa aprovação 60-70%
- Algumas features indisponíveis
- **Action**: Normal bug fixing process

## ⚠️ Emergency Contacts

```typescript
const emergencyContacts = {
  technical_lead: 'claude-code-agent',
  on_call_engineer: 'deploy-orchestrator',
  medical_validator: 'medical-validator-agent',
  payment_specialist: 'payment-agent',
  infrastructure: 'backend-agent'
};
```

## 🎯 Success Criteria

- **Response Time**: P0 < 5min, P1 < 15min
- **Resolution Time**: P0 < 30min, P1 < 1hour  
- **System Recovery**: 99.9% functionality restored
- **Data Integrity**: 100% medical data preserved
- **Performance**: QR Code < 2s, APIs < 500ms

**Lembre-se: Em emergências médicas, cada segundo pode salvar uma vida. Agir rápido e com precisão é VITAL.**