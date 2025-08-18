import { z } from 'zod';
import crypto from 'crypto';
import { logInfo, logError, logWarning } from '../../utils/logger';

// Schemas de validação
const PreferenceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  description: z.string().optional(),
  currency_id: z.string().default('BRL'),
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
    street_number: z.number(),
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
});

const PaymentDetailsSchema = z.object({
  id: z.number(),
  status: z.string(),
  status_detail: z.string().optional(),
  transaction_amount: z.number(),
  currency_id: z.string(),
  date_created: z.string(),
  date_approved: z.string().nullable(),
  date_last_updated: z.string(),
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
});

const CreatePaymentSchema = z.object({
  transaction_amount: z.number().positive(),
  token: z.string().optional(),
  description: z.string(),
  installments: z.number().positive().optional(),
  payment_method_id: z.string(),
  payer: z.object({
    email: z.string().email(),
    identification: z.object({
      type: z.string(),
      number: z.string(),
    }),
  }),
  additional_info: z.object({
    items: z.array(PreferenceItemSchema),
    payer: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      phone: z.object({
        area_code: z.string().optional(),
        number: z.string().optional(),
      }).optional(),
      address: z.object({
        street_name: z.string().optional(),
        street_number: z.number().optional(),
        zip_code: z.string().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
  device_id: z.string().optional(),
  capture: z.boolean().optional(),
});

// Tipos derivados dos schemas
export type PreferenceData = z.infer<typeof PreferenceDataSchema>;
export type PaymentDetails = z.infer<typeof PaymentDetailsSchema>;
export type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;

export interface PreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  collector_id: number;
  date_created: string;
  external_reference: string;
}

export interface MercadoPagoConfig {
  accessToken: string;
  webhookSecret: string;
  publicKey: string;
  baseUrl?: string;
}

export class MercadoPagoService {
  private readonly config: MercadoPagoConfig;
  private readonly baseUrl: string;

  constructor(config: MercadoPagoConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.mercadopago.com';
  }

  /**
   * Cria uma preferência de pagamento no MercadoPago
   */
  async createPreference(data: PreferenceData): Promise<PreferenceResponse> {
    try {
      // Validar dados de entrada
      const validatedData = PreferenceDataSchema.parse(data);

      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey(),
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const error = await response.json();
        logError('Failed to create MercadoPago preference', new Error(error.message), {
          status: response.status,
          error,
        });
        throw new Error(`MercadoPago API error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('MercadoPago preference created', {
        preferenceId: result.id,
        externalReference: result.external_reference,
      });

      return result as PreferenceResponse;
    } catch (error) {
      logError('Error creating MercadoPago preference', error as Error);
      throw error;
    }
  }

  /**
   * Cria um pagamento direto (para cartão ou PIX)
   */
  async createPayment(data: CreatePaymentData): Promise<PaymentDetails> {
    try {
      // Validar dados de entrada
      const validatedData = CreatePaymentSchema.parse(data);

      // Validar Device ID se fornecido
      if (validatedData.device_id && !this.validateDeviceId(validatedData.device_id)) {
        logWarning('Invalid Device ID provided', { deviceId: validatedData.device_id });
      }

      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey(),
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const error = await response.json();
        logError('Failed to create payment', new Error(error.message), {
          status: response.status,
          error,
        });
        throw new Error(`Payment creation failed: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      const paymentDetails = PaymentDetailsSchema.parse(result);

      logInfo('Payment created', {
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
        amount: paymentDetails.transaction_amount,
        method: paymentDetails.payment_method_id,
      });

      return paymentDetails;
    } catch (error) {
      logError('Error creating payment', error as Error);
      throw error;
    }
  }

  /**
   * Valida a assinatura HMAC do webhook
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

      // Formato: id:[data.id];request-id:[x-request-id];ts:[timestamp];
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      
      // Gerar HMAC
      const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
      hmac.update(manifest);
      const expectedHash = hmac.digest('hex');

      const isValid = expectedHash === v1;

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
   * Busca detalhes de um pagamento
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        logError('Failed to get payment details', new Error(error.message), {
          paymentId,
          status: response.status,
        });
        throw new Error(`Failed to get payment details: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      const paymentDetails = PaymentDetailsSchema.parse(result);

      logInfo('Payment details retrieved', {
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
      });

      return paymentDetails;
    } catch (error) {
      logError('Error getting payment details', error as Error, { paymentId });
      throw error;
    }
  }

  /**
   * Captura um pagamento previamente autorizado
   */
  async capturePayment(paymentId: string, amount?: number): Promise<PaymentDetails> {
    try {
      const body: { capture: boolean; transaction_amount?: number } = {
        capture: true,
      };

      if (amount !== undefined) {
        body.transaction_amount = amount;
      }

      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        logError('Failed to capture payment', new Error(error.message || 'Unknown error'), {
          paymentId,
          amount,
          status: response.status,
        });
        throw new Error(`Failed to capture payment: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      const paymentDetails = PaymentDetailsSchema.parse(result);

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
   */
  async cancelPayment(paymentId: string): Promise<PaymentDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        logError('Failed to cancel payment', new Error(error.message || 'Unknown error'), {
          paymentId,
          status: response.status,
        });
        throw new Error(`Failed to cancel payment: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      const paymentDetails = PaymentDetailsSchema.parse(result);

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
   * Gera uma chave de idempotência única
   */
  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Valida o Device ID do MercadoPago
   */
  private validateDeviceId(deviceId: string): boolean {
    // Device ID deve ter formato específico do MercadoPago
    // Exemplo: "MP_DEVICE_SESSION_ID" com 32 caracteres hexadecimais
    const deviceIdPattern = /^[a-f0-9]{32}$/i;
    return deviceIdPattern.test(deviceId);
  }

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
    };

    return errorMessages[errorCode] || 'Erro ao processar pagamento. Tente novamente.';
  }
}