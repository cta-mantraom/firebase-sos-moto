# 🔧 UTILITIES CRÍTICAS DO SISTEMA - REFERÊNCIA COMPLETA

## 📝 Logger - lib/utils/logger.ts

### **Mascaramento LGPD Automático**

O sistema automaticamente mascara campos sensíveis em logs para compliance LGPD:

```typescript
const SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'key', 'signature',
    'email', 'phone', 'credit_card', 'api_key',
    'access_token', 'webhook_secret', 'authorization'
];

// Exemplo de uso:
logInfo('User created', { email: 'user@email.com' });
// Output: {"level": "INFO", "email": "***MASKED***"}
```

### **Funções Disponíveis**

```typescript
// Informações gerais
logInfo(message: string, metadata?: object): void

// Erros com stack trace
logError(message: string, error?: Error, metadata?: object): void

// Avisos (usado em 13+ arquivos do sistema)
logWarning(message: string, metadata?: object): void
```

### **Estrutura do Log**

```json
{
  "timestamp": "2025-01-22T10:00:00.000Z",
  "level": "INFO",  // INFO, ERROR, WARNING
  "message": "Payment processed",
  "correlationId": "req_123456_abc",
  "metadata": { /* dados adicionais mascarados */ }
}
```

---

## 🆔 IDs Generation - lib/utils/ids.ts

### **Funções Críticas (10+ arquivos dependem)**

#### `generateUniqueUrl()`
- **Propósito**: URLs públicas seguras para perfis
- **Formato**: 12 caracteres hexadecimais sem hífens
- **Exemplo**: `a1b2c3d4e5f6`
- **Uso**: URLs de perfil compartilháveis

#### `generateCorrelationId()`
- **Propósito**: Rastreamento de requisições em logs
- **Formato**: `req_${timestamp}_${random}`
- **Exemplo**: `req_1705923600000_a3k8m2`
- **Uso**: Tracking em todos os logs do sistema

#### `generatePaymentId()`
- **Propósito**: IDs únicos para pagamentos
- **Formato**: `payment_${timestamp}_${uuid8}`
- **Exemplo**: `payment_1705923600000_a1b2c3d4`
- **Uso**: Identificação de transações

#### `generateProfileId()`
- **Propósito**: IDs únicos para perfis médicos
- **Formato**: `profile_${uuid}`
- **Exemplo**: `profile_550e8400-e29b-41d4-a716-446655440000`
- **Uso**: Chave primária de perfis

---

## ✅ Validation - lib/utils/validation.ts

### **Schemas Principais**

#### `CreatePaymentSchema`
- **25+ campos** validados com Zod
- Dados de pagamento + perfil médico
- Validação de telefone brasileiro
- Campos opcionais para dados médicos

#### `ProfileSchema`
- Schema do perfil médico para banco
- Usa snake_case para campos
- Validações críticas de idade, telefone, email

### **Funções Importantes**

#### `transformApiToProfile()`
- Transforma dados da API para formato do banco
- Mapeia `selectedPlan` → `plan_type`
- Converte camelCase → snake_case

#### `validateUUID()`
- Valida formato de UUID v4
- Usado para validar IDs gerados

### **⚠️ REMOVIDO**
- ~~`validateHMACSignature()`~~ - **CÓDIGO MORTO**
- Usar sempre: `MercadoPagoService.validateWebhook()`

---

## 📋 USO CORRETO PELOS AGENTES

### **Imports Recomendados**

```typescript
// Logger
import { logInfo, logError, logWarning } from '@/lib/utils/logger.js';

// IDs
import { 
  generateUniqueUrl,
  generateCorrelationId,
  generatePaymentId,
  generateProfileId 
} from '@/lib/utils/ids.js';

// Validation
import { 
  CreatePaymentSchema,
  ProfileSchema,
  transformApiToProfile,
  type CreatePaymentData,
  type Profile
} from '@/lib/utils/validation.js';
```

### **Padrões de Uso**

```typescript
// Sempre incluir correlationId
const correlationId = generateCorrelationId();
logInfo('Processing payment', { correlationId, amount });

// Mascaramento automático funciona
logInfo('User data', { 
  name: 'João',        // Não mascarado
  email: 'test@test',  // Será mascarado: "***MASKED***"
  age: 25              // Não mascarado
});

// Gerar IDs específicos
const paymentId = generatePaymentId();    // Para pagamentos
const profileId = generateProfileId();    // Para perfis
const publicUrl = generateUniqueUrl();    // Para URLs públicas
```

---

## ⚠️ AVISOS IMPORTANTES

1. **NUNCA** criar funções de log locais - usar sempre o logger centralizado
2. **NUNCA** gerar IDs manualmente - usar funções específicas
3. **NUNCA** usar `validateHMACSignature` de validation.ts (código morto)
4. **SEMPRE** incluir correlationId em logs de requisições
5. **SEMPRE** usar tipos TypeScript específicos (nunca `any`)

---

## 📊 ESTATÍSTICAS DE USO

- `logWarning`: Usado em **13 arquivos**
- `generateUniqueUrl`: Usado em **10+ arquivos**
- `generateCorrelationId`: Usado em **todos endpoints API**
- Mascaramento LGPD: **100% automático**

---

*Documento de referência para todos os agentes*
*Última atualização: 22/01/2025*
*Status: CRÍTICO - Leitura obrigatória*
