---
description: Auditoria completa de segurança do sistema SOS Moto (LGPD, secrets, HMAC, medical data)
allowed-tools: Bash(npm:*), Bash(git:*), Read, Grep, Glob, Task
argument-hint: [scope] (full|medical|payment|lgpd)
---

# 🔒 Auditoria de Segurança SOS Moto

Execute auditoria completa de segurança do sistema SOS Moto, com foco em proteção de dados médicos sensíveis e compliance LGPD.

## 🎯 Escopo da Auditoria

### **Comando: `/security-audit full`**
Auditoria completa de todos os aspectos de segurança

### **Comando: `/security-audit medical`**  
Foco em dados médicos e LGPD compliance

### **Comando: `/security-audit payment`**
Foco em segurança de pagamentos MercadoPago

### **Comando: `/security-audit lgpd`**
Foco específico em compliance LGPD

## 🚨 Áreas Críticas de Auditoria

### **1. Secrets e Credenciais**

**Use o Task tool com backend-agent para verificar:**

Escanear por vazamento de secrets:
```bash
# Verificar secrets expostos no código
git log --all -S "MERCADOPAGO_ACCESS_TOKEN" --oneline
git log --all -S "FIREBASE_PRIVATE_KEY" --oneline  
git log --all -S "AWS_SECRET_ACCESS_KEY" --oneline
git log --all -S "UPSTASH_REDIS_REST_TOKEN" --oneline

# Verificar .env files commitados
find . -name ".env*" -not -path "./.env.example" | xargs ls -la

# Verificar hardcoded secrets
grep -r "APP_USR-" --include="*.ts" --include="*.tsx" src/ lib/ api/
grep -r "TEST-" --include="*.ts" --include="*.tsx" src/ lib/ api/
grep -r "PROD-" --include="*.ts" --include="*.tsx" src/ lib/ api/
```

### **2. Dados Médicos - Proteção LGPD**

**Use o medical-validator para auditar:**

Verificar proteção de dados sensíveis:
```bash
# Verificar se dados médicos estão sendo logados
grep -r "bloodType\|allergies\|medications" --include="*.ts" lib/utils/logger.ts api/

# Verificar anonimização em logs
grep -r "anonymize\|sanitize" --include="*.ts" lib/

# Verificar estrutura de auditoria
find lib/ -name "*audit*" -o -name "*lgpd*" | xargs ls -la

# Verificar TTL de dados sensíveis
grep -r "setex\|expire" --include="*.ts" lib/services/storage/
```

### **3. MercadoPago - Segurança de Pagamentos**

**Use o payment-agent para auditar:**

Verificar implementação segura:
```bash
# HMAC validation obrigatória
grep -r "validateWebhook\|createHmac" api/mercadopago-webhook.ts

# Device ID collection
grep -r "MP_DEVICE_SESSION_ID\|device_id" src/components/MercadoPagoCheckout.tsx

# Service layer usage (não API direta)
grep -r "https://api.mercadopago.com" --include="*.ts" --include="*.tsx" src/ lib/ api/

# Webhook security headers
grep -r "x-signature\|x-request-id" api/
```

### **4. Firebase Security**

**Use o backend-agent para auditar:**

Verificar configuração segura:
```bash
# Factory Pattern implementation
grep -r "getApps().length" --include="*.ts" lib/services/firebase.ts api/

# Admin SDK usage (não client SDK em backend)
grep -r "firebase/app" --include="*.ts" api/
grep -r "initializeApp" --include="*.ts" lib/ api/

# Firestore security rules
find . -name "firestore.rules" -o -name "*.rules" | xargs cat
```

### **5. Input Validation**

**Use todos os agentes para verificar:**

Validação de entrada obrigatória:
```bash
# Zod schemas em endpoints
grep -r "\.parse\|\.safeParse" api/

# Validação em forms
grep -r "useForm\|zodResolver" src/

# Sanitização de dados médicos
grep -r "sanitize.*medical\|validate.*medical" lib/
```

## 📊 Critérios de Compliance

### **LGPD (Lei Geral de Proteção de Dados)**

#### **✅ CONFORME**
- [ ] Dados médicos anonimizados em logs
- [ ] Auditoria de acesso implementada
- [ ] TTL configurado para dados sensíveis
- [ ] Base legal documentada (proteção da vida)
- [ ] Direitos do titular implementados

#### **❌ NÃO CONFORME**
- Dados médicos em logs não anonimizados
- Sem auditoria de acesso aos dados
- Dados armazenados indefinidamente
- Base legal não documentada
- Direitos do titular não implementados

### **Segurança de Pagamentos**

#### **✅ CONFORME** 
- [ ] HMAC validation em 100% dos webhooks
- [ ] Device ID obrigatório em pagamentos
- [ ] MercadoPagoService usado (não API direta)
- [ ] Secrets não expostos em código/logs
- [ ] Processamento assíncrono implementado

#### **❌ NÃO CONFORME**
- Webhooks sem HMAC validation
- Pagamentos sem Device ID
- API MercadoPago chamada diretamente
- Secrets expostos no código
- Processamento síncrono em webhooks

### **Dados Médicos**

