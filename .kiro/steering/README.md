# 🚀 Moto SOS Guardian App

**Sistema de emergência unificado em memoryys.com - Vercel + Firestore + MercadoPago**

> **✅ Status Atual:** Arquitetura simplificada e production-ready, sem over-engineering, com fluxo unificado em memoryys.com

---

### **Regra Importante:** Não alterar testes e funções de teste

---

## ⚠️ Regras CRÍTICAS para a Refatoração

> **DEVE SER REPETIDA EM TODAS DOCUMENTAÇÕES E PASSO A PASSO**

### **🚫 Proibições Absolutas:**

- **NUNCA usar `any`** em nenhuma situação no código de produção
- **É TOTALMENTE PROIBIDO** adicionar, modificar ou excluir qualquer arquivo ou código dentro da pasta `tests/` E `test-integration/` ou seus subdiretórios

### **✅ Práticas Obrigatórias:**

- Usar `unknown` **SOMENTE** para dados brutos/exteriores recebidos na fronteira do sistema (entrada de dados), antes da validação
- Validar **TODOS** os dados externos imediatamente com schemas definidos, preferencialmente utilizando Zod
- Após validação, trabalhar apenas com tipos claros, específicos e definidos
- Manutenção da estrutura modular e clara, desacoplada, é prioridade
- Usar `.env` files para variáveis de ambiente

## 🔍 Detalhes Técnicos e Justificativas Importantes

### **Sobre Tipos e Validação**

Dados recebidos em cada função (ex: webhook, checkout) quando nescesario usar `unknown` devem ser inicialmente tipados

Esses dados brutos são imediatamente validados com schemas fortes (Zod), convertendo para tipos definidos.

Código interno trabalha somente com esses tipos validados.

Isso garante robustez, segurança, e elimina bugs silenciosos.

### **Sobre Código de Testes em Produção**

Sempre analise se há identificação de código de teste misturado em condigo de produção não pode ter codigo de teste misturado com condigo de produção

**Deve ser removido imediatamente.**

Nenhum teste novo será criado nem modificado nesta fase.

```

Isso facilita o deploy independente, controle de dependências e segurança.

---

## 🎯 Benefícios Esperados da Refatoração

- ✅ **Segurança máxima de tipos**, com validação rigorosa
- ✅ **Código limpo, modular**, com responsabilidades claras
- ✅ **Remoção completa de código de testes em produção**
- ✅ **Configuração correta do mercado pago sdk react para cada função relacionada com pagamento
- ✅ **Melhor garantia de deploys estáveis e previsíveis**
- ✅ **Estrutura preparada para escalabilidade e manutenção facilitada**

---

## 🚀 Ações IMEDIATAS Recomendadas

1. **✅ [ ]: Revisar todos os usos de `any`**
2. **✅ [ ]: URLs de produção configuradas (memoryys.com)**

---

## ⚠️ AVISO IMPORTANTE

> **Durante esta fase de refatoração, é expressamente proibido o uso do tipo `any` em qualquer código de produção.**
>
> quando for nescesario usar `unknown` Use somente  para representar dados externos não validados, validando-os imediatamente com schemas (Zod).
>
> **Jamais trabalhe com `any` para dados genéricos.**
>
> **É expressamente proibido criar, modificar ou excluir qualquer arquivo nos diretórios `tests/` e seus subdiretórios.**
>
> **Código de teste presente em produção deve ser removido — testes não serão criados/modificados nesta etapa.**
>
> **Manutenção da estrutura modular, clara e possível de deploy na vercel**
>
> **O cumprimento estrito destas regras é FUNDAMENTAL para garantir a qualidade, segurança e manutenibilidade do sistema.**

---

## 🔧 Environment Variables & Configuration

### ⚠️ IMPORTANTE:

### Configuração Atual (.env):
```env


---

## 🏗️ Arquitetura Simplificada

### Frontend (React - memoryys.com)
- **Vite + React + TypeScript**
- **MercadoPago Checkout Pro SDK**
- **shadcn-ui + Tailwind CSS**
- **Apenas Firestore client** (sem Functions)

### Backend (Vercel APIs - memoryys.com/api/*)
- **3 APIs Vercel Functions:**
  - `create-payment` - MercadoPago + Firestore + QR + Email
  - `mercadopago-webhook` - Webhook + processamento
  - `get-profile` - Busca perfis (Redis cache)
  - `check-status` - Status via Redis

### Banco de Dados (Firestore)
- `pending_profiles` - Pagamentos pendentes
- `user_profiles` - Perfis ativos
- `memorial_pages` - Páginas memoriais
- `payments_log` - Log de transações

### Serviços Externos
- **MercadoPago** - Checkout Pro
- **AWS SES** - Emails transacionais
- **Redis** - Cache opcional (QR codes)
- **QRCode** - Geração de códigos QR

### Principais Dependências
- **firebase**: ^12.1.0
- **firebase-admin**: ^13.4.0
- **firebase-functions**: ^6.4.0
- **@mercadopago/sdk-react**: ^1.0.4
- **mercadopago**: ^2.8.0
- **@aws-sdk/client-sesv2**: ^3.849.0
- **qrcode**: ^1.5.4
- **qrcode.react**: ^4.2.0
- **uuid**: ^11.1.0
- **zod**: ^3.23.8
