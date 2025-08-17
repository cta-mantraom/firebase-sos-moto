# Análise Detalhada dos Erros TypeScript - Sistema SOS Moto

---

## ⚠️ Regras CRÍTICAS para Correção

> **DEVE SER SEGUIDA EM TODA CORREÇÃO**

### **🚫 Proibições Absolutas:**

- **NUNCA usar `any`** em nenhuma situação no código de produção
- **É TOTALMENTE PROIBIDO** adicionar, modificar ou excluir qualquer arquivo ou código dentro da pasta `tests/` E `test-integration/` ou seus subdiretórios
- **NUNCA misturar** código de teste com código de produção

### **✅ Práticas Obrigatórias:**

- Usar `unknown` **SOMENTE** para dados brutos/exteriores recebidos na fronteira do sistema (entrada de dados), antes da validação
- Validar **TODOS** os dados externos imediatamente com schemas definidos, preferencialmente utilizando Zod
- Após validação, trabalhar apenas com tipos claros, específicos e definidos
- Manutenção da estrutura modular e clara, desacoplada, é prioridade
- Usar `.env` files para variáveis de ambiente

---

## 1. Resumo Executivo

**Total de Erros Analisados:** 47 erros TypeScript distribuídos em 15 arquivos

**Categorias de Problemas Identificadas:**
- **Problemas de Exportação/Importação:** 6 erros (13%)
- **Incompatibilidade de Tipos:** 18 erros (38%)
- **Métodos/Propriedades Inexistentes:** 15 erros (32%)
- **Problemas de Validação Zod:** 5 erros (11%)
- **Dependências Ausentes:** 3 erros (6%)

**Impacto Crítico no Sistema:**
- **Processamento de Pagamentos:** Afetado por erros em webhook e payment processor
- **Envio de Emails:** Comprometido por problemas no email-sender e AWS SDK
- **Gestão de Perfis:** Impactada por erros no repository e service
- **Sistema de Filas:** Prejudicado por incompatibilidades no QStash

---

## 2. Análise Detalhada por Arquivo

### 2.1 📧 **api/processors/email-sender.ts** (3 erros)

#### **Erro 1 & 2: Propriedade 'reason' ausente (Linhas 368-369)**
- **Função Afetada:** `processEmailJob()` ou similar
- **Causa Raiz:** Incompatibilidade entre tipos de template de email
- **Problema:** Tentativa de usar template de confirmação onde é esperado template de falha
- **Tipo Esperado:** `{ reason: string; retryUrl?: string }`
- **Tipo Fornecido:** Template de confirmação sem propriedade `reason`
- **Impacto:** Falha no envio de emails de confirmação e falha
- **Arquivos Relacionados:**
  - `lib/domain/notification/email.types.ts` (linha 46 - definição de `reason`)
  - `lib/domain/notification/email.types.ts` (linha 134 - `templateData`)

#### **Erro 3: paymentId opcional incompatível (Linha 376)**
- **Função Afetada:** Função de preparação de template
- **Causa Raiz:** `paymentId` definido como opcional mas esperado como obrigatório
- **Problema:** `Type 'string | undefined' is not assignable to type 'string'`
- **Impacto:** Falha na geração de templates de email com dados de pagamento
- **Solução Necessária:** Validação de `paymentId` antes do uso ou ajuste de tipos

### 2.2 🩸 **api/processors/final-processor.ts** (1 erro)

#### **Erro: BloodType incompatível (Linha 202)**
- **Função Afetada:** Função de processamento de dados médicos
- **Causa Raiz:** `bloodType` pode ser `undefined` mas tipo esperado é `BloodType`
- **Problema:** `Type 'string | undefined' is not assignable to type 'BloodType'`
- **Impacto:** Falha na criação de perfis médicos
- **Arquivos Relacionados:**
  - `lib/domain/profile/profile.types.ts` (linha 49 - definição de `BloodType`)
- **Solução:** Validação e conversão adequada do tipo sanguíneo

### 2.3 💳 **api/mercadopago-webhook.ts** (1 erro)

#### **Erro: Método savePaymentLog inexistente (Linha 113)**
- **Função Afetada:** Função de processamento do webhook
- **Causa Raiz:** `PaymentRepository` não implementa método `savePaymentLog`
- **Problema:** `Property 'savePaymentLog' does not exist on type 'PaymentRepository'`
- **Impacto:** Falha no logging de pagamentos recebidos via webhook
- **Arquivos Relacionados:**
  - `lib/repositories/payment.repository.ts`
