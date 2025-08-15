# Guia de Integração MercadoPago - Sistema SOS Moto

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

Dados recebidos em cada função (ex: webhook, checkout) quando necessário usar `unknown` devem ser inicialmente tipados

Esses dados brutos são imediatamente validados com schemas fortes (Zod), convertendo para tipos definidos.

Código interno trabalha somente com esses tipos validados.

Isso garante robustez, segurança, e elimina bugs silenciosos.

### **Sobre Código de Testes em Produção**

Sempre analise se há identificação de código de teste misturado em código de produção não pode ter código de teste misturado com código de produção

**Deve ser removido imediatamente.**

Nenhum teste novo será criado nem modificado nesta fase.

## 🎯 Benefícios Esperados da Refatoração

- ✅ **Segurança máxima de tipos**, com validação rigorosa
- ✅ **Código limpo, modular**, com responsabilidades claras
- ✅ **Remoção completa de código de testes em produção**
- ✅ **Configuração correta do mercado pago sdk react para cada função relacionada com pagamento**
- ✅ **Melhor garantia de deploys estáveis e previsíveis**
- ✅ **Estrutura preparada para escalabilidade e manutenção facilitada**

## ⚠️ AVISO IMPORTANTE

> **Durante esta fase de refatoração, é expressamente proibido o uso do tipo `any` em qualquer código de produção.**
>
> quando for necessário usar `unknown` Use somente para representar dados externos não validados, validando-os imediatamente com schemas (Zod).
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

## 1. Visão Geral

Este documento detalha a implementação completa da integração com MercadoPago no sistema SOS Moto, utilizando o SDK React oficial e seguindo as melhores práticas de segurança e aprovação de pagamentos. A integração suporta exclusivamente pagamentos via cartão de crédito/débito e PIX.

**Pré-requisito:** O arquivo `api/create-payment.ts` deve estar desacoplado de outras funcionalidades antes de iniciar esta implementação.

## 2. Tecnologias e SDK

* **SDK Oficial:** `@mercadopago/sdk-react` (versão mais recente)

* **Métodos de Pagamento:** Cartão de crédito/débito e PIX

* **Arquitetura:** Client-Side com Payment Brick + Server-Side para processamento

## 3. Configuração do Payment Brick

### 3.1 Inicialização do SDK

```javascript
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializar o SDK com chave pública
initMercadoPago('YOUR_PUBLIC_KEY', {
  locale: 'pt-BR'
});
```

**Referência:** Consulte `documentMp/INTEGRAÇÃO BRICKS/Customizações gerais/definir tema.md` para configurações de tema.

### 3.2 Implementação do Device ID (Obrigatório)

Para melhorar a aprovação e segurança dos pagamentos, é obrigatório implementar o Device ID:

```javascript
// Adicionar script do Device ID no HTML
<script src="https://www.mercadopago.com/v2/security.js" view="checkout"></script>

// Obter Device ID
const deviceId = window.MP_DEVICE_SESSION_ID;
```

**Referência:** Consulte `documentMp/INTEGRAÇÃO BRICKS/Como melhorar a aprovação dos pagamentos/melhorara a aprovacao.md` para detalhes sobre Device ID.

### 3.3 Configuração do Payment Brick

```javascript
const PaymentBrick = () => {
  const initialization = {
    amount: planPrice,
    preferenceId: preferenceId,
    payer: {
      email: userEmail, // Pré-preenchimento automático
    },
  };

  const customization = {
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
      ticket: 'all', // Para PIX
      bankTransfer: 'all', // Para PIX
      mercadoPago: 'wallet_purchase', // Carteira MP
    },
    visual: {
      style: {
        theme: 'default' // Manter estilo padrão
      }
    }
  };

  const onSubmit = async ({ selectedPaymentMethod, formData }) => {
    // Adicionar Device ID aos dados
    const paymentData = {
      ...formData,
      device_id: window.MP_DEVICE_SESSION_ID
    };
    
    // Processar pagamento
    return new Promise((resolve, reject) => {
      fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          reject();
        } else {
          resolve();
        }
      })
      .catch(() => reject());
    });
  };

  const onReady = () => {
    // Callback executado quando o Brick está pronto
    console.log('Payment Brick ready');
  };

  const onError = (error) => {
    // Tratamento de erros específicos
    console.error('Payment error:', error);
  };

  return (
    <Payment
      initialization={initialization}
      customization={customization}
      onSubmit={onSubmit}
      onReady={onReady}
      onError={onError}
    />
  );
};
```

