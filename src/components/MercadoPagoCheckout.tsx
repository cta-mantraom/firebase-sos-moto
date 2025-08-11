import React, { useEffect, useState } from 'react';
import { Payment } from '@mercadopago/sdk-react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/schemas/profile';

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

  useEffect(() => {
    // Initialize MercadoPago SDK
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'pt-BR' });
    }

    // Create payment preference
    createPreference();
  }, [userData, planType]);

  const createPreference = async () => {
    try {
      setLoading(true);
      
      // Call Firebase Function to create preference
      const createCheckout = httpsCallable(functions, 'createCheckout');
      const result = await createCheckout({
        planType,
        userData: {
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
          planPrice: planType === 'premium' ? 85.00 : 55.00,
        },
      });

      const data = result.data as { preferenceId: string; checkoutUrl: string };
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Preparando checkout...</span>
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