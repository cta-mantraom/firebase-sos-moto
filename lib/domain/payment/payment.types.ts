import { z } from 'zod';

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BOLETO = 'ticket',
  ACCOUNT_MONEY = 'account_money',
}

export enum PaymentType {
  REGULAR_PAYMENT = 'regular_payment',
  SUBSCRIPTION = 'subscription',
  MARKETPLACE = 'marketplace',
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// MercadoPago Types
export interface MercadoPagoPreference {
  id: string;
  client_id?: string;
  collector_id: number;
  operation_type: string;
  items: Array<{
    id?: string;
    title: string;
    description?: string;
    picture_url?: string;
    category_id?: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
  }>;
  payer?: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    identification?: {
      type?: string;
      number?: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: number;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: 'all' | 'approved';
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
    default_installments?: number;
  };
  statement_descriptor?: string;
  external_reference?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  notification_url?: string;
  metadata?: Record<string, unknown>;
  marketplace_fee?: number;
  differential_pricing?: {
    id: number;
  };
  binary_mode?: boolean;
  taxes?: Array<{
    type: string;
    value: number;
  }>;
  init_point?: string;
  sandbox_init_point?: string;
  date_created?: string;
  date_of_expiration?: string;
}

export interface MercadoPagoPayment {
  id: number;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  money_release_date?: string;
  operation_type: string;
  issuer_id?: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail?: string;
  currency_id: string;
  description?: string;
  live_mode: boolean;
  sponsor_id?: number;
  authorization_code?: string;
  collector_id: number;
  payer: {
    type?: string;
    id?: string;
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
    phone?: {
      area_code?: string;
      number?: string;
      extension?: string;
    };
    first_name?: string;
    last_name?: string;
    entity_type?: string;
  };
  metadata?: Record<string, unknown>;
  additional_info?: {
    available_balance?: number;
    nsu_processadora?: string;
    authentication_code?: string;
    ip_address?: string;
    items?: Array<{
      id?: string;
      title?: string;
      description?: string;
      picture_url?: string;
      category_id?: string;
      quantity?: number;
      unit_price?: number;
    }>;
    payer?: {
      first_name?: string;
      last_name?: string;
      phone?: {
        area_code?: string;
        number?: string;
      };
      address?: {
        zip_code?: string;
        street_name?: string;
        street_number?: string;
      };
      registration_date?: string;
    };
    shipments?: {
      receiver_address?: {
        zip_code?: string;
        street_name?: string;
        street_number?: string;
        floor?: string;
        apartment?: string;
      };
    };
  };
  order?: {
    type?: string;
    id?: string;
  };
  external_reference?: string;
  transaction_amount: number;
  transaction_amount_refunded?: number;
  coupon_amount?: number;
  differential_pricing_id?: number;
  deduction_schema?: string;
  installments?: number;
  transaction_details?: {
    net_received_amount?: number;
    total_paid_amount?: number;
    overpaid_amount?: number;
    external_resource_url?: string;
    installment_amount?: number;
    financial_institution?: string;
    payment_method_reference_id?: string;
    payable_deferral_period?: string;
    acquirer_reference?: string;
  };
  fee_details?: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  charges_details?: Array<{
    id: string;
    name: string;
    type: string;
    accounts: {
      from: string;
      to: string;
    };
    client_id: number;
    date_created: string;
    last_updated: string;
    amounts: {
      original: number;
      refunded: number;
    };
    metadata?: Record<string, unknown>;
    reserve_id?: string;
    refund_charges?: Array<unknown>;
  }>;
  captured?: boolean;
  binary_mode?: boolean;
  call_for_authorize_id?: string;
  statement_descriptor?: string;
  card?: {
    id?: string;
    first_six_digits?: string;
    last_four_digits?: string;
    expiration_month?: number;
    expiration_year?: number;
    date_created?: string;
    date_last_updated?: string;
    cardholder?: {
      name?: string;
      identification?: {
        type?: string;
        number?: string;
      };
    };
  };
  notification_url?: string;
  refunds?: Array<{
    id: number;
    payment_id: number;
    amount: number;
    metadata?: Record<string, unknown>;
    source: {
      id: string;
      name: string;
      type: string;
    };
    date_created: string;
    unique_sequence_number?: string;
    refund_mode?: string;
    adjustment_amount?: number;
    status?: string;
    reason?: string;
  }>;
  processing_mode?: string;
  merchant_account_id?: string;
  merchant_number?: string;
  acquirer_reconciliation?: Array<unknown>;
  point_of_interaction?: {
    type: string;
    business_info?: {
      unit?: string;
      sub_unit?: string;
      branch?: string;
    };
    location?: {
      state_id?: string;
      source?: string;
    };
    application_data?: {
      name?: string;
      version?: string;
    };
    transaction_data?: {
      qr_code?: string;
      bank_transfer_id?: string;
      transaction_id?: string;
      e2e_id?: string;
      financial_institution?: string;
      ticket_url?: string;
      bank_info?: {
        payer?: {
          account_id?: string;
          id?: string;
          long_name?: string;
          account_holder_name?: string;
          identification?: {
            number?: string;
            type?: string;
          };
          external_account_id?: string;
        };
        collector?: {
          account_id?: string;
          long_name?: string;
          account_holder_name?: string;
          transfer_account_id?: string;
        };
        is_same_bank_account_owner?: boolean;
        origin_bank_id?: string;
        origin_wallet_id?: string;
      };
      infringement_notification?: {
        type?: string;
        status?: string;
      };
    };
  };
  accounts_info?: {
    from?: string;
    to?: string;
  };
  tags?: string[];
}

// Payment Data
export interface PaymentData {
  id: string;
  externalId?: string; // MercadoPago payment ID
  preferenceId?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  type: PaymentType;
  amount: number;
  currency: string;
  installments?: number;
  payer: {
    id?: string;
    email: string;
    name: string;
    surname?: string;
    phone?: string;
    cpf?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  profileId?: string;
  planType: 'basic' | 'premium';
  description?: string;
  externalReference: string;
  metadata?: Record<string, unknown>;
  refunds?: Array<{
    id: string;
    amount: number;
    status: RefundStatus;
    reason?: string;
    createdAt: Date;
  }>;
  fees?: Array<{
    type: string;
    amount: number;
    payer: string;
  }>;
  deviceId?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
}

// Validation Schemas
export const PayerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  surname: z.string().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  identification: z.object({
    type: z.string(),
    number: z.string(),
  }).optional(),
});