**Referências:**

* `documentMp/INTEGRAÇÃO BRICKS/Funcionalidades avançadas/Inicializar dados nos Bricks.md` - Pré-preenchimento de dados

* `documentMp/INTEGRAÇÃO BRICKS/Funcionalidades avançadas/Meio de pagamento padrão.md` - Configuração de métodos de pagamento

* `documentMp/Brick de Pagamento Github/Documentação do Fluxo de Convidados.md` - Documentação completa do Payment Brick

### 3.4 Gerenciamento de Unmount (Obrigatório)

Sempre que o usuário sair da tela onde o Brick é exibido, é necessário destruir a instância:

```javascript
useEffect(() => {
  return () => {
    // Destruir instância ao sair da tela
    if (window.paymentBrickController) {
      window.paymentBrickController.unmount();
    }
  };
}, []);
```

## 4. Configuração do Parcelamento

Para configurar o número mínimo e máximo de parcelas:

```javascript
const customization = {
  paymentMethods: {
    minInstallments: 1,
    maxInstallments: 12,
  },
};
```

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Funcionalidades avançadas/Configurar parcelamento.md`

## 5. Implementação Server-Side (create-payment.ts)

### 5.1 Criação de Pagamento para Cartões

Para pagamentos com cartão, envie um POST para `/v1/payments` com os dados coletados pelo Brick:

```javascript
// Exemplo de estrutura de dados para cartão
const paymentData = {
  transaction_amount: amount,
  token: formData.token,
  description: 'SOS Moto - Plano Premium',
  installments: formData.installments,
  payment_method_id: formData.payment_method_id,
  payer: {
    email: formData.payer.email,
    identification: formData.payer.identification
  },
  additional_info: {
    items: [{
      id: planId,
      title: planTitle,
      quantity: 1,
      unit_price: amount
    }],
    payer: {
      first_name: userData.name,
      phone: {
        number: userData.phone
      }
    }
  },
  device_id: formData.device_id // Obrigatório para segurança
};
```

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Payment/Cartões.md`

### 5.2 Criação de Pagamento PIX

Para pagamentos PIX, é obrigatório enviar o e-mail do comprador:

```javascript
const pixPaymentData = {
  transaction_amount: amount,
  description: 'SOS Moto - Plano Premium',
  payment_method_id: 'pix',
  payer: {
    email: formData.payer.email, // Obrigatório para PIX
    identification: {
      type: formData.payer.identification.type,
      number: formData.payer.identification.number
    }
  }
};
```

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Payment/pix.md`

### 5.3 Headers Obrigatórios

Todos os requests devem incluir o header `X-Idempotency-Key`:

```javascript
const headers = {
  'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
  'X-Idempotency-Key': crypto.randomUUID() // Obrigatório
};
```

## 6. Gestão de Pagamentos

### 6.1 Reserva de Valores

Para reservar valores no cartão sem capturar imediatamente:

```javascript
const reservePayment = {
  ...paymentData,
  capture: false // Apenas reserva, não captura
};
```

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Gestão de pagamentos/Reservar valores.md`

### 6.2 Captura de Pagamento Autorizado

Para capturar um pagamento previamente autorizado:

```javascript
// Captura total
PUT /v1/payments/{payment_id}
{
  "capture": true
}

// Captura parcial (valores do SOS Moto)
PUT /v1/payments/{payment_id}
{
  "transaction_amount": 55.00, // Plano básico
  "capture": true
}

// ou
PUT /v1/payments/{payment_id}
{
  "transaction_amount": 85.00, // Plano premium
  "capture": true
}
```

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Gestão de pagamentos/Capturar pagamento autorizado.md`

### 6.3 Cancelamento de Reserva

Para cancelar uma reserva:

```javascript
PUT /v1/payments/{payment_id}
{
  "status": "cancelled"
}
```

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Gestão de pagamentos/Cancele a reserva.md`

## 7. Responsabilidades por Arquivo

