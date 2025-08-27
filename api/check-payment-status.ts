import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { MercadoPagoService } from "../lib/services/payment/mercadopago.service.js";
import { logInfo, logError, logWarning } from "../lib/utils/logger.js";
import { generateCorrelationId } from "../lib/utils/ids.js";
import { getPaymentConfig } from "../lib/config/index.js";

// Schema de validação para query params
const QuerySchema = z.object({
  paymentId: z.string().min(1, "Payment ID é obrigatório"),
  preferenceId: z.string().optional(),
  deviceId: z.string().optional(), // Device ID para rastreamento
});

// Remover schema não usado - PIX data já está no PaymentDetailsSchema

/**
 * Check Payment Status Endpoint
 * 
 * Verifica o status de um pagamento e retorna informações do PIX se disponível.
 * Este endpoint é chamado via polling pelo frontend para verificar aprovação.
 * 
 * @param req - Request com paymentId nos query params
 * @param res - Response com status e dados do pagamento
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = generateCorrelationId();

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      correlationId,
    });
  }

  try {
    // Validar query params
    const queryValidation = QuerySchema.safeParse(req.query);
    
    if (!queryValidation.success) {
      logWarning("Invalid query params", {
        correlationId,
        errors: queryValidation.error.errors,
      });
      
      return res.status(400).json({
        error: "Parâmetros inválidos",
        details: queryValidation.error.errors,
        correlationId,
      });
    }

    const { paymentId, preferenceId, deviceId } = queryValidation.data;

    // CRÍTICO: Log Device ID para monitorar taxa de aprovação
    logInfo("Checking payment status", {
      correlationId,
      paymentId,
      preferenceId,
      hasDeviceId: !!deviceId,
      deviceId: deviceId ? deviceId.substring(0, 10) + '...' : null, // Log parcial por segurança
    });

    // Inicializar MercadoPago service
    const paymentConfig = getPaymentConfig();
    const mercadoPagoService = new MercadoPagoService({
      accessToken: paymentConfig.accessToken,
      webhookSecret: paymentConfig.webhookSecret,
      publicKey: paymentConfig.publicKey,
    });

    try {
      // CRÍTICO: Usar MercadoPagoService, NUNCA chamadas diretas
      // Buscar pagamento pelo external_reference
      const paymentDetails = await mercadoPagoService.searchPaymentByExternalReference(paymentId);
      
      if (!paymentDetails) {
        logInfo("Payment not found yet", {
          correlationId,
          paymentId,
        });
        
        return res.status(200).json({
          status: "pending",
          message: "Aguardando processamento do pagamento",
          correlationId,
        });
      }

      const payment = paymentDetails;
      
      // CRÍTICO: Verificar se o pagamento tem Device ID nos metadados
      const paymentDeviceId = payment.metadata?.device_id as string | undefined;
      
      logInfo("Payment found", {
        correlationId,
        mpPaymentId: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethodId: payment.payment_method_id,
        hasDeviceIdInMetadata: !!paymentDeviceId,
      });
      
      // WARNING: Se não tiver Device ID, a taxa de aprovação será impactada
      if (!paymentDeviceId && payment.status === 'rejected') {
        logWarning("Payment rejected without Device ID", {
          correlationId,
          paymentId: payment.id,
          statusDetail: payment.status_detail,
        });
      }

      // Preparar resposta baseada no status
      const response: Record<string, unknown> = {
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentMethodId: payment.payment_method_id,
        amount: payment.transaction_amount,
        correlationId,
      };

      // Se for PIX, adicionar dados do QR Code
      if (payment.payment_method_id === "pix") {
        const pixData: Record<string, unknown> = {};
        
        // Extrair dados PIX do point_of_interaction
        if (payment.point_of_interaction?.transaction_data) {
          const transactionData = payment.point_of_interaction.transaction_data;
          
          pixData.qrCode = transactionData.qr_code || null;
          pixData.qrCodeBase64 = transactionData.qr_code_base64 || null;
          pixData.ticketUrl = transactionData.ticket_url || null;
          pixData.expirationDate = payment.date_of_expiration || null;
        }

        // Adicionar dados PIX à resposta
        if (Object.keys(pixData).length > 0) {
          response.pixData = pixData;
          
          logInfo("PIX data extracted", {
            correlationId,
            hasQrCode: !!pixData.qrCode,
            hasQrCodeBase64: !!pixData.qrCodeBase64,
            hasTicketUrl: !!pixData.ticketUrl,
          });
        }
      }

      // Adicionar mensagens amigáveis baseadas no status
      switch (payment.status) {
        case "approved":
          response.message = "Pagamento aprovado com sucesso!";
          response.approved = true;
          break;
        case "pending":
          response.message = payment.payment_method_id === "pix" 
            ? "Aguardando pagamento do PIX. Use o QR Code abaixo."
            : "Aguardando processamento do pagamento...";
          break;
        case "in_process":
          response.message = "Pagamento sendo processado...";
          break;
        case "rejected":
          response.message = payment.status_detail 
            ? getRejectMessage(payment.status_detail)
            : "Pagamento não aprovado. Tente outro método.";
          response.error = true;
          break;
        case "cancelled":
          response.message = "Pagamento cancelado";
          response.error = true;
          break;
        case "refunded":
          response.message = "Pagamento reembolsado";
          response.error = true;
          break;
        default:
          response.message = "Status desconhecido";
      }

      return res.status(200).json(response);

    } catch (paymentError) {
      logError("Error fetching payment details", paymentError as Error, {
        correlationId,
        paymentId,
      });
      
      // Retornar pending em caso de erro para continuar polling
      return res.status(200).json({
        status: "pending",
        message: "Verificando status do pagamento...",
        correlationId,
      });
    }

  } catch (error) {
    logError("Payment status check failed", error as Error, {
      correlationId,
    });

    return res.status(500).json({
      error: "Erro ao verificar status do pagamento",
      correlationId,
    });
  }
}

/**
 * Retorna mensagem amigável para pagamento rejeitado
 */
function getRejectMessage(statusDetail: string): string {
  const rejectMessages: Record<string, string> = {
    "cc_rejected_bad_filled_card_number": "Número do cartão inválido",
    "cc_rejected_bad_filled_date": "Data de validade inválida",
    "cc_rejected_bad_filled_security_code": "Código de segurança inválido",
    "cc_rejected_insufficient_amount": "Saldo insuficiente",
    "cc_rejected_high_risk": "Pagamento rejeitado por segurança",
    "cc_rejected_invalid_installments": "Número de parcelas inválido",
    "cc_rejected_max_attempts": "Limite de tentativas excedido",
    "cc_rejected_duplicated_payment": "Pagamento duplicado",
    "cc_rejected_card_disabled": "Cartão desabilitado",
    "cc_rejected_amount_limit": "Limite do cartão excedido",
    "cc_rejected_by_bank": "Rejeitado pelo banco emissor",
    "cc_rejected_blacklist": "Cartão na lista negra",
    "rejected_by_bank": "Rejeitado pelo banco",
    "rejected_insufficient_data": "Dados insuficientes",
    "rejected_by_regulations": "Rejeitado por regulamentação",
  };

  return rejectMessages[statusDetail] || "Pagamento não aprovado. Tente outro método.";
}