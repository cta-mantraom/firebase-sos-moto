# 🚨 GUIA DE IMPLEMENTAÇÃO - CORREÇÃO CRÍTICA DO FLUXO DE PAGAMENTO

## **PROBLEMA ATUAL**
O sistema aceita pagamentos falsos porque redireciona imediatamente no `onSubmit` sem aguardar confirmação real.

## **SOLUÇÃO STEP-BY-STEP**

### **📁 PASSO 1: Criar Hook de Polling**

**Arquivo**: `src/hooks/usePaymentPolling.ts` (CRIAR NOVO)

```typescript
import { useState, useCallback } from 'react';

export interface PollingOptions {
  interval?: number;
  maxAttempts?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
  onPixQRCode?: (pixData: any) => void;
}

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'pending_pix'
  | 'timeout'
  | 'not_found';

export const usePaymentPolling = () => {
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [polling, setPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Processando pagamento...');
  
  const startPolling = useCallback(async (
    paymentId: string,
    options: PollingOptions = {}
  ) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = options.maxAttempts || 40;
    const interval = options.interval || 3000;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/check-status?paymentId=${paymentId}`);
        const data = await response.json();
        
        setStatus(data.status);
        setMessage(data.message || 'Aguardando confirmação...');
        setProgress(data.progress || Math.min(attempts * 2.5, 95));
        
        // Status aprovado - sucesso!
        if (data.status === 'approved') {
          setPolling(false);
          setProgress(100);
          setMessage('Pagamento aprovado! Redirecionando...');
          setTimeout(() => options.onSuccess?.(data), 1000);
          return;
        }
        
        // Status rejeitado ou cancelado
        if (data.status === 'rejected' || data.status === 'cancelled') {
          setPolling(false);
          options.onError?.(new Error(data.message || 'Pagamento não aprovado'));
          return;
        }
        
        // PIX - mostrar QR Code
        if (data.status === 'pending_pix' && data.pixData) {
          options.onPixQRCode?.(data.pixData);
        }
        
        // Continuar polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        } else {
          setPolling(false);
          setStatus('timeout');
          setMessage('Tempo limite excedido. Tente novamente.');
          options.onTimeout?.();
        }
      } catch (error) {
        console.error('Erro no polling:', error);
        setPolling(false);
        options.onError?.(error as Error);
      }
    };
    
    // Iniciar primeiro poll após 1 segundo
    setTimeout(poll, 1000);
  }, []);
  
  return { 
    status, 
    polling, 
    progress,
    message,
    startPolling 
  };
};
```

### **📁 PASSO 2: Criar Componente de Status de Pagamento**

**Arquivo**: `src/components/PaymentStatus.tsx` (CRIAR NOVO)

```typescript
import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PaymentStatusProps {
  status: string;
  message: string;
  progress: number;
  pixData?: {
    qrCode: string;
    qrCodeBase64: string;
    amount: number;
    instructions: string[];
  };
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  message,
  progress,
  pixData
}) => {
  // PIX QR Code Display
  if (status === 'pending_pix' && pixData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Pague com PIX
          </h2>
          
          <div className="flex justify-center mb-4">
            {pixData.qrCodeBase64 ? (
              <img 
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-center p-4 font-mono">
                  {pixData.qrCode}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            {pixData.instructions?.map((instruction, index) => (
              <p key={index}>{instruction}</p>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold">
              Valor: R$ {pixData.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Status de processamento geral
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center">
          {/* Ícone baseado no status */}
          {status === 'pending' || status === 'processing' ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          ) : status === 'approved' ? (
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          ) : status === 'rejected' || status === 'cancelled' ? (
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          )}
          
          {/* Mensagem */}
          <h3 className="text-xl font-semibold mb-2">{message}</h3>
          
          {/* Barra de progresso */}
          {(status === 'pending' || status === 'processing') && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {/* Mensagem adicional */}
          <p className="text-sm text-gray-500 mt-4 text-center">
            {status === 'pending' 
              ? 'Por favor, não feche esta janela...'
              : status === 'approved'
              ? 'Você será redirecionado em instantes...'
              : status === 'timeout'
              ? 'O tempo limite foi excedido. Verifique seu pagamento e tente novamente.'
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
```

### **📁 PASSO 3: Atualizar MercadoPagoCheckout.tsx**

**Arquivo**: `src/components/MercadoPagoCheckout.tsx` (MODIFICAR)

```typescript
// ADICIONAR IMPORTS NO TOPO
import { usePaymentPolling } from '../hooks/usePaymentPolling';
import { PaymentStatus } from './PaymentStatus';

// DENTRO DO COMPONENTE, ADICIONAR:
const { status, polling, progress, message, startPolling } = usePaymentPolling();
const [pixData, setPixData] = useState(null);

// SUBSTITUIR onSubmit (linha 186-195) POR:
onSubmit={async (paymentData) => {
  console.log("Payment submitted - starting verification process");
  
  // 1. Salvar dados em cache local ANTES do pagamento
  const cacheData = {
    formData: /* dados do formulário */,
    paymentData,
    uniqueUrl,
    paymentId,
    timestamp: Date.now()
  };
  
  try {
    sessionStorage.setItem('pendingPayment', JSON.stringify(cacheData));
    console.log('Payment data cached locally');
  } catch (error) {
    console.error('Failed to cache payment data:', error);
  }
  
  // 2. NÃO REDIRECIONAR - Iniciar polling
  startPolling(paymentId || uniqueUrl, {
    interval: 3000,
    maxAttempts: 40,
    onSuccess: (data) => {
      console.log('Payment approved:', data);
      // Limpar cache
      sessionStorage.removeItem('pendingPayment');
      // SÓ AGORA chamar onSuccess
      if (uniqueUrl) {
        onSuccess(paymentData, uniqueUrl);
      }
    },
    onError: (error) => {
      console.error('Payment failed:', error);
      sessionStorage.removeItem('pendingPayment');
      onError(error);
    },
    onTimeout: () => {
      console.error('Payment timeout');
      sessionStorage.removeItem('pendingPayment');
      onError(new Error('Tempo limite excedido'));
    },
    onPixQRCode: (pixData) => {
      console.log('PIX QR Code received:', pixData);
      setPixData(pixData);
    }
  });
}}

// ADICIONAR COMPONENTE DE STATUS APÓS O PAYMENT BRICK:
{polling && (
  <PaymentStatus 
    status={status}
    message={message}
    progress={progress}
    pixData={pixData}
  />
)}
```

### **📁 PASSO 4: Atualizar CreateProfile.tsx**

**Arquivo**: `src/pages/CreateProfile.tsx` (MODIFICAR)

```typescript
// NO handlePaymentSuccess (linha ~85):
const handlePaymentSuccess = (paymentData: any, uniqueUrl: string) => {
  console.log("Payment confirmed by polling - redirecting to success");
  
  // Agora sim pode redirecionar - pagamento foi confirmado
  router.push(`/success?id=${uniqueUrl}`);
};

// ADICIONAR recuperação de cache no useEffect:
useEffect(() => {
  // Tentar recuperar dados do cache se existirem
  try {
    const cached = sessionStorage.getItem('pendingPayment');
    if (cached) {
      const data = JSON.parse(cached);
      // Verificar se não expirou (24 horas)
      if (Date.now() - data.timestamp < 86400000) {
        console.log('Recovered payment data from cache');
        // Restaurar formulário com dados cached
        setFormData(data.formData);
      } else {
        // Limpar cache expirado
        sessionStorage.removeItem('pendingPayment');
      }
    }
  } catch (error) {
    console.error('Failed to recover cached data:', error);
  }
}, []);
```

### **📁 PASSO 5: Criar Utilitário de Cache**

**Arquivo**: `src/utils/paymentCache.ts` (CRIAR NOVO)

```typescript
export interface PaymentCacheData {
  formData: any;
  paymentData?: any;
  uniqueUrl: string;
  paymentId: string;
  timestamp: number;
}

export class PaymentCache {
  private static readonly KEY = 'pendingPayment';
  private static readonly EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas
  
  static save(data: PaymentCacheData): boolean {
    try {
      sessionStorage.setItem(this.KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save payment cache:', error);
      return false;
    }
  }
  
  static get(): PaymentCacheData | null {
    try {
      const cached = sessionStorage.getItem(this.KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as PaymentCacheData;
      
      // Verificar expiração
      if (Date.now() - data.timestamp > this.EXPIRY_MS) {
        this.clear();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get payment cache:', error);
      return null;
    }
  }
  
  static clear(): void {
    try {
      sessionStorage.removeItem(this.KEY);
    } catch (error) {
      console.error('Failed to clear payment cache:', error);
    }
  }
  
  static exists(): boolean {
    return sessionStorage.getItem(this.KEY) !== null;
  }
}
```

## **🧪 TESTES NECESSÁRIOS**

### **1. Teste de Cartão de Crédito**
```bash
# Cartões de teste MercadoPago
Aprovado: 5031 4332 1540 6351
Recusado: 5031 4332 1540 0011
```

### **2. Teste de PIX**
- Verificar se QR Code aparece
- Confirmar que não redireciona antes do pagamento
- Validar polling funcionando

### **3. Teste de Cache**
- Preencher formulário
- Refreshar página durante pagamento
- Verificar se dados são recuperados

### **4. Teste de Timeout**
- Iniciar pagamento
- Aguardar 2 minutos
- Verificar mensagem de timeout

## **📊 CHECKLIST DE VALIDAÇÃO**

- [ ] `onSubmit` NÃO chama `onSuccess` imediatamente
- [ ] Polling implementado e funcionando
- [ ] PIX mostra QR Code antes de redirecionar
- [ ] Cache local salvando dados
- [ ] Status visual durante processamento
- [ ] Timeout após 2 minutos
- [ ] Limpeza de cache após sucesso/erro
- [ ] Backend `/api/check-status` respondendo corretamente
- [ ] Webhook atualizando status no banco
- [ ] Redirecionamento APENAS após aprovação

## **⚠️ PONTOS CRÍTICOS**

1. **Device ID**: Sempre incluir para garantir 85% de aprovação
2. **PIX**: NUNCA redirecionar antes de mostrar QR Code
3. **Polling**: Máximo 40 tentativas (2 minutos)
4. **Cache**: Usar sessionStorage (não localStorage) para segurança
5. **Status**: Sempre mostrar feedback visual durante processamento

## **🚀 DEPLOY**

```bash
# 1. Testar localmente
npm run dev

# 2. Build
npm run build

# 3. Type check
npm run type-check

# 4. Deploy preview
vercel --prod=false

# 5. Testar em preview
# 6. Deploy produção (CUIDADO!)
vercel --prod
```

---

**URGÊNCIA**: CRÍTICO - Implementar imediatamente
**Impacto**: Elimina pagamentos falsos e corrige PIX
**Tempo estimado**: 2-3 horas de implementação
**Autor**: Backend Agent + Frontend Agent
**Data**: 24/08/2025