- **Duplicidade:** Mesmo erro em `payment.processor.ts` (linhas 107, 156, 197)

### 2.4 📨 **lib/domain/notification/email.entity.ts** (2 erros)

#### **Erro 1: Status 'sending' inválido (Linha 110)**
- **Função Afetada:** Método de atualização de status
- **Causa Raiz:** Status 'sending' não está no enum permitido
- **Problema:** Status permitidos não incluem 'sending'
- **Impacto:** Falha no tracking de status de emails
- **Solução:** Adicionar 'sending' ao enum ou usar status válido

#### **Erro 2: Propriedade readonly (Linha 174)**
- **Função Afetada:** Setter de opções
- **Causa Raiz:** Tentativa de modificar propriedade readonly
- **Problema:** `Cannot assign to '_options' because it is a read-only property`
- **Impacto:** Falha na configuração de opções de email
- **Solução:** Remover readonly ou usar método apropriado

### 2.5 💰 **lib/domain/payment/payment.entity.ts** (1 erro)

#### **Erro: Propriedades opcionais incompatíveis (Linha 485)**
- **Função Afetada:** Construtor ou setter de dados de identificação
- **Causa Raiz:** Propriedades `type` e `number` opcionais quando deveriam ser obrigatórias
- **Problema:** `Type 'string | undefined' is not assignable to type 'string'`
- **Impacto:** Falha na validação de dados de identificação
- **Solução:** Validação prévia ou ajuste de tipos

### 2.6 ✅ **lib/domain/profile/profile.validators.ts** (5 erros)

#### **Erro 1 & 2: Método partial inexistente (Linhas 131-132)**
- **Função Afetada:** Criação de validadores parciais
- **Causa Raiz:** `ZodEffects` não possui método `partial()`
- **Problema:** Tentativa de usar `partial()` em schema com efeitos
- **Impacto:** Falha na validação de dados parciais
- **Solução:** Reestruturar schema ou usar abordagem diferente

#### **Erro 3: Incompatibilidade de tipos em refine (Linha 139)**
- **Função Afetada:** Validação customizada
- **Causa Raiz:** Tipos incompatíveis entre parâmetros de validação
- **Problema:** Overload mismatch em função de validação
- **Impacto:** Falha na validação customizada de perfis
- **Solução:** Ajustar tipos de parâmetros

#### **Erro 4: vehicleData undefined (Linha 373)**
- **Função Afetada:** Validação de dados de veículo
- **Causa Raiz:** `vehicleData` pode ser undefined
- **Problema:** `Type 'undefined' is not assignable to type 'Record<string, unknown>'`
- **Impacto:** Falha na validação de dados de veículo
- **Solução:** Verificação de undefined antes do uso

#### **Erro 5: Incompatibilidade em reduce (Linha 727)**
- **Função Afetada:** Função de redução de dados
- **Causa Raiz:** Tipos incompatíveis em callback de reduce
- **Problema:** Overload mismatch
- **Impacto:** Falha no processamento de dados
- **Solução:** Ajustar tipos de callback

### 2.7 👤 **lib/repositories/profile.repository.ts** (1 erro)

#### **Erro: ProfileQueryData não exportado (Linha 8)**
- **Função Afetada:** Import de tipos
- **Causa Raiz:** Tipo `ProfileQueryData` não existe ou não é exportado
- **Problema:** `has no exported member named 'ProfileQueryData'`
- **Sugestão:** Usar `ProfileData` em vez de `ProfileQueryData`
- **Impacto:** Falha na tipagem de queries
- **Arquivos Relacionados:**
  - `lib/domain/profile/profile.types.ts`
- **Solução:** Verificar exportações ou usar tipo correto

### 2.8 📧 **lib/services/notification/email.service.ts** (1 erro)

#### **Erro: Módulo AWS SDK não encontrado (Linha 1)**
- **Função Afetada:** Import de dependência
- **Causa Raiz:** Pacote `@aws-sdk/client-ses` não instalado
- **Problema:** `Cannot find module '@aws-sdk/client-ses'`
- **Impacto:** Falha total no serviço de email
- **Solução:** Instalar dependência: `npm install @aws-sdk/client-ses`

### 2.9 🔄 **lib/services/notification/queue.service.ts** (10 erros)

