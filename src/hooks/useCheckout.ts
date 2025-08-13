import { useState } from 'react';
import { CheckoutData } from '@/types';
import { toast } from '@/hooks/use-toast';

// Types baseados na documentação (APIResponse<T>)
interface CheckoutResponse {
  success: boolean;
  preference_id: string;
  init_point: string;
  unique_url: string;
  correlationId: string;
  timestamp: string;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId: string;
  timestamp: string;
}

export interface UseCheckoutReturn {
  createCheckout: (data: CheckoutData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useCheckout = (): UseCheckoutReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = async (data: CheckoutData): Promise<void> => {
    // Gerar correlation ID conforme documentação
    const correlationId = `checkout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating checkout with data:', {
        correlationId,
        operation: 'useCheckout.createCheckout',
        plan: data.selectedPlan,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('https://southamerica-east1-moto-sos-guardian-app-78272.cloudfunctions.net/createCheckout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId // Correlation ID conforme documentação
        },
        body: JSON.stringify({
          planType: data.selectedPlan,
          userData: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            age: data.age,
            bloodType: data.bloodType,
            allergies: data.allergies || [],
            medications: data.medications || [],
            medicalConditions: data.medicalConditions || [],
            healthPlan: data.healthPlan,
            preferredHospital: data.preferredHospital,
            medicalNotes: data.medicalNotes,
            emergencyContacts: data.emergencyContacts,
            planType: data.selectedPlan,
            planPrice: data.selectedPlan === 'basic' ? 55 : 85
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create payment`);
      }

      // Parse da resposta direta (sem dupla encapsulação)
      const result: CheckoutResponse = await response.json();

      console.log('Checkout response received:', {
        correlationId,
        success: result.success,
        hasInitPoint: !!result.init_point,
        uniqueUrl: result.unique_url,
        timestamp: new Date().toISOString()
      });

      // ✅ CORREÇÃO: Acessar init_point diretamente (sem .data)
      if (result.success && result.init_point) {
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para o Mercado Pago...",
        });

        console.log('Redirecting to MercadoPago:', {
          correlationId,
          initPoint: result.init_point,
          uniqueUrl: result.unique_url,
          preferenceId: result.preference_id,
          timestamp: new Date().toISOString()
        });

        // Redirect to MercadoPago
        window.location.href = result.init_point;
      } else {
        // Error handling estruturado conforme documentação
        const errorMsg = 'No payment URL received';
        console.error('Checkout failed:', {
          correlationId,
          error: errorMsg,
          success: result.success,
          hasInitPoint: !!result.init_point,
          timestamp: new Date().toISOString()
        });

        throw new Error(errorMsg);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

      // Log estruturado com correlation ID conforme documentação
      console.error('Checkout error:', {
        correlationId,
        operation: 'useCheckout.createCheckout',
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      setError(errorMessage);

      toast({
        title: "Erro no checkout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout,
    isLoading,
    error,
  };
};