#### **✅ CONFORME**
- [ ] Validação Zod em dados críticos
- [ ] Tipo sanguíneo obrigatório e validado
- [ ] Alergias sanitizadas e validadas
- [ ] Contatos de emergência validados
- [ ] QR Code com dados mínimos necessários

#### **❌ NÃO CONFORME**  
- Dados médicos sem validação
- Tipo sanguíneo opcional ou não validado
- Alergias não sanitizadas
- Contatos sem validação
- QR Code com dados excessivos

## 🔍 Scripts de Auditoria

### **Auditoria Completa**
```bash
#!/bin/bash
# Executar auditoria completa

echo "🔒 Iniciando Auditoria de Segurança SOS Moto..."

# 1. Secrets Scanning
echo "🔍 Verificando vazamento de secrets..."
python3 .claude/hooks/secrets-scanner.py

# 2. LGPD Compliance
echo "🏥 Verificando compliance LGPD..."
# Usar medical-validator para verificar anonimização

# 3. MercadoPago Security  
echo "💳 Verificando segurança MercadoPago..."
python3 .claude/hooks/mercadopago-validator.py

# 4. Input Validation
echo "🛡️ Verificando validação de entrada..."
find api/ -name "*.ts" -exec grep -L "\.parse\|\.safeParse" {} \;

# 5. Firebase Security
echo "🔥 Verificando segurança Firebase..."
# Usar backend-agent para verificar Factory Pattern

echo "✅ Auditoria de segurança concluída!"
```

### **Auditoria Médica Específica**
```bash
#!/bin/bash
# Auditoria focada em dados médicos

echo "🏥 Auditoria Específica - Dados Médicos"

# Verificar se dados médicos estão protegidos
grep -r "console.log.*bloodType" src/ lib/ api/ || echo "✅ Tipo sanguíneo não logado"
grep -r "console.log.*allergies" src/ lib/ api/ || echo "✅ Alergias não logadas"
grep -r "console.log.*medications" src/ lib/ api/ || echo "✅ Medicamentos não logados"

# Verificar schemas de validação
find lib/schemas lib/domain -name "*.ts" -exec grep -l "BloodType\|Allergy" {} \;

# Verificar LGPD compliance
find lib/ -name "*audit*" -o -name "*anonymize*" | wc -l
```

## 📋 Relatório de Auditoria

```typescript
interface SecurityAuditReport {
  timestamp: string;
  scope: 'full' | 'medical' | 'payment' | 'lgpd';
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: {
    secrets: {
      exposed_secrets: number;
      hardcoded_credentials: number;
      insecure_storage: number;
    };
    lgpd: {
      data_anonymization: 'COMPLIANT' | 'NON_COMPLIANT';
      audit_trail: 'COMPLIANT' | 'NON_COMPLIANT';  
      data_retention: 'COMPLIANT' | 'NON_COMPLIANT';
      user_rights: 'COMPLIANT' | 'NON_COMPLIANT';
    };
    medical_data: {
      validation_coverage: number; // 0-100%
      data_sanitization: 'IMPLEMENTED' | 'MISSING';
      qr_code_security: 'SECURE' | 'INSECURE';
    };
    payments: {
      hmac_validation: 'IMPLEMENTED' | 'MISSING';
      device_id_collection: 'IMPLEMENTED' | 'MISSING';
      async_processing: 'IMPLEMENTED' | 'MISSING';
    };
  };
  recommendations: SecurityRecommendation[];
  next_audit_date: string;
}
```

## 🚨 Ações Corretivas por Prioridade

### **P0 - CRÍTICO (Fix imediato)**
- Secrets expostos no código
- Dados médicos em logs não anonimizados
- Webhooks sem HMAC validation
- Tipo sanguíneo sem validação

### **P1 - ALTO (Fix em 24h)**
- Device ID ausente em pagamentos
- Input validation ausente em endpoints
- Auditoria LGPD incompleta
- Factory Pattern não implementado

### **P2 - MÉDIO (Fix em 1 semana)**
- Performance de QR Code > 2s
- Logs estruturados ausentes
- Documentação de segurança incompleta
- Testes de segurança ausentes

### **P3 - BAIXO (Fix em 1 mês)**
- Otimizações de cache
- Monitoramento aprimorado
- Alertas proativos
- Documentação adicional

## 🎯 Agentes Responsáveis

- **medical-validator**: LGPD compliance, dados médicos, auditoria
- **payment-agent**: Segurança MercadoPago, HMAC, Device ID
- **backend-agent**: Firebase security, API validation
- **frontend-agent**: Input validation, secrets em frontend
- **deploy-orchestrator**: Security monitoring, incident response

## ⚠️ Notas Críticas

1. **Dados médicos** são extremamente sensíveis - LGPD rigorosa
2. **Auditoria obrigatória** antes de qualquer deploy
3. **Falhas P0/P1** bloqueiam deploy automaticamente
4. **Compliance LGPD** é requisito legal, não opcional
5. **Segurança de pagamentos** impacta taxa de aprovação

**Lembre-se: Violações de segurança em dados médicos podem ter consequências legais graves e colocar vidas em risco.**