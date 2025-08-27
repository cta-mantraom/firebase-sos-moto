import React, { useEffect, useState } from "react";
import { Payment } from "@mercadopago/sdk-react";
import { initMercadoPago } from "@mercadopago/sdk-react";
// Removed Firebase Functions - using Vercel API directly
import { toast } from "@/hooks/use-toast";
import { UserProfile } from "@/schemas/profile";
import { usePaymentPolling, type PixData } from "@/hooks/usePaymentPolling";
import { PaymentStatus } from "@/components/PaymentStatus";
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

      // CRITICAL: Device ID is MANDATORY for 85%+ approval rate
      // Without Device ID, payment approval drops to ~40%
      if (!window.MP_DEVICE_SESSION_ID) {
        console.error("❌ CRITICAL: Device ID not available - Payment will likely fail");
        toast({
          title: "Aguarde o carregamento completo",
          description: "Sistema de segurança está carregando. Por favor aguarde...",
          variant: "default",
        });
        // Wait more for device ID - it's critical!
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Check again after waiting
        if (!window.MP_DEVICE_SESSION_ID) {
          console.error("❌ Device ID still not available after waiting");
          throw new Error("Device ID não carregado. Recarregue a página.");
        }
      }
      
      const currentDeviceId = window.MP_DEVICE_SESSION_ID;
      console.log("✅ Device ID collected successfully:", currentDeviceId);

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
            surname: "", // UserProfile não tem surname
          },
          planType: planType,
          externalReference: externalReference,

          // Profile fields
          selectedPlan: planType,
          name: userData.name,
          surname: "", // UserProfile não tem surname
          email: userData.email,
          phone: userData.phone,
          age: userData.age,
          birthDate: "", // UserProfile não tem birthDate
          bloodType: userData.bloodType,
          allergies: userData.allergies,
          medications: userData.medications,
          medicalConditions: userData.medicalConditions,
          healthPlan: userData.healthPlan,
          preferredHospital: userData.preferredHospital,
          medicalNotes: userData.medicalNotes,
          emergencyContacts: userData.emergencyContacts,

          // CRITICAL: Device ID is MANDATORY for 85%+ approval rate
          deviceId: currentDeviceId || window.MP_DEVICE_SESSION_ID,  // Use collected Device ID
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

    // CRÍTICO: Device ID é OBRIGATÓRIO para taxa de aprovação 85%+
    // Sem Device ID: ~40% aprovação | Com Device ID: 85%+ aprovação
    const script = document.createElement('script');
    script.src = 'https://www.mercadopago.com/v2/security.js';
    script.setAttribute('view', 'checkout');
    script.setAttribute('output', window.location.hostname);
    document.head.appendChild(script);
    
    console.log("🔒 Loading MercadoPago security script for Device ID...");

    // Wait for Device ID to be loaded (CRITICAL for fraud prevention)
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos no total
    
    const checkDeviceId = () => {
      if (window.MP_DEVICE_SESSION_ID) {
        const deviceIdValue = window.MP_DEVICE_SESSION_ID;
        setDeviceId(deviceIdValue);
        console.log("✅ Device ID successfully loaded:", deviceIdValue);
        console.log("📊 Expected approval rate: 85%+ with Device ID");
        // Create payment preference after Device ID is ready
        createPreference();
      } else if (attempts < maxAttempts) {
        attempts++;
        // Retry after 100ms
        setTimeout(checkDeviceId, 100);
      } else {
        // CRITICAL: Without Device ID, approval rate drops drastically
        console.error("❌ CRITICAL: Device ID failed to load after 10 seconds");
        console.error("⚠️ Expected approval rate: ~40% without Device ID");
        toast({
          title: "Aviso Importante",
          description: "Sistema de segurança não carregou completamente. O pagamento pode falhar.",
          variant: "destructive",
        });
        // DO NOT proceed without Device ID for production
        // Only continue in development for testing
        if (import.meta.env.DEV) {
          console.warn("DEV MODE: Continuing without Device ID");
          createPreference();
        } else {
          onError(new Error("Device ID obrigatório não carregado"));
        }
      }
    };

    // Start checking for Device ID after a small delay to ensure script loads
    setTimeout(checkDeviceId, 500);
    
    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
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
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            // Remover boleto para acelerar checkout e melhorar aprovação
            ticket: [], // Array vazio para desabilitar boleto
            // Habilitar PIX e transferências bancárias
            bankTransfer: "all",
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
            hidePaymentButton: false, // Mostrar botão de pagamento
            hideFormTitle: false, // Mostrar título do formulário
          },
        }}
        onSubmit={async (paymentData) => {
          console.log("🔄 Payment submitted - Processing payment directly");
          console.log("Payment data:", paymentData);
          console.log("Device ID:", window.MP_DEVICE_SESSION_ID);
          
          // CRITICAL: Ensure Device ID is included for 85%+ approval rate
          if (!window.MP_DEVICE_SESSION_ID) {
            console.error("❌ Payment submitted without Device ID - High rejection risk!");
          }
          
          const enrichedPaymentData = {
            ...paymentData,
            deviceId: window.MP_DEVICE_SESSION_ID || deviceId,  // Use collected or current Device ID
          };
          
          console.log("💳 Payment data enriched with Device ID:", enrichedPaymentData.deviceId);
          
          // CRÍTICO: NOVO FLUXO - Processar pagamento diretamente
          if (uniqueUrl && paymentId) {
            try {
              // Atualizar cache antes de processar
              PaymentCache.addPaymentInfo(
                enrichedPaymentData,
                uniqueUrl,
                paymentId,
                preferenceId || undefined
              );
              
              console.log("📤 Sending payment to process-payment endpoint...");
              
              // NOVO: Chamar endpoint de processamento direto
              const processResponse = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...enrichedPaymentData,
                  paymentId,
                  uniqueUrl,
                  deviceId: enrichedPaymentData.deviceId,
                }),
              });
              
              const processData = await processResponse.json();
              console.log("📥 Process payment response:", processData);
              
              // Handle PIX QR Code response
              if (processData.status === 'pending_pix' && processData.pixData) {
                console.log("📱 PIX QR Code received from process-payment");
                setPixData(processData.pixData);
                
                // Continue polling for PIX payment confirmation
                startPolling(paymentId, {
                  interval: 3000,
                  maxAttempts: 60, // 3 minutes for PIX
                  onSuccess: (data) => {
                    console.log("✅ PIX Payment approved:", data);
                    PaymentCache.clear();
                    if (uniqueUrl) {
                      onSuccess(enrichedPaymentData, uniqueUrl);
                    }
                  },
                  onError: (error) => {
                    console.error("❌ PIX Payment failed:", error);
                    PaymentCache.clear();
                    toast({
                      title: "Pagamento PIX não confirmado",
                      description: error.message || "Tente novamente",
                      variant: "destructive",
                    });
                    onError(error);
                  },
                  onTimeout: () => {
                    console.error("⏱️ PIX Payment timeout");
                    PaymentCache.clear();
                    toast({
                      title: "PIX expirado",
                      description: "O QR Code expirou. Tente novamente.",
                      variant: "destructive",
                    });
                    onError(new Error("PIX expirado"));
                  }
                });
                return; // Exit here for PIX flow
              }
              
              // Handle immediate approval
              if (processData.status === 'approved') {
                console.log("✅ Payment approved immediately!");
                PaymentCache.clear();
                if (uniqueUrl) {
                  onSuccess(enrichedPaymentData, uniqueUrl);
                }
                return;
              }
              
              // Handle immediate rejection
              if (processData.status === 'rejected' || processData.status === 'error') {
                console.error("❌ Payment rejected:", processData.message);
                PaymentCache.clear();
                toast({
                  title: "Pagamento não aprovado",
                  description: processData.message || "Verifique os dados do cartão",
                  variant: "destructive",
                });
                onError(new Error(processData.message || "Pagamento recusado"));
                return;
              }
              
              // For pending/in_process, start polling
              console.log("⏳ Payment pending, starting polling...");
              startPolling(paymentId, {
                interval: 3000,
                maxAttempts: 40,
                onSuccess: (data) => {
                  console.log("✅ Payment approved by polling:", data);
                  PaymentCache.clear();
                  if (uniqueUrl) {
                    onSuccess(enrichedPaymentData, uniqueUrl);
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
                    description: "O pagamento está demorando mais que o esperado.",
                    variant: "destructive",
                  });
                  onError(new Error("Tempo limite excedido"));
                },
                onPixQRCode: (pixQRData) => {
                  console.log("📱 Unexpected PIX QR Code in polling:", pixQRData);
                  setPixData(pixQRData);
                }
              });
              
            } catch (error) {
              console.error("❌ Error processing payment:", error);
              PaymentCache.clear();
              toast({
                title: "Erro ao processar pagamento",
                description: "Ocorreu um erro inesperado. Tente novamente.",
                variant: "destructive",
              });
              onError(error as Error);
            }
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
