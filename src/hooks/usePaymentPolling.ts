import { useState, useCallback } from 'react';
import { z } from 'zod';

// Schema para validação dos dados PIX
const PixDataSchema = z.object({
  qrCode: z.string(),
  qrCodeBase64: z.string().optional(),
  ticketUrl: z.string().optional(),
  amount: z.number(),
  instructions: z.array(z.string()).optional()
});

// Schema para validação dos dados de sucesso
const SuccessDataSchema = z.object({
  status: z.string(),
  profileUrl: z.string().optional(),
  qrCodeUrl: z.string().optional(),
  message: z.string().optional(),
  redirectUrl: z.string().optional()
});

// Tipos inferidos dos schemas
export type PixData = z.infer<typeof PixDataSchema>;
export type SuccessData = z.infer<typeof SuccessDataSchema>;

export interface PollingOptions {
  interval?: number;
  maxAttempts?: number;
  onSuccess?: (data: SuccessData) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
  onPixQRCode?: (pixData: PixData) => void;
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
    console.log(`[Polling] Starting payment status polling for ${paymentId}`);
    setPolling(true);
    let attempts = 0;
    const maxAttempts = options.maxAttempts || 40;
    const interval = options.interval || 3000;
    
    const poll = async () => {
      try {
        console.log(`[Polling] Attempt ${attempts + 1}/${maxAttempts}`);
        const response = await fetch(`/api/check-status?paymentId=${paymentId}`);
        const data = await response.json();
        
        console.log(`[Polling] Status received:`, data.status);
        setStatus(data.status);
        setMessage(data.message || 'Aguardando confirmação...');
        setProgress(data.progress || Math.min(attempts * 2.5, 95));
        
        // Status aprovado - sucesso com validação
        if (data.status === 'approved') {
          console.log(`[Polling] Payment approved! Profile URL: ${data.profileUrl}`);
          setPolling(false);
          setProgress(100);
          setMessage('Pagamento aprovado! Redirecionando...');
          
          // Validar dados antes de chamar onSuccess
          const validatedData = SuccessDataSchema.safeParse(data);
          if (validatedData.success) {
            setTimeout(() => options.onSuccess?.(validatedData.data), 1000);
          } else {
            console.error('[Polling] Invalid success data:', validatedData.error);
            options.onError?.(new Error('Dados de sucesso inválidos'));
          }
          return;
        }
        
        // Status rejeitado ou cancelado
        if (data.status === 'rejected' || data.status === 'cancelled') {
          console.log(`[Polling] Payment ${data.status}:`, data.statusDetail);
          setPolling(false);
          options.onError?.(new Error(data.message || 'Pagamento não aprovado'));
          return;
        }
        
        // PIX - mostrar QR Code com validação
        if (data.status === 'pending_pix' && data.pixData) {
          console.log(`[Polling] PIX QR Code available`);
          
          // Validar dados PIX antes de chamar onPixQRCode
          const validatedPixData = PixDataSchema.safeParse(data.pixData);
          if (validatedPixData.success) {
            options.onPixQRCode?.(validatedPixData.data);
          } else {
            console.error('[Polling] Invalid PIX data:', validatedPixData.error);
          }
        }
        
        // Status processing - pagamento aprovado mas perfil sendo criado
        if (data.status === 'processing') {
          setMessage('Pagamento aprovado! Criando seu perfil de emergência...');
          setProgress(75);
        }
        
        // Continuar polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        } else {
          console.log(`[Polling] Timeout after ${attempts} attempts`);
          setPolling(false);
          setStatus('timeout');
          setMessage('Tempo limite excedido. Tente novamente.');
          options.onTimeout?.();
        }
      } catch (error) {
        console.error('[Polling] Error:', error);
        setPolling(false);
        setMessage('Erro ao verificar status do pagamento');
        options.onError?.(error as Error);
      }
    };
    
    // Iniciar primeiro poll após 1 segundo
    setTimeout(poll, 1000);
  }, []);
  
  const stopPolling = useCallback(() => {
    console.log('[Polling] Stopping polling');
    setPolling(false);
  }, []);
  
  return { 
    status, 
    polling, 
    progress,
    message,
    startPolling,
    stopPolling
  };
};