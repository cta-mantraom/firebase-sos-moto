import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
import { logInfo, logError, logWarning } from '../../utils/logger.js';
import { generateCorrelationId } from '../../utils/ids.js';

// Schemas de validação
const PreferenceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  description: z.string().optional(),
  currency_id: z.string().default('BRL'),
  category_id: z.string().optional(),
});

const PayerSchema = z.object({
  name: z.string(),
  surname: z.string(),
  email: z.string().email(),
  phone: z.object({
    area_code: z.string(),
    number: z.string(),
  }).optional(),
  identification: z.object({
    type: z.string(),
    number: z.string(),
  }).optional(),
  address: z.object({
    zip_code: z.string(),
    street_name: z.string(),
    street_number: z.string(),
  }).optional(),
});

const PreferenceDataSchema = z.object({
  items: z.array(PreferenceItemSchema),
  payer: PayerSchema.optional(),
  back_urls: z.object({
    success: z.string().url(),
    failure: z.string().url(),
    pending: z.string().url(),
  }).optional(),
  notification_url: z.string().url().optional(),
  external_reference: z.string(),
  auto_return: z.enum(['approved', 'all']).optional(),
  expires: z.boolean().optional(),
  expiration_date_from: z.string().optional(),
  expiration_date_to: z.string().optional(),
  payment_methods: z.object({
    excluded_payment_methods: z.array(z.object({ id: z.string() })).optional(),
    excluded_payment_types: z.array(z.object({ id: z.string() })).optional(),
    installments: z.number().optional(),
    default_installments: z.number().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  additional_info: z.string().optional(),
  binary_mode: z.boolean().optional(),
  purpose: z.string().optional(),
  statement_descriptor: z.string().optional(),
});

// Schema expandido para incluir dados PIX
const PaymentDetailsSchema = z.object({
  id: z.number(),
  status: z.string(),
  status_detail: z.string().optional(),
  transaction_amount: z.number(),
  currency_id: z.string(),
  date_created: z.string(),
  date_approved: z.string().nullable(),
  date_last_updated: z.string(),
  date_of_expiration: z.string().optional(),
  payer: z.object({
    email: z.string().email(),
    identification: z.object({
      type: z.string(),
      number: z.string(),
    }).optional(),
  }),
  payment_method_id: z.string(),
  payment_type_id: z.string(),
  external_reference: z.string().nullable(),
  metadata: z.record(z.unknown()).optional(),
  additional_info: z.object({
    items: z.array(z.unknown()).optional(),
    payer: z.record(z.unknown()).optional(),
  }).optional(),
  // Dados PIX
  point_of_interaction: z.object({
    transaction_data: z.object({
      qr_code: z.string().optional(),
      qr_code_base64: z.string().optional(),
      ticket_url: z.string().optional(),
      bank_info: z.record(z.unknown()).optional(),
    }).optional(),
  }).optional(),
});

const CreatePaymentSchema = z.object({
  transaction_amount: z.number().positive(),
  token: z.string().optional(),
  description: z.string(),
  installments: z.number().positive().optional(),
  payment_method_id: z.string(),
  issuer_id: z.number().optional(), // Optional, not needed for PIX
  payer: z.object({
    email: z.string().email(),
    identification: z.object({
      type: z.string(),
      number: z.string(),
    }),
  }),
  additional_info: z.object({
    // Device ID can be sent in additional_info for fraud prevention
    device_session_id: z.string().optional(),
    // IP address for fraud prevention
    ip_address: z.string().optional(),
    items: z.array(z.object({
      id: z.string(), // Required by MercadoPago API
      title: z.string(), // Required by MercadoPago API  
      quantity: z.number().positive(), // Required
      unit_price: z.number().positive(), // Required
      description: z.string().optional(),
      category_id: z.string().optional(),
      // NO currency_id here - not allowed in items
    })).optional(), // items array is optional but when present, each item must have required fields
    payer: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      phone: z.object({
        area_code: z.string().optional(),
        number: z.string().optional(),
      }).optional(),
      address: z.object({
        street_name: z.string().optional(),
        street_number: z.string().optional(),
        zip_code: z.string().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
  // device_id removed from root - must be in additional_info
  capture: z.boolean().optional(),
  external_reference: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  notification_url: z.string().optional(),
  statement_descriptor: z.string().optional(),
  binary_mode: z.boolean().optional(),
  three_d_secure_mode: z.string().optional(),
});

// Tipos derivados dos schemas
export type PreferenceData = z.infer<typeof PreferenceDataSchema>;
export type PaymentDetails = z.infer<typeof PaymentDetailsSchema>;
export type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;
// Note: Device ID is handled automatically by Payment Brick SDK, no need to pass it

export interface PreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  collector_id: number;
  date_created: string;
  external_reference: string;
}

export interface MercadoPagoServiceConfig {
  accessToken: string;
  webhookSecret: string;
  publicKey: string;
}

/**
 * MercadoPago Service usando SDK oficial
 * CRÍTICO: Sempre usar SDK, NUNCA chamadas diretas à API
 */
export class MercadoPagoService {
  private readonly config: MercadoPagoServiceConfig;
  private readonly client: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly payment: Payment;

  constructor(config: MercadoPagoServiceConfig) {
    this.config = config;
    
    // Inicializar cliente MercadoPago com SDK oficial
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: generateCorrelationId(),
      }
    });
    
    // Inicializar recursos
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  /**
   * Cria uma preferência de pagamento no MercadoPago
   * USANDO SDK OFICIAL
   */
  async createPreference(data: PreferenceData): Promise<PreferenceResponse> {
    try {
      // Validar dados de entrada
      const validatedData = PreferenceDataSchema.parse(data);

      // CRÍTICO: Adicionar device fingerprinting se disponível
      // Garantir que items tenham todos os campos obrigatórios
      const preferenceBody: Parameters<typeof this.preference.create>[0]['body'] = {
        ...validatedData,
        purpose: validatedData.purpose || 'wallet_purchase',
        items: validatedData.items.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          description: item.description || '',
          currency_id: item.currency_id || 'BRL',
          category_id: item.category_id || 'services',
        })),
        payer: validatedData.payer,
        back_urls: validatedData.back_urls,
        notification_url: validatedData.notification_url,
        external_reference: validatedData.external_reference,
        auto_return: validatedData.auto_return,
        expires: validatedData.expires,
        expiration_date_from: validatedData.expiration_date_from,
        expiration_date_to: validatedData.expiration_date_to,
        payment_methods: validatedData.payment_methods,
        metadata: validatedData.metadata,
        additional_info: validatedData.additional_info,
        binary_mode: validatedData.binary_mode,
        statement_descriptor: validatedData.statement_descriptor,
      };

      // Criar preferência usando SDK oficial
      const response = await this.preference.create({
        body: preferenceBody,
      });

      if (!response.id) {
        throw new Error('Failed to create preference: No ID returned');
      }
      
      logInfo('MercadoPago preference created', {
        preferenceId: response.id,
        externalReference: response.external_reference,
        initPoint: response.init_point,
      });

      return {
        id: response.id,
        init_point: response.init_point || '',
        sandbox_init_point: response.sandbox_init_point,
        collector_id: response.collector_id || 0,
        date_created: response.date_created || new Date().toISOString(),
        external_reference: response.external_reference || '',
      };
    } catch (error) {
      logError('Error creating MercadoPago preference', error as Error);
      throw error;
    }
  }

  /**
   * Cria um pagamento direto (para cartão ou PIX)
   * USANDO SDK OFICIAL
   */
  async createPayment(data: CreatePaymentData): Promise<PaymentDetails> {
    try {
      // Validar dados de entrada
      const validatedData = CreatePaymentSchema.parse(data);

      // IMPORTANT: When using Payment Brick with MercadoPago SDK JS,
      // Device ID is collected and sent AUTOMATICALLY by the SDK.
      // We should NOT manually add it to avoid conflicts.
      // See: https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/additional-content/security/device-id
      logInfo('Creating payment - Device ID handled automatically by Payment Brick SDK', {
        note: 'Payment Brick SDK auto-collects and sends Device ID',
        expectedApprovalRate: '85%+ (automatic)'
      })

      // Ensure items have all required fields when present
      const paymentBody = {
        ...validatedData,
        capture: validatedData.capture !== false, // Default true
        // DO NOT manually add device_session_id - SDK handles it automatically
        additional_info: validatedData.additional_info ? {
          ...validatedData.additional_info,
          items: validatedData.additional_info.items?.map(item => ({
            id: item.id!,
            title: item.title!,
            description: item.description || '',
            category_id: item.category_id || 'services',
            quantity: item.quantity!,
            unit_price: item.unit_price!,
          })),
        } : undefined,
      };
      
      const response = await this.payment.create({
        body: paymentBody,
      });

      if (!response.id) {
        throw new Error('Failed to create payment: No ID returned');
      }

      const paymentDetails = PaymentDetailsSchema.parse(response);

      logInfo('Payment created', {
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
        amount: paymentDetails.transaction_amount,
        method: paymentDetails.payment_method_id,
        note: 'Device ID handled by SDK',
      });

      return paymentDetails;
    } catch (error) {
      logError('Error creating payment', error as Error);
      throw error;
    }
  }

  /**
   * Busca pagamento pelo external_reference
   * CRÍTICO: Necessário para polling do frontend
   * USANDO SDK OFICIAL
   */
  async searchPaymentByExternalReference(externalReference: string): Promise<PaymentDetails | null> {
    try {
      // Usar SDK para buscar pagamentos
      const response = await this.payment.search({
        options: {
          external_reference: externalReference,
          criteria: 'desc',
          sort: 'date_created',
        },
      });

      // Se não houver resultados, retornar null
      if (!response.results || response.results.length === 0) {
        logInfo('No payment found for external reference', {
          externalReference,
        });
        return null;
      }

      // Pegar o pagamento mais recente
      const payment = response.results[0];
      const paymentDetails = PaymentDetailsSchema.parse(payment);

      logInfo('Payment found by external reference', {
        externalReference,
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
        paymentMethod: paymentDetails.payment_method_id,
      });

      return paymentDetails;
    } catch (error) {
      logError('Error searching payment by external reference', error as Error, { externalReference });
      throw error;
    }
  }

  /**
   * Busca detalhes de um pagamento
   * USANDO SDK OFICIAL
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    try {
      // Converter para número se necessário
      const numericId = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
      
      if (isNaN(numericId)) {
        throw new Error(`Invalid payment ID: ${paymentId}`);
      }

      // Buscar usando SDK oficial
      const response = await this.payment.get({ id: numericId });

      if (!response.id) {
        throw new Error(`Payment not found: ${paymentId}`);
      }

      const paymentDetails = PaymentDetailsSchema.parse(response);

      logInfo('Payment details retrieved', {
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
        paymentMethod: paymentDetails.payment_method_id,
      });

      return paymentDetails;
    } catch (error) {
      logError('Error getting payment details', error as Error, { paymentId });
      throw error;
    }
  }

  /**
   * Captura um pagamento previamente autorizado
   * USANDO SDK OFICIAL
   */
  async capturePayment(paymentId: string, amount?: number): Promise<PaymentDetails> {
    try {
      const numericId = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
      
      if (isNaN(numericId)) {
        throw new Error(`Invalid payment ID: ${paymentId}`);
      }

      // Capturar usando SDK oficial
      const response = await this.payment.capture({
        id: numericId,
        transaction_amount: amount,
      });

      if (!response.id) {
        throw new Error(`Failed to capture payment: ${paymentId}`);
      }

      const paymentDetails = PaymentDetailsSchema.parse(response);

      logInfo('Payment captured', {
        paymentId: paymentDetails.id,
        amount: paymentDetails.transaction_amount,
        status: paymentDetails.status,
      });

      return paymentDetails;
    } catch (error) {
      logError('Error capturing payment', error as Error, { paymentId });
      throw error;
    }
  }

  /**
   * Cancela um pagamento ou reserva
   * USANDO SDK OFICIAL
   */
  async cancelPayment(paymentId: string): Promise<PaymentDetails> {
    try {
      const numericId = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
      
      if (isNaN(numericId)) {
        throw new Error(`Invalid payment ID: ${paymentId}`);
      }

      // Cancelar usando SDK oficial
      const response = await this.payment.cancel({ id: numericId });

      if (!response.id) {
        throw new Error(`Failed to cancel payment: ${paymentId}`);
      }

      const paymentDetails = PaymentDetailsSchema.parse(response);

      logInfo('Payment cancelled', {
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
      });

      return paymentDetails;
    } catch (error) {
      logError('Error cancelling payment', error as Error, { paymentId });
      throw error;
    }
  }

  /**
   * Valida a assinatura HMAC do webhook
   * CRÍTICO: Segurança obrigatória
   */
  async validateWebhook(signature: string, requestId: string, dataId: string): Promise<boolean> {
    try {
      if (!signature || !requestId) {
        logWarning('Missing webhook signature or request ID');
        return false;
      }

      // Extrair timestamp e hash da assinatura
      const parts = signature.split(',');
      const ts = parts.find(part => part.startsWith('ts='))?.split('=')[1];
      const v1 = parts.find(part => part.startsWith('v1='))?.split('=')[1];

      if (!ts || !v1) {
        logWarning('Invalid webhook signature format');
        return false;
      }

      // Verificar timestamp recente (5 minutos)
      const currentTime = Math.floor(Date.now() / 1000);
      const signatureTime = parseInt(ts, 10);
      const timeDiff = currentTime - signatureTime;

      if (timeDiff > 300 || timeDiff < -300) {
        logWarning('Webhook timestamp too old or in future', {
          timeDiff,
          currentTime,
          signatureTime,
        });
        return false;
      }

      // Formato: id:[data.id];request-id:[x-request-id];ts:[timestamp];
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      
      // Gerar HMAC
      const hmac = createHmac('sha256', this.config.webhookSecret);
      hmac.update(manifest);
      const expectedHash = hmac.digest('hex');

      // Comparação segura contra timing attacks
      const isValid = timingSafeEqual(
        Buffer.from(expectedHash),
        Buffer.from(v1)
      );

      if (!isValid) {
        logWarning('Invalid webhook signature', {
          requestId,
          expected: expectedHash.substring(0, 10) + '...',
          received: v1.substring(0, 10) + '...',
        });
      }

      return isValid;
    } catch (error) {
      logError('Error validating webhook signature', error as Error);
      return false;
    }
  }

  /**
   * Valida o Device ID do MercadoPago
   * CRÍTICO: Para taxa de aprovação
   */

  /**
   * Formata mensagens de erro do MercadoPago
   */
  formatErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      '2006': 'Token do cartão não encontrado. Por favor, tente novamente.',
      '3000': 'Nome do portador do cartão é obrigatório.',
      '4020': 'URL de notificação inválida. Use uma URL HTTPS válida.',
      '4292': 'Header X-Idempotency-Key é obrigatório.',
      'cc_rejected_bad_filled_card_number': 'Número do cartão inválido.',
      'cc_rejected_bad_filled_date': 'Data de validade inválida.',
      'cc_rejected_bad_filled_security_code': 'Código de segurança inválido.',
      'cc_rejected_insufficient_amount': 'Saldo insuficiente.',
      'cc_rejected_high_risk': 'Pagamento rejeitado por risco de fraude.',
      'cc_rejected_invalid_installments': 'Número de parcelas inválido.',
      'cc_rejected_max_attempts': 'Limite de tentativas excedido.',
    };

    return errorMessages[errorCode] || 'Erro ao processar pagamento. Tente novamente.';
  }
}