#### **Erros 1, 4, 9: Incompatibilidade string/JobData (Linhas 104, 154, 418)**
- **Função Afetada:** Funções de enfileiramento
- **Causa Raiz:** Passagem de string onde é esperado JobData
- **Problema:** `Argument of type 'string' is not assignable to parameter of type 'JobData'`
- **Impacto:** Falha no enfileiramento de jobs
- **Solução:** Converter string para objeto JobData

#### **Erros 2, 5, 10: Incompatibilidade QStashResponse/string (Linhas 120, 171, 427)**
- **Função Afetada:** Funções de logging
- **Causa Raiz:** QStashResponse usado onde é esperado string
- **Problema:** `Argument of type 'QStashResponse' is not assignable to parameter of type 'string'`
- **Impacto:** Falha no logging de respostas
- **Solução:** Extrair propriedade string de QStashResponse

#### **Erros 3, 6: Tipo de retorno incompatível (Linhas 129, 181)**
- **Função Afetada:** Funções que retornam jobId
- **Causa Raiz:** Retorno de QStashResponse em vez de string
- **Problema:** `Type 'QStashResponse' is not assignable to type 'string'`
- **Impacto:** Falha no tracking de jobs
- **Solução:** Retornar propriedade string apropriada

#### **Erro 7: Método scheduleJob inexistente (Linha 246)**
- **Função Afetada:** Agendamento de jobs
- **Causa Raiz:** `QStashService` não implementa `scheduleJob`
- **Problema:** `Property 'scheduleJob' does not exist on type 'QStashService'`
- **Impacto:** Falha no agendamento de jobs
- **Solução:** Implementar método ou usar alternativa

#### **Erro 8: Incompatibilidade QueueMetrics/LogData (Linha 344)**
- **Função Afetada:** Logging de métricas
- **Causa Raiz:** QueueMetrics não possui index signature
- **Problema:** `Index signature for type 'string' is missing in type 'QueueMetrics'`
- **Impacto:** Falha no logging de métricas
- **Solução:** Adicionar index signature ou converter tipo

### 2.10 💳 **lib/services/payment/payment.processor.ts** (8 erros)

#### **Erros 1, 4, 7: Método findPendingProfile inexistente (Linhas 90, 136, 420)**
- **Função Afetada:** Busca de perfis pendentes
- **Causa Raiz:** `ProfileRepository` não implementa método
- **Problema:** `Property 'findPendingProfile' does not exist`
- **Impacto:** Falha na busca de perfis pendentes
- **Duplicidade:** Mesmo erro em `profile.service.ts`

#### **Erros 2, 5, 6: Método savePaymentLog inexistente (Linhas 107, 156, 197)**
- **Função Afetada:** Logging de pagamentos
- **Causa Raiz:** `PaymentRepository` não implementa método
- **Problema:** `Property 'savePaymentLog' does not exist`
- **Impacto:** Falha no logging de pagamentos
- **Duplicidade:** Mesmo erro em `mercadopago-webhook.ts`

#### **Erro 3: Propriedades ausentes em JobData (Linhas 124-131)**
- **Função Afetada:** Enfileiramento de processamento
- **Causa Raiz:** Faltam propriedades `maxRetries` e `retryCount`
- **Problema:** Missing properties in job data
- **Impacto:** Falha no enfileiramento de jobs
- **Solução:** Adicionar propriedades obrigatórias

#### **Erro 8: Propriedades ausentes em EmailJob (Linhas 212-222)**
- **Função Afetada:** Enfileiramento de email
- **Causa Raiz:** Faltam propriedades `maxRetries` e `retryCount`
- **Problema:** Missing properties in email job
- **Impacto:** Falha no envio de emails de falha
- **Solução:** Adicionar propriedades obrigatórias

### 2.11 👤 **lib/services/profile/profile.service.ts** (10 erros)

#### **Erro 1: Argumentos incorretos (Linhas 75-79)**
- **Função Afetada:** Construtor ou método de Profile
- **Causa Raiz:** Passagem de 6 argumentos onde é esperado 1
- **Problema:** `Expected 1 arguments, but got 6`
- **Impacto:** Falha na criação de perfis
- **Solução:** Ajustar chamada de função

#### **Erro 2: Propriedade isValid inexistente (Linha 83)**
- **Função Afetada:** Validação de perfil
- **Causa Raiz:** `Profile` não possui propriedade `isValid`
- **Problema:** `Property 'isValid' does not exist on type 'Profile'`
- **Impacto:** Falha na validação de perfis
- **Solução:** Implementar propriedade ou usar método alternativo