export const PaymentDataSchema = z.object({
  id: z.string(),
  externalId: z.string().optional(),
  preferenceId: z.string().optional(),
  status: z.nativeEnum(PaymentStatus),
  method: z.nativeEnum(PaymentMethod).optional(),
  type: z.nativeEnum(PaymentType),
  amount: z.number().positive(),
  currency: z.string(),
  installments: z.number().optional(),
  payer: PayerSchema,
  profileId: z.string().optional(),
  planType: z.enum(['basic', 'premium']),
  description: z.string().optional(),
  externalReference: z.string(),
  metadata: z.record(z.unknown()).optional(),
  deviceId: z.string().optional(),
  ipAddress: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  approvedAt: z.date().optional(),
  rejectedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  refundedAt: z.date().optional(),
});

// Webhook Data
export interface WebhookData {
  id: string;
  type: string;
  action: string;
  apiVersion: string;
  dateCreated: Date;
  userId: number;
  liveMode: boolean;
  data: {
    id: string;
  };
  signature?: string;
  requestId?: string;
}

// Processing Result
export interface PaymentProcessingResult {
  success: boolean;
  paymentId: string;
  profileId?: string;
  status: PaymentStatus;
  message?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  nextSteps?: string[];
}

// Type exports
export type Payer = z.infer<typeof PayerSchema>;