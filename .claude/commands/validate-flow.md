---
description: Executa validação completa end-to-end do fluxo SOS Moto (pagamento → perfil → QR → emergência)
allowed-tools: Bash(npm:*), Bash(git:*), Read, Task, Grep, Glob
---

# 🔍 Validação Completa do Fluxo SOS Moto

Execute validação end-to-end completa do sistema SOS Moto, garantindo que todo o fluxo crítico esteja funcionando perfeitamente.

## 🎯 Objetivo

Validar o fluxo completo:
1. **Criação de Perfil** → Formulário + Validação Zod
2. **Processamento de Pagamento** → MercadoPago + Device ID + HMAC
3. **Geração de QR Code** → Firebase Storage + URL única
4. **Acesso de Emergência** → Cache Redis + Dados médicos

## ⚡ Execução Automática

### **Fase 1: Validação de Código**

```bash
echo "🔍 FASE 1: Validação de Código"

# TypeScript - Zero erros e ZERO uso de any
echo "📝 Verificando TypeScript strict..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Erros de TypeScript encontrados"
  exit 1
fi

# Verificar uso de 'any' (PROIBIDO)
echo "🔍 Verificando uso de 'any'..."
if grep -r ": any" --include="*.ts" --include="*.tsx" src/ lib/; then
  echo "❌ USO DE 'any' DETECTADO - Validação BLOQUEADA"
  echo "🚨 Substitua todos os 'any' por 'unknown' com validação Zod"
  exit 1
fi

# Verificar arquivos deletados
echo "🗑️ Verificando arquivos obsoletos..."
if [ -f "lib/config/env.ts" ]; then
  echo "❌ ARQUIVO OBSOLETO: lib/config/env.ts deve ser deletado"
  exit 1
fi
if [ -f "lib/utils/validation.ts" ]; then
  echo "❌ ARQUIVO OBSOLETO: lib/utils/validation.ts deve ser deletado"
  exit 1
fi

# ESLint - Qualidade de código  
echo "🔧 Verificando ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Erros de linting encontrados"
  exit 1
fi

# Build - Compilação serverless
echo "🏗️ Testando build serverless..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build falhou"
  exit 1
fi
```

### **Fase 2: Validação de Integração**

**Use o backend-agent para validar:**
- Firebase Factory Pattern implementado
- MercadoPago Service camada funcionando
- AWS SES configurado para sa-east-1
- Upstash Redis/QStash conectados

**Use o payment-agent para validar:**
- Device ID collection implementado
- HMAC validation funcionando  
- Webhook processamento assíncrono
- Planos SOS Moto (R$ 5,00 teste temporário / R$ 85,00 premium)

**Use o medical-validator para validar:**
- Schemas médicos Zod implementados
- LGPD compliance ativo
- QR Code otimizado para emergência
- Dados críticos priorizados

### **Fase 3: Validação de Frontend**

**Use o frontend-agent para validar:**
- MercadoPago Checkout com Device ID
- Formulário com validação Zod
- Componentes Shadcn/UI funcionando
- TypeScript strict mode ativo

### **Fase 4: Validação de Deploy**

**Use o deploy-orchestrator para validar:**
- Health checks funcionando
- Preview deploy possível
- Smoke tests prontos
- Rollback strategy definida

## 📋 Checklist de Validação Específica

### **Arquitetura Refatorada ✅**
- [ ] Configs com lazy loading implementadas
- [ ] Zero uso de `any` no código
- [ ] Arquivos obsoletos deletados (942 linhas removidas)
- [ ] Domain validators sendo usados (não validation.ts)
- [ ] Factory Pattern Firebase com lazy loading
- [ ] Nenhuma função usando estado compartilhado
- [ ] Timeouts apropriados (API: 10s, Edge: 30s)
- [ ] Cold start < 2ms com lazy loading