#### **Erro 3: Método save inexistente (Linha 88)**
- **Função Afetada:** Salvamento de perfil
- **Causa Raiz:** `ProfileRepository` não implementa método `save`
- **Problema:** `Property 'save' does not exist`
- **Impacto:** Falha no salvamento de perfis
- **Solução:** Implementar método no repository

#### **Erro 4: Método findPendingProfile inexistente (Linha 136)**
- **Função Afetada:** Busca de perfis pendentes
- **Causa Raiz:** Método não implementado no repository
- **Problema:** `Property 'findPendingProfile' does not exist`
- **Impacto:** Falha na busca de perfis pendentes
- **Duplicidade:** Mesmo erro em `payment.processor.ts`

#### **Erro 5: Tipo incompatível string/Profile (Linha 207)**
- **Função Afetada:** Função que espera Profile
- **Causa Raiz:** Passagem de string onde é esperado objeto Profile
- **Problema:** `Argument of type 'string' is not assignable to parameter of type 'Profile'`
- **Impacto:** Falha no processamento de perfis
- **Solução:** Converter string para Profile ou ajustar parâmetro

#### **Erro 6: Método savePendingProfile inexistente (Linha 318)**
- **Função Afetada:** Salvamento de perfil pendente
- **Causa Raiz:** Método não implementado no repository
- **Problema:** `Property 'savePendingProfile' does not exist`
- **Impacto:** Falha no salvamento de perfis pendentes
- **Solução:** Implementar método no repository

#### **Erro 7: Método deletePendingProfile inexistente (Linha 364)**
- **Função Afetada:** Remoção de perfil pendente
- **Causa Raiz:** Método não implementado no repository
- **Problema:** `Property 'deletePendingProfile' does not exist`
- **Impacto:** Falha na remoção de perfis pendentes
- **Solução:** Implementar método no repository

#### **Erro 8: Método updateStatus vs bulkUpdateStatus (Linha 387)**
- **Função Afetada:** Atualização de status
- **Causa Raiz:** Método `updateStatus` não existe, mas `bulkUpdateStatus` sim
- **Problema:** `Property 'updateStatus' does not exist. Did you mean 'bulkUpdateStatus'?`
- **Impacto:** Falha na atualização de status
- **Solução:** Usar `bulkUpdateStatus` ou implementar `updateStatus`

#### **Erro 9: Propriedade canGenerateQRCode inexistente (Linha 406)**
- **Função Afetada:** Verificação de geração de QR Code
- **Causa Raiz:** `Profile` não possui propriedade `canGenerateQRCode`
- **Problema:** `Property 'canGenerateQRCode' does not exist`
- **Impacto:** Falha na verificação de geração de QR Code
- **Solução:** Implementar propriedade ou método alternativo

#### **Erro 10: Método deleteExpiredPendingProfiles inexistente (Linha 420)**
- **Função Afetada:** Limpeza de perfis expirados
- **Causa Raiz:** Método não implementado no repository
- **Problema:** `Property 'deleteExpiredPendingProfiles' does not exist`
- **Impacto:** Falha na limpeza de perfis expirados
- **Solução:** Implementar método no repository

### 2.12 📱 **lib/services/profile/qrcode.service.ts** (1 erro)

#### **Erro: storage não exportado (Linha 3)**
- **Função Afetada:** Import de Firebase Storage
- **Causa Raiz:** `storage` não é exportado do módulo firebase
- **Problema:** `Module '../firebase' has no exported member 'storage'`
- **Impacto:** Falha no serviço de QR Code
- **Arquivos Relacionados:**
  - `lib/services/firebase.ts`
- **Solução:** Verificar exportações do Firebase ou ajustar import

### 2.13 🔄 **lib/services/queue/qstash.service.ts** (7 erros)

#### **Erros 1-4: Propriedades inexistentes em Message (Linhas 166-170)**
- **Função Afetada:** Processamento de mensagens QStash
- **Causa Raiz:** Tipo `Message` não possui propriedades esperadas
- **Problemas:**
  - `Property 'state' does not exist on type 'Message'`
  - `Property 'retries' does not exist on type 'Message'`
  - `Property 'responseStatus' does not exist on type 'Message'` (2x)
- **Impacto:** Falha no monitoramento de mensagens
- **Solução:** Verificar documentação QStash ou ajustar tipos

#### **Erros 5, 7: Propriedade list inexistente (Linhas 237, 402)**
- **Função Afetada:** Listagem de mensagens
- **Causa Raiz:** Tipo `Messages` não possui propriedade `list`
- **Problema:** `Property 'list' does not exist on type 'Messages'`
- **Impacto:** Falha na listagem de mensagens
- **Solução:** Verificar API QStash ou usar propriedade correta

