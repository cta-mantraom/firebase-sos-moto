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
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [processingStarted, setProcessingStarted] = useState(false);
  
  // Generate IDs once on mount
  const [paymentId] = useState(() => `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [uniqueUrl] = useState(() => `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  
  // Hook de polling para verificar status do pagamento
  const { status, polling, progress, message, startPolling } = usePaymentPolling();

  const createPendingProfile = React.useCallback(async () => {
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

      // Create pending profile in Firestore
      const response = await fetch("/api/create-pending-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uniqueUrl,
          paymentId,
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
          deviceId: currentDeviceId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}: Failed to create pending profile`);
      }

      const data = await response.json();
      console.log("✅ Pending profile created:", data);
      
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
        deviceId: currentDeviceId
      };
      
      const cacheSuccess = PaymentCache.saveFormData(formDataForCache, currentDeviceId);
      
      if (cacheSuccess) {
        console.log("[MercadoPago] Form data cached successfully");
      }
    } catch (error) {
      console.error("Error creating pending profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível preparar o pagamento. Tente novamente.",
        variant: "destructive",
      });
      onError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [planType, userData, onError, paymentId, uniqueUrl]);

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
        // Create pending profile after Device ID is ready
        createPendingProfile();
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
          createPendingProfile();
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
  }, [createPendingProfile]);

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

  if (!deviceId) {
    return (
      <div className="text-center p-8">
        <p className="text-yellow-500">Preparando sistema de segurança...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-4"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Payment
        initialization={{
          amount: planType === "premium" ? 85.0 : 5.0,
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
        onSubmit={async (paymentFormData) => {
          console.log("🔄 Payment submitted - Processing payment directly");
          console.log("Payment form data:", paymentFormData);
          console.log("Device ID:", window.MP_DEVICE_SESSION_ID);
          
          // Prevent multiple submissions
          if (processingStarted) {
            console.log("⚠️ Payment already processing, ignoring duplicate submission");
            return;
          }
          setProcessingStarted(true);
          
          // CRITICAL: Ensure Device ID is included for 85%+ approval rate
          if (!window.MP_DEVICE_SESSION_ID) {
            console.error("❌ Payment submitted without Device ID - High rejection risk!");
          }
          
          // Extract the actual payment data from the formData wrapper
          const actualPaymentData = paymentFormData.formData || paymentFormData;
          
          // Build correct payment structure for process-payment endpoint
          const paymentRequest = {
            // IDs
            paymentId: paymentId,
            uniqueUrl: uniqueUrl,
            deviceId: window.MP_DEVICE_SESSION_ID || deviceId,
            
            // Payment method data
            token: actualPaymentData.token,
            issuer_id: actualPaymentData.issuer_id || actualPaymentData.issuerId,
            payment_method_id: actualPaymentData.payment_method_id || actualPaymentData.paymentMethodId,
            transaction_amount: planType === "premium" ? 85.0 : 5.0,
            installments: actualPaymentData.installments || 1,
            
            // Payer data
            payer: {
              email: actualPaymentData.payer?.email || userData.email,
              identification: actualPaymentData.payer?.identification || {
                type: "CPF",
                number: actualPaymentData.payer?.identification?.number || "00000000000"
              }
            },
            
            // Additional metadata
            metadata: {
              plan_type: planType,
              blood_type: userData.bloodType,
              device_id: window.MP_DEVICE_SESSION_ID || deviceId,
            }
          };
          
          console.log("💳 Sending payment request:", paymentRequest);
          
          try {
            // Update cache before processing
            PaymentCache.addPaymentInfo(
              actualPaymentData,
              uniqueUrl,
              paymentId,
              undefined
            );
            
            console.log("📤 Sending payment to process-payment endpoint...");
            
            // Call process-payment endpoint with correct structure
            const processResponse = await fetch('/api/process-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paymentRequest),
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
              if (processData.status === 'rejected' || processData.status === 'error' || !processData.success) {
                console.error("❌ Payment rejected:", processData.message);
                PaymentCache.clear();
                setProcessingStarted(false); // Allow retry
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
              setProcessingStarted(false); // Allow retry
              toast({
                title: "Erro ao processar pagamento",
                description: "Ocorreu um erro inesperado. Tente novamente.",
                variant: "destructive",
              });
              onError(error as Error);
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