### **MercadoPago Integration ✅**
- [ ] Device ID coletado em 100% dos checkouts
- [ ] HMAC validation em todos os webhooks
- [ ] MercadoPagoService usado (não API direta)
- [ ] Processamento assíncrono via QStash
- [ ] Planos com preços corretos (R$ 5 teste / R$ 85 premium)

### **Dados Médicos ✅**
- [ ] Tipo sanguíneo validado (A+, A-, B+, B-, AB+, AB-, O+, O-)
- [ ] Alergias e medicamentos sanitizados
- [ ] Contatos de emergência com telefones válidos
- [ ] LGPD compliance implementado
- [ ] QR Code otimizado (< 2KB, carregamento < 2s)

### **Performance Crítica ✅**
- [ ] Cache Redis implementado (TTL 24h)
- [ ] Firebase queries otimizadas
- [ ] Página memorial < 2s carregamento
- [ ] API responses < 500ms P95

### **Segurança ✅**
- [ ] Nenhum secret exposto em logs
- [ ] Input validation Zod em todos endpoints
- [ ] CORS configurado adequadamente
- [ ] Rate limiting implementado

## 🚨 Critérios de Aprovação

### **PASS (✅) - Critérios**
- TypeScript check: 0 erros
- ESLint: 0 errors (warnings OK)
- Build: sucesso
- Device ID: implementado em pagamentos
- HMAC: validação em webhooks  
- Medical data: schemas Zod validados
- Performance: carregamento < 3s
- Security: nenhum secret exposto

### **FAIL (❌) - Critérios de Bloqueio**
- Qualquer erro TypeScript
- Build falha
- Device ID ausente em pagamento
- Webhook sem HMAC validation
- Dados médicos sem validação
- Performance > 5s carregamento
- Secrets expostos

## 🔧 Comandos de Resolução

### **Se TypeScript falhar:**
```bash
# Verificar erros específicos
npx tsc --noEmit --listFiles

# Corrigir imports
npm run lint:fix

# Verificar configuração
cat tsconfig.json
```

### **Se MercadoPago falhar:**
```bash
# Verificar Device ID collection
grep -r "MP_DEVICE_SESSION_ID" src/

# Verificar HMAC implementation  
grep -r "createHmac" api/

# Verificar service usage
grep -r "mercadoPagoService" api/
```

### **Se dados médicos falharem:**
```bash
# Verificar schemas Zod
find . -name "*.ts" -exec grep -l "BloodType\|Allergy" {} \;

# Verificar validação LGPD
grep -r "sanitize\|anonymize" lib/
```

## 📊 Relatório de Validação

Após execução, gerar relatório estruturado:

```typescript
interface ValidationReport {
  timestamp: string;
  environment: 'development' | 'preview' | 'production';
  overall_status: 'PASS' | 'FAIL';
  phases: {
    code_validation: ValidationPhaseResult;
    integration_validation: ValidationPhaseResult;
    frontend_validation: ValidationPhaseResult;
    deploy_validation: ValidationPhaseResult;
  };
  critical_issues: string[];
  recommendations: string[];
  performance_metrics: {
    build_time_ms: number;
    type_check_time_ms: number;
    test_coverage: number;
  };
}
```

## 🎯 Agentes Responsáveis

- **frontend-agent**: Validação React/TypeScript/UI
- **backend-agent**: Validação APIs/Firebase/Serverless  
- **payment-agent**: Validação MercadoPago/Device ID/HMAC
- **medical-validator**: Validação dados médicos/LGPD/QR
- **deploy-orchestrator**: Validação deploy/health checks

## ⚠️ Notas Importantes

1. **Execute SEMPRE** antes de deploy para produção
2. **Falha = bloqueio** automático de deploy
3. **Dados médicos** têm prioridade máxima de validação
4. **Performance crítica** para sistema de emergência
5. **Zero tolerância** para erros de segurança

**Objetivo: Garantir que cada deploy seja seguro para salvar vidas.**