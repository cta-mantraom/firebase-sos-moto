import React, { useEffect, useState } from "react";
import { Payment } from "@mercadopago/sdk-react";
import { initMercadoPago } from "@mercadopago/sdk-react";
// Removed Firebase Functions - using Vercel API directly
import { toast } from "@/hooks/use-toast";
import { UserProfile } from "@/schemas/profile";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { PaymentStatus, PixData } from "@/components/PaymentStatus";
import { PaymentCache } from "@/utils/paymentCache";

// Extended window interface for MercadoPago Device ID
declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
  }
}

interface MercadoPagoCheckoutProps {
  userData: UserProfile;
  planType: "basic" | "premium";
  onSuccess: (paymentData: unknown, uniqueUrl: string) => void;
  onError: (error: Error) => void;
}

export const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({
  userData,
  planType,
  onSuccess,
  onError,
}) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [uniqueUrl, setUniqueUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  
  // Hook de polling para verificar status do pagamento
  const { status, polling, progress, message, startPolling } = usePaymentPolling();

  const createPreference = React.useCallback(async () => {
    try {
      setLoading(true);

      // Wait for Device ID to be available (CRITICAL for approval rate)
      if (!window.MP_DEVICE_SESSION_ID) {
        console.warn("Device ID not yet available, waiting...");
        // Wait a bit more for device ID
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Generate external reference
      const externalReference = `sos_moto_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;

      // Call Vercel API to create preference with Device ID
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Payment fields required by validation schema
          amount: planType === "premium" ? 85.0 : 5.0,
          payer: {
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            surname: userData.surname || "",
          },
          planType: planType,
          externalReference: externalReference,

          // Profile fields
          selectedPlan: planType,
          name: userData.name,
          surname: userData.surname || "",
          email: userData.email,
          phone: userData.phone,
          age: userData.age,
          birthDate: userData.birthDate || "",
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
      setUniqueUrl(data.uniqueUrl); // Save the uniqueUrl for redirect
      setPaymentId(data.paymentId); // Save paymentId for polling
      
      // Salvar dados no cache local ANTES do pagamento
      const formDataForCache = {
        name: userData.name || '',
        surname: undefined, // UserProfile não tem surname
        email: userData.email || '',
        phone: userData.phone || '',
        birthDate: undefined, // UserProfile não tem birthDate
        age: userData.age,
        bloodType: userData.bloodType || '',
        allergies: userData.allergies || [],
        medications: userData.medications || [],
        medicalConditions: userData.medicalConditions || [],
        healthPlan: userData.healthPlan,
        preferredHospital: userData.preferredHospital,
        medicalNotes: userData.medicalNotes,
        emergencyContacts: userData.emergencyContacts?.map(contact => ({
          name: contact.name || '',
          phone: contact.phone || '',
          relationship: contact.relationship || 'Não especificado'
        })) || [],
        selectedPlan: planType,
        deviceId: window.MP_DEVICE_SESSION_ID || undefined
      };
      
      const cacheSuccess = PaymentCache.saveFormData(formDataForCache, window.MP_DEVICE_SESSION_ID || undefined);
      
      if (cacheSuccess) {
        console.log("[MercadoPago] Form data cached successfully");
      }
    } catch (error) {
      console.error("Error creating preference:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a preferência de pagamento",
        variant: "destructive",
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
      initMercadoPago(publicKey, { locale: "pt-BR" });
    }

    // Wait for Device ID to be loaded (CRITICAL for fraud prevention)
    const checkDeviceId = () => {
      if (window.MP_DEVICE_SESSION_ID) {
        setDeviceId(window.MP_DEVICE_SESSION_ID);
        console.log("Device ID loaded:", window.MP_DEVICE_SESSION_ID);
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
          {!deviceId ? "Carregando segurança..." : "Preparando checkout..."}
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
          amount: planType === "premium" ? 85.0 : 5.0,
          preferenceId: preferenceId,
          payer: {
            email: userData.email, // Pre-fill email for better UX
          },
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
            mercadoPago: "all",
          },
          visual: {
            style: {
              theme: "default",
              customVariables: {
                formBackgroundColor: "#ffffff",
                baseColor: "#2563eb",
              },
            },
          },
        }}
        onSubmit={async (paymentData) => {
          console.log("🔄 Payment submitted - Starting verification process");
          console.log("Payment data:", paymentData);
          console.log("Device ID:", window.MP_DEVICE_SESSION_ID);
          
          // CRÍTICO: NÃO REDIRECIONAR IMEDIATAMENTE!
          // Atualizar cache com dados do pagamento
          if (uniqueUrl && paymentId) {
            PaymentCache.addPaymentInfo(
              paymentData,
              uniqueUrl,
              paymentId,
              preferenceId || undefined
            );
            
            console.log("✅ Payment data cached, starting polling...");
            
            // Iniciar polling para verificar status do pagamento
            startPolling(paymentId, {
              interval: 3000, // Verificar a cada 3 segundos
              maxAttempts: 40, // Máximo 2 minutos
              onSuccess: (data) => {
                console.log("✅ Payment approved by polling:", data);
                // Limpar cache após sucesso
                PaymentCache.clear();
                // SÓ AGORA chamar onSuccess após confirmação real
                if (uniqueUrl) {
                  onSuccess(paymentData, uniqueUrl);
                }
              },
              onError: (error) => {
                console.error("❌ Payment failed:", error);
                PaymentCache.clear();
                toast({
                  title: "Pagamento não aprovado",
                  description: error.message || "Verifique os dados e tente novamente",
                  variant: "destructive",
                });
                onError(error);
              },
              onTimeout: () => {
                console.error("⏱️ Payment timeout");
                PaymentCache.clear();
                toast({
                  title: "Tempo limite excedido",
                  description: "O pagamento está demorando mais que o esperado. Verifique com seu banco.",
                  variant: "destructive",
                });
                onError(new Error("Tempo limite excedido"));
              },
              onPixQRCode: (pixQRData) => {
                console.log("📱 PIX QR Code received:", pixQRData);
                setPixData(pixQRData);
              }
            });
          } else {
            console.error("Missing uniqueUrl or paymentId");
            onError(new Error("Dados de pagamento incompletos"));
          }
        }}
        onError={(error) => {
          console.error("Payment error:", error);
          toast({
            title: "Erro no pagamento",
            description: "Ocorreu um erro ao processar o pagamento",
            variant: "destructive",
          });
          onError(new Error("Payment failed"));
        }}
      />
      
      {/* Componente de status de pagamento - mostrar durante polling */}
      {polling && (
        <PaymentStatus 
          status={status}
          message={message}
          progress={progress}
          pixData={pixData || undefined}
        />
      )}
    </div>
  );
};