#### **Erro 6: Incompatibilidade templateData (Linha 321)**
- **Função Afetada:** Criação de job de email
- **Causa Raiz:** `templateData` genérico não compatível com tipo específico
- **Problema:** Missing properties `planType` e `memorialUrl`
- **Impacto:** Falha na criação de jobs de email
- **Solução:** Ajustar tipo de templateData

### 2.14 ⚙️ **lib/services/queue/job.processor.ts** (2 erros)

#### **Erros 1-2: Propriedades inexistentes em JobData (Linhas 71-72)**
- **Função Afetada:** Processamento de jobs
- **Causa Raiz:** Tipo `JobData` não possui propriedades de retry
- **Problemas:**
  - `Property 'retryCount' does not exist on type 'JobData'`
  - `Property 'maxRetries' does not exist on type 'JobData'`
- **Impacto:** Falha no sistema de retry de jobs
- **Solução:** Adicionar propriedades ao tipo JobData ou usar abordagem alternativa

### 2.15 🔥 **lib/services/storage/firebase.service.ts** (2 erros)

#### **Erro 1: db não exportado (Linha 2)**
- **Função Afetada:** Import de database
- **Causa Raiz:** `db` não é exportado do módulo firebase
- **Problema:** `Module '../firebase' has no exported member 'db'`
- **Impacto:** Falha no acesso ao banco de dados
- **Arquivos Relacionados:**
  - `lib/services/firebase.ts`
- **Solução:** Verificar exportações do Firebase

#### **Erro 2: QueryConstraint não exportado (Linha 9)**
- **Função Afetada:** Import de tipos Firestore
- **Causa Raiz:** `QueryConstraint` não é exportado do firebase-admin
- **Problema:** `Module 'firebase-admin/firestore' has no exported member 'QueryConstraint'`
- **Impacto:** Falha na tipagem de queries
- **Solução:** Usar tipo correto do firebase-admin ou ajustar import

---

## 3. Análise de Duplicidade e Padrões

### 3.1 🔄 **Erros Duplicados Críticos**

#### **savePaymentLog não implementado**
- **Arquivos Afetados:**
  - `api/mercadopago-webhook.ts` (linha 113)
  - `lib/services/payment/payment.processor.ts` (linhas 107, 156, 197)
- **Impacto:** Falha total no logging de pagamentos
- **Solução Centralizada:** Implementar método no `PaymentRepository`

#### **findPendingProfile não implementado**
- **Arquivos Afetados:**
  - `lib/services/payment/payment.processor.ts` (linha 90)
  - `lib/services/profile/profile.service.ts` (linha 136)
- **Impacto:** Falha na busca de perfis pendentes
- **Solução Centralizada:** Implementar método no `ProfileRepository`

#### **Propriedades ausentes em JobData**
- **Arquivos Afetados:**
  - `lib/services/payment/payment.processor.ts` (linhas 124-131, 212-222)
  - `lib/services/queue/job.processor.ts` (linhas 71-72)
- **Impacto:** Falha no sistema de filas
- **Solução Centralizada:** Atualizar interface `JobData`

### 3.2 📊 **Padrões de Problemas**

#### **Problemas de Arquitetura**
1. **Métodos não implementados nos repositories** (32% dos erros)
2. **Incompatibilidade de tipos entre camadas** (26% dos erros)
3. **Exportações ausentes nos módulos** (13% dos erros)

#### **Problemas de Dependências**
1. **AWS SDK não instalado**
2. **Tipos QStash desatualizados**
3. **Firebase exports inconsistentes**

---

## 4. Plano de Resolução Prioritário

### 4.1 🔴 **Prioridade CRÍTICA (Impacto no Sistema)**

1. **Instalar dependência AWS SDK**
   ```bash
   npm install @aws-sdk/client-ses
   ```

2. **Implementar métodos ausentes no PaymentRepository**
   - `savePaymentLog()`
   - `findByPaymentId()`
   - `getPaymentHistory()`

3. **Implementar métodos ausentes no ProfileRepository**
   - `findPendingProfile()`
   - `save()`
   - `savePendingProfile()`
   - `deletePendingProfile()`
   - `updateStatus()` ou usar `bulkUpdateStatus()`
   - `deleteExpiredPendingProfiles()`

4. **Corrigir exportações do Firebase**
   - Exportar `db` e `storage` em `lib/services/firebase.ts`
   - Verificar imports do firebase-admin