### 7.1 Frontend - MercadoPagoCheckout.tsx

**Responsabilidades:**

* Inicialização do SDK React do MercadoPago

* Configuração do Payment Brick com valores corretos (55.00 ou 85.00)

* Implementação do Device ID obrigatório

* Callbacks onSubmit, onReady e onError

* Gerenciamento de unmount do Brick

**Implementação atual:**

```javascript
// Valores corretos da aplicação
initialization={{
  amount: planType === 'premium' ? 85.00 : 55.00,
  preferenceId: preferenceId,
  payer: {
    email: userData.email, // Pré-preenchimento obrigatório
  },
}}
```

**Melhorias necessárias:**

* Adicionar callback onReady

* Implementar Device ID (window\.MP\_DEVICE\_SESSION\_ID)

* Configurar unmount no useEffect cleanup

### 7.2 Backend - create-payment.ts

**Responsabilidades:**

* Criação de preferências de pagamento no MercadoPago

* Processamento de pagamentos aprovados (processApprovedPayment)

* Headers obrigatórios (X-Idempotency-Key)

**Valores corretos implementados:**

```javascript
const PLAN_PRICES = {
  basic: { title: "SOS Motoboy - Plano Básico", unit_price: 55.0 },
  premium: { title: "SOS Motoboy - Plano Premium", unit_price: 85.0 }
};
```

### 7.3 Backend - mercadopago.service.ts (Nova Arquitetura)

**Responsabilidades:**

* Encapsular toda lógica específica do MercadoPago

* Criação e gerenciamento de preferências

* Validação de webhooks HMAC

* Gerenciamento de headers obrigatórios

* Integração com APIs do MercadoPago

* Validação de Device ID

**Implementação proposta:**

```typescript
class MercadoPagoService {
  async createPreference(data: PaymentData): Promise<PreferenceResponse> {
    // Criação de preferência com headers obrigatórios
    // Validação de Device ID
    // Configuração de back_urls e notification_url
  }
  
  async validateWebhook(signature: string, requestId: string): Promise<boolean> {
    // Validação HMAC obrigatória
    // Verificação de headers x-signature e x-request-id
  }
  
  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    // Busca detalhes do pagamento via API
    // Headers de autenticação
  }
  
  private generateIdempotencyKey(): string {
    // Geração de X-Idempotency-Key único
  }
  
  private validateDeviceId(deviceId: string): boolean {
    // Validação do MP_DEVICE_SESSION_ID
  }
}
```

**Relação com outros arquivos:**

* **create-payment.ts**: Utiliza MercadoPagoService.createPreference()
* **mercadopago-webhook.ts**: Utiliza MercadoPagoService.validateWebhook() e getPaymentDetails()
* **MercadoPagoCheckout.tsx**: Fornece Device ID que é validado pelo service

**Benefícios da separação:**

* Centralização da lógica do MercadoPago
* Reutilização entre diferentes endpoints
* Facilita testes unitários
* Melhora manutenibilidade
* Abstrai complexidade das APIs

### 7.4 Backend - mercadopago-webhook.ts

**Responsabilidades:**

* Validação de assinatura HMAC obrigatória

* Processamento de notificações de webhook

* Logs de auditoria no Firestore

* Retry logic

## 8. Implementação Completa de Webhooks

### 8.1 Configuração de Webhooks

Os webhooks do MercadoPago devem ser configurados para receber notificações em tempo real sobre mudanças de status dos pagamentos.

**Configuração no Painel:**

1. Acesse "Suas integrações" no painel do MercadoPago
2. Configure a URL: `https://seu-dominio.com/api/mercadopago-webhook`
3. Selecione eventos: "Pagamentos" (payment)
4. Gere a assinatura secreta para validação HMAC

**Referência:** `documentMp/Notificações/Webhooks.md`

### 8.2 Validação de Assinatura HMAC (Obrigatória)

Todos os webhooks do MercadoPago incluem assinatura HMAC nos headers `x-signature` e `x-request-id` para validação de autenticidade:

```javascript
const validateHMACSignature = (requestId, signature, secret) => {
  const parts = signature.split(',');
  const ts = parts.find(part => part.startsWith('ts='))?.split('=')[1];
  const hash = parts.find(part => part.startsWith('v1='))?.split('=')[1];
  
  // Formato: id:[data.id];request-id:[x-request-id];ts:[timestamp];
  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const sha = hmac.digest('hex');
  
  return sha === hash;
};
```

