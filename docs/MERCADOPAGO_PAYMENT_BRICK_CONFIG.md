# Configuração Correta do Payment Brick MercadoPago

## Problema Identificado
O erro **"entityType only receives the value individual or association"** ocorre quando tentamos passar configurações incorretas no objeto `payer` dentro do `initialization` do Payment Brick.

## Solução Correta

### ❌ CONFIGURAÇÃO INCORRETA (causava erro)
```tsx
<Payment
  initialization={{
    amount: 85.0,
    preferenceId: preferenceId,
    payer: { // ❌ NÃO passar payer aqui!
      email: userData.email,
      firstName: "João",
      entityType: "individual" // ❌ Campo não aceito aqui
    }
  }}
/>
```

### ✅ CONFIGURAÇÃO CORRETA
```tsx
<Payment
  initialization={{
    amount: planType === "premium" ? 85.0 : 5.0,
    preferenceId: preferenceId,
    // NÃO incluir payer aqui - será preenchido no formulário
  }}
  customization={{
    paymentMethods: {
      creditCard: "all",
      debitCard: "all",
      ticket: [], // Array vazio para desabilitar boleto
      bankTransfer: "all", // Habilita PIX
      mercadoPago: "all",
      atm: "all",
    },
    visual: {
      style: {
        theme: "default",
        customVariables: {
          formBackgroundColor: "#ffffff",
          baseColor: "#2563eb",
        },
      },
      hidePaymentButton: false,
      hideFormTitle: false,
    },
  }}
  onSubmit={async (paymentData) => {
    // Processar pagamento com Device ID
    const enrichedData = {
      ...paymentData,
      deviceId: window.MP_DEVICE_SESSION_ID
    };
    // Iniciar polling...
  }}
/>
```

## Pontos Críticos

### 1. **Device ID Collection**
```tsx
useEffect(() => {
  // Carregar script de segurança PRIMEIRO
  const script = document.createElement('script');
  script.src = 'https://www.mercadopago.com/v2/security.js';
  script.setAttribute('view', 'checkout');
  document.head.appendChild(script);
  
  // Aguardar Device ID
  const checkDeviceId = setInterval(() => {
    if (window.MP_DEVICE_SESSION_ID) {
      setDeviceId(window.MP_DEVICE_SESSION_ID);
      clearInterval(checkDeviceId);
      // Só então criar preferência
      createPreference();
    }
  }, 100);
}, []);
```

### 2. **PIX Configuration**
Para habilitar PIX corretamente:
- `bankTransfer: "all"` no Payment Brick
- `binary_mode: false` na preferência (permite status pendente)
- Excluir boleto com `ticket: []` para acelerar

### 3. **Preference Data (Backend)**
```typescript
const preferenceData = {
  items: [{
    id: `memoryys-${plan}`,
    title: "Memoryys Guardian",
    unit_price: 85.0,
    quantity: 1,
    currency_id: "BRL",
  }],
  payer: {
    // Dados do pagador vão aqui na PREFERÊNCIA, não no Brick
    name: userData.name,
    email: userData.email,
    phone: {
      area_code: "11",
      number: "999999999"
    }
  },
  payment_methods: {
    excluded_payment_types: [
      { id: "ticket" } // Excluir boleto
    ],
    installments: 12,
    default_payment_method_id: "pix", // PIX como padrão
  },
  binary_mode: false, // Permite PIX (status pendente)
  metadata: {
    device_id: deviceId, // CRÍTICO para aprovação
  }
};
```

## Taxa de Aprovação - Checklist

### Frontend
- [x] Device ID coletado antes do pagamento
- [x] Script de segurança carregado
- [x] Payment Brick sem `payer` no `initialization`
- [x] PIX habilitado com `bankTransfer: "all"`
- [x] Polling implementado (não redirecionar no submit)

### Backend  
- [x] HMAC validation no webhook
- [x] Processamento assíncrono via QStash
- [x] Device ID incluído na preferência
- [x] Binary mode false para PIX
- [x] Dados completos do pagador na preferência

## Fluxo Correto

1. **Carregar script de segurança** → Obter Device ID
2. **Criar preferência** no backend com todos os dados
3. **Inicializar Payment Brick** apenas com amount e preferenceId
4. **Usuário preenche** dados no formulário do Brick
5. **onSubmit** → Iniciar polling (NÃO redirecionar)
6. **Webhook** valida HMAC e enfileira job
7. **Job assíncrono** processa pagamento aprovado
8. **Polling detecta** aprovação → SÓ ENTÃO redireciona

## Erros Comuns

1. ❌ Passar `payer` no `initialization` do Payment Brick
2. ❌ Usar `entityType` no Payment Brick (só existe na API)
3. ❌ Redirecionar no `onSubmit` sem confirmação
4. ❌ Não coletar Device ID
5. ❌ Processar webhook sincronicamente
6. ❌ Usar `binary_mode: true` quando quer PIX

## Implementação Atual

O arquivo `/src/components/MercadoPagoCheckout.tsx` já está configurado corretamente após as correções:
- ✅ Sem `payer` no `initialization`
- ✅ Device ID coletado
- ✅ PIX habilitado
- ✅ Polling implementado
- ✅ Não redireciona prematuramente

O webhook `/api/mercadopago-webhook.ts` está perfeito:
- ✅ HMAC validation rigorosa
- ✅ Apenas enfileira jobs
- ✅ Retorna < 3 segundos
- ✅ Fallback para webhooks falhos