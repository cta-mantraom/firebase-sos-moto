import React, { useEffect, useState } from 'react';
import { Payment } from '@mercadopago/sdk-react';
import { initMercadoPago } from '@mercadopago/sdk-react';
// Removed Firebase Functions - using Vercel API directly
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/schemas/profile';

// Extended window interface for MercadoPago Device ID
declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
  }
}

interface MercadoPagoCheckoutProps {
  userData: UserProfile;
  planType: 'basic' | 'premium';
  onSuccess: (paymentData: unknown) => void;
  onError: (error: Error) => void;
}

export const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({
  userData,
  planType,
  onSuccess,
  onError,
}) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const createPreference = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Wait for Device ID to be available (CRITICAL for approval rate)
      if (!window.MP_DEVICE_SESSION_ID) {
        console.warn('Device ID not yet available, waiting...');
        // Wait a bit more for device ID
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Call Vercel API to create preference with Device ID
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedPlan: planType,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          age: userData.age,
          bloodType: userData.bloodType,
          allergies: userData.allergies,
          medications: userData.medications,
          medicalConditions: userData.medicalConditions,
          healthPlan: userData.healthPlan,
          preferredHospital: userData.preferredHospital,
          medicalNotes: userData.medicalNotes,
          emergencyContacts: userData.emergencyContacts,
          // CRITICAL: Include Device ID for improved approval rate
          deviceId: window.MP_DEVICE_SESSION_ID || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create payment`);
      }

      const data = await response.json();
      setPreferenceId(data.preferenceId);
      
    } catch (error) {
      console.error('Error creating preference:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a preferência de pagamento',
        variant: 'destructive',
      });
      onError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [planType, userData, onError]);

  useEffect(() => {
    // Initialize MercadoPago SDK
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'pt-BR' });
    }

    // Wait for Device ID to be loaded (CRITICAL for fraud prevention)
    const checkDeviceId = () => {
      if (window.MP_DEVICE_SESSION_ID) {
        setDeviceId(window.MP_DEVICE_SESSION_ID);
        console.log('Device ID loaded:', window.MP_DEVICE_SESSION_ID);
        // Create payment preference after Device ID is ready
        createPreference();
      } else {
        // Retry after 100ms
        setTimeout(checkDeviceId, 100);
      }
    };
    
    // Start checking for Device ID
    checkDeviceId();
  }, [createPreference]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">
          {!deviceId ? 'Carregando segurança...' : 'Preparando checkout...'}
        </span>
      </div>
    );
  }

  if (!preferenceId) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Erro ao carregar checkout</p>
        <button
          onClick={createPreference}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Payment
        initialization={{
          amount: planType === 'premium' ? 85.00 : 55.00,
          preferenceId: preferenceId,
          payer: {
            email: userData.email, // Pre-fill email for better UX
          },
        }}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'all',
            bankTransfer: 'all',
            mercadoPago: 'all',
          },
          visual: {
            style: {
              theme: 'default',
              customVariables: {
                formBackgroundColor: '#ffffff',
                baseColor: '#2563eb',
              },
            },
          },
        }}
        onSubmit={async (paymentData) => {
          console.log('Payment submitted:', paymentData);
          onSuccess(paymentData);
        }}
        onError={(error) => {
          console.error('Payment error:', error);
          toast({
            title: 'Erro no pagamento',
            description: 'Ocorreu um erro ao processar o pagamento',
            variant: 'destructive',
          });
          onError(new Error('Payment failed'));
        }}
      />
    </div>
  );
};