**Headers obrigatórios:**

* `x-signature`: Contém timestamp e hash (formato: `ts=1704908010,v1=hash`)

* `x-request-id`: ID único da requisição

### 8.3 Estrutura de Notificações

As notificações chegam no formato JSON com a seguinte estrutura:

```json
{
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "date_created": "2015-03-25T10:04:58.396-04:00",
  "user_id": 44444,
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "999999999"
  }
}
```

**Campos importantes:**

* `type`: Tipo de notificação ("payment" para pagamentos)

* `action`: Ação específica ("payment.updated", "payment.created")

* `data.id`: ID do pagamento para buscar detalhes completos

### 8.4 Processamento de Eventos payment.updated

Apenas eventos `payment.updated` devem ser processados para evitar duplicações:

```javascript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = crypto.randomUUID();
  
  try {
    // Aceitar apenas POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validar headers obrigatórios
    const signature = req.headers['x-signature'] as string;
    const requestId = req.headers['x-request-id'] as string;
    
    if (!signature || !requestId) {
      return res.status(401).json({ error: 'Missing signature headers' });
    }

    // Validar assinatura HMAC
    const isValid = validateHMACSignature(
      requestId,
      signature,
      process.env.MERCADOPAGO_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse e validação dos dados
    const webhookData = MercadoPagoWebhookSchema.parse(req.body);

    // Tratar notificações de teste
    if (webhookData.action === 'test') {
      console.log('Test webhook received');
      return res.status(200).json({ status: 'test webhook processed' });
    }

    // Processar apenas payment.updated
    if (
      webhookData.type !== 'payment' ||
      webhookData.action !== 'payment.updated'
    ) {
      return res.status(200).json({ status: 'ignored' });
    }

    // Buscar detalhes completos do pagamento
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${webhookData.data.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );
    const payment = await paymentResponse.json();

    // Log de auditoria obrigatório
    await db.collection('payments_log').doc(webhookData.data.id).set({
      paymentId: webhookData.data.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      externalReference: payment.external_reference,
      amount: payment.transaction_amount, // 55.00 ou 85.00
      correlationId,
      processedAt: new Date(),
    });

    // Processar pagamento aprovado
    if (payment.status === 'approved' && payment.external_reference) {
      const profileId = payment.external_reference;
      
      try {
        const { processApprovedPayment } = await import('./create-payment');
        await processApprovedPayment(profileId, payment);
        
        console.log(`Profile processed successfully for ${profileId}`);
      } catch (error) {
        console.error('Failed to process profile:', error);
        
        // Marcar como falha para retry manual
        await db.collection('pending_profiles').doc(profileId).update({
          status: 'payment_approved_processing_failed',
          error: (error as Error).message,
          correlationId,
          updatedAt: new Date(),
        });
      }
    }

    return res.status(200).json({
      status: 'processed',
      correlationId,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      correlationId,
    });
  }
}
```

### 8.5 Timeouts e Retry Logic

O MercadoPago espera resposta HTTP 200/201 em até **22 segundos**:

* **Timeout:** 22 segundos para confirmação

* **Retry:** A cada 15 minutos se não receber resposta

* **Máximo:** 3 tentativas, depois intervalo estendido

```javascript
// Resposta obrigatória
return res.status(200).json({ status: 'processed' });
```

### 8.6 Monitoramento de Webhooks

O painel do MercadoPago oferece monitoramento completo:

* **Dashboard:** Visualização de eventos e status de entrega

* **Logs:** Histórico completo de notificações enviadas

* **Filtros:** Por status (sucesso/falha) e período

* **Detalhes:** Request/response completos para debugging

**Acesso:** Suas integrações > Webhooks > Painel de notificações

## 9. Tratamento de Erros

### 9.1 Erros Comuns e Soluções