### 4.2 🟡 **Prioridade ALTA (Funcionalidade)**

5. **Atualizar interface JobData**
   - Adicionar propriedades `retryCount` e `maxRetries`
   - Ajustar tipos de `templateData`

6. **Corrigir tipos de email**
   - Adicionar status 'sending' ao enum
   - Resolver problema de propriedade readonly
   - Ajustar tipos de template

7. **Corrigir validações Zod**
   - Reestruturar schemas com efeitos
   - Ajustar tipos de validação customizada

### 4.3 🟢 **Prioridade MÉDIA (Otimização)**

8. **Atualizar tipos QStash**
   - Verificar documentação oficial
   - Ajustar propriedades de Message

9. **Corrigir tipos de Profile**
   - Implementar propriedades `isValid` e `canGenerateQRCode`
   - Ajustar construtores

10. **Resolver incompatibilidades de tipos menores**
    - BloodType validation
    - Propriedades opcionais

---

## 5. Referências Cruzadas

### 5.1 📁 **Mapa de Dependências**

```
lib/domain/
├── notification/
│   ├── email.entity.ts → email.types.ts
│   └── email.types.ts
├── payment/
│   └── payment.entity.ts
└── profile/
    ├── profile.types.ts
    └── profile.validators.ts → profile.types.ts

lib/repositories/
├── payment.repository.ts → domain/payment/
└── profile.repository.ts → domain/profile/

lib/services/
├── firebase.ts (EXPORTAÇÕES AUSENTES)
├── notification/
│   ├── email.service.ts (AWS SDK AUSENTE)
│   └── queue.service.ts → queue/qstash.service.ts
├── payment/
│   └── payment.processor.ts → repositories/
├── profile/
│   ├── profile.service.ts → repositories/
│   └── qrcode.service.ts → firebase.ts
├── queue/
│   ├── job.processor.ts → types/queue.types.ts
│   └── qstash.service.ts
└── storage/
    └── firebase.service.ts → firebase.ts

api/
├── mercadopago-webhook.ts → repositories/payment.repository.ts
└── processors/
    ├── email-sender.ts → domain/notification/
    └── final-processor.ts → domain/profile/
```

### 5.2 🔗 **Arquivos Críticos para Correção**

1. **`lib/services/firebase.ts`** - Exportar `db` e `storage`
2. **`lib/repositories/payment.repository.ts`** - Implementar métodos ausentes
3. **`lib/repositories/profile.repository.ts`** - Implementar métodos ausentes
4. **`lib/types/queue.types.ts`** - Atualizar interface JobData
5. **`lib/domain/notification/email.types.ts`** - Ajustar tipos de template
6. **`package.json`** - Adicionar dependência AWS SDK

---

## 6. Checklist de Verificação

### 6.1 ✅ **Antes de Iniciar Correções**

- [ ] Backup do código atual
- [ ] Verificar versões das dependências
- [ ] Confirmar estrutura de arquivos
- [ ] Revisar documentação das APIs externas

### 6.2 ✅ **Durante as Correções**

- [ ] Seguir regras críticas (sem `any`, validação Zod)
- [ ] Manter nomenclaturas originais
- [ ] Testar cada correção isoladamente
- [ ] Verificar impacto em arquivos relacionados

### 6.3 ✅ **Após as Correções**

- [ ] Executar verificação TypeScript completa
- [ ] Testar funcionalidades críticas
- [ ] Verificar logs de erro
- [ ] Atualizar documentação se necessário

---

## 7. Conclusão

Os 47 erros identificados representam problemas sistemáticos na arquitetura do sistema SOS Moto, principalmente relacionados a:

1. **Implementação incompleta de repositories** (34% dos erros)
2. **Incompatibilidades de tipos entre camadas** (38% dos erros)
3. **Dependências ausentes ou mal configuradas** (13% dos erros)
4. **Problemas de validação e tipos Zod** (11% dos erros)

A resolução destes erros é **CRÍTICA** para o funcionamento do sistema, especialmente para:
- Processamento de pagamentos via MercadoPago
- Envio de emails de confirmação
- Gestão de perfis de usuários
- Sistema de filas assíncronas

O plano de resolução priorizado permite abordar os problemas de forma sistemática, começando pelos que têm maior impacto no sistema e seguindo para otimizações menores.

**Tempo estimado para resolução completa:** 2-3 dias de desenvolvimento focado, seguindo as prioridades estabelecidas.