| Código | Erro                      | Solução                                 |
| ------ | ------------------------- | --------------------------------------- |
| 2006   | Card Token not found      | Verificar se o token do cartão é válido |
| 3000   | Missing cardholder\_name  | Incluir nome do portador do cartão      |
| 4020   | Invalid notification\_url | Usar URL HTTPS válida para webhook      |
| 4292   | Missing X-Idempotency-Key | Incluir header obrigatório              |

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Referências de API/Payment/Criar pagamento/erros.md`

### 9.2 Implementação de Retry Logic

```javascript
const retryPayment = async (paymentData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await createPayment(paymentData);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## 10. Melhorias para Aprovação

### 10.1 Informações Adicionais Obrigatórias

Para melhorar a taxa de aprovação, sempre incluir:

```javascript
const additional_info = {
  items: [{
    id: planId,
    title: planTitle,
    quantity: 1,
    unit_price: amount,
    description: 'Plano de proteção para motociclistas'
  }],
  payer: {
    first_name: userData.name,
    last_name: userData.lastName,
    phone: {
      area_code: userData.areaCode,
      number: userData.phone
    },
    address: {
      street_name: userData.address,
      street_number: userData.number,
      zip_code: userData.zipCode
    }
  },
  shipments: {
    receiver_address: {
      zip_code: userData.zipCode,
      state_name: userData.state,
      city_name: userData.city,
      street_name: userData.address,
      street_number: userData.number
    }
  }
};
```

**Referência:** `documentMp/INTEGRAÇÃO BRICKS/Como melhorar a aprovação dos pagamentos/melhorara a aprovacao.md`

### 10.2 Device ID e Prevenção de Fraude

O Device ID é obrigatório para:

* Identificação única do dispositivo

* Prevenção contra fraudes

* Melhoria na taxa de aprovação

## 11. Configurações de Segurança

### 11.1 Variáveis de Ambiente

```env
MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
```

### 11.2 Validações Obrigatórias

* Validação de assinatura HMAC no webhook

* Verificação de origem das requisições

* Sanitização de dados de entrada

* Logs de auditoria para todas as transações

## 12. Monitoramento e Logs

### 12.1 Logs Essenciais

```javascript
// Log de criação de pagamento
console.log('Payment created:', {
  paymentId: payment.id,
  status: payment.status,
  amount: payment.transaction_amount,
  method: payment.payment_method_id,
  correlationId: correlationId
});

// Log de webhook recebido
console.log('Webhook received:', {
  type: req.body.type,
  action: req.body.action,
  paymentId: req.body.data.id,
  timestamp: new Date().toISOString()
});
```

### 12.2 Métricas Importantes

* Taxa de aprovação por método de pagamento

* Tempo de processamento de webhooks

* Erros por código de status

* Volume de transações por período

## 13. Checklist de Implementação

* [ ] SDK React do MercadoPago configurado

* [ ] Device ID implementado

* [ ] Payment Brick com pré-preenchimento de email

* [ ] Callback onReady implementado

* [ ] Unmount do Brick configurado

* [ ] Headers obrigatórios (X-Idempotency-Key)

* [ ] Webhook com validação HMAC

* [ ] Tratamento de erros específicos

* [ ] Informações adicionais para aprovação

* [ ] Logs e monitoramento configurados

* [ ] Variáveis de ambiente seguras

* [ ] Testes em ambiente sandbox

## 14. Referências da Documentação Oficial

Todas as funcionalidades implementadas seguem a documentação oficial disponível em:

* `documentMp/INTEGRAÇÃO BRICKS/` - Documentação completa dos Bricks

* `documentMp/INTEGRAÇÃO BRICKS/Payment/` - Específico para Payment Brick

* `documentMp/INTEGRAÇÃO BRICKS/Funcionalidades avançadas/` - Recursos avançados

* `documentMp/INTEGRAÇÃO BRICKS/Gestão de pagamentos/` - Gestão de ciclo de vida

* `documentMp/INTEGRAÇÃO BRICKS/Como melhorar a aprovação dos pagamentos/` - Otimizações

* `documentMp/INTEGRAÇÃO BRICKS/Referências de API/` - Referências técnicas

* `documentMp/Notificações/Webhooks.md` - Configuração e implementação de webhooks

Esta implementação garante conformidade com todas as melhores práticas do MercadoPago, incluindo validação HMAC obrigatória de webhooks, e maximiza a taxa de aprovação de pagamentos no sistema SOS Moto com valores corretos (55.00 básico, 85.00 premium).
