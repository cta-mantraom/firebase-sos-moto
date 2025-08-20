import { z } from 'zod';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  RefundStatus,
  PaymentData,
  MercadoPagoPayment,
  WebhookData,
  PaymentProcessingResult,
} from './payment.types.js';
import { PlanType } from '../profile/profile.types.js';

/**
 * Payment Domain Validators
 * 
 * This module provides comprehensive validation schemas for payment-related data.
 * All validations follow strict TypeScript guidelines with no "any" types.
 */

// Base validation schemas
export const PaymentAmountSchema = z.number()
  .positive('Payment amount must be positive')
  .max(1000000, 'Payment amount exceeds maximum allowed');

export const PaymentCurrencySchema = z.string()
  .regex(/^[A-Z]{3}$/, 'Currency must be a valid 3-letter ISO code')
  .default('BRL');

export const ExternalReferenceSchema = z.string()
  .min(1, 'External reference is required')
  .max(256, 'External reference too long');

// Payer validation with strict CPF validation
export const PayerValidationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long'),
  name: z.string()
    .min(2, 'Name must have at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Name can only contain letters and spaces'),
  surname: z.string()
    .max(100, 'Surname too long')
    .regex(/^[a-zA-ZÀ-ÿ\s]*$/, 'Surname can only contain letters and spaces')
    .optional(),
  phone: z.string()
    .regex(/^\d{10,11}$/, 'Phone must be 10 or 11 digits')
    .optional(),
  cpf: z.string()
    .regex(/^\d{11}$/, 'CPF must be exactly 11 digits')
    .refine(validateCPF, 'Invalid CPF')
    .optional(),
  identification: z.object({
    type: z.string().min(1, 'Identification type is required'),
    number: z.string().min(1, 'Identification number is required'),
  }).optional(),
});

// Payment creation validation
export const CreatePaymentSchema = z.object({
  amount: PaymentAmountSchema,
  currency: PaymentCurrencySchema,
  type: z.nativeEnum(PaymentType, {
    errorMap: () => ({ message: 'Invalid payment type' }),
  }).default(PaymentType.REGULAR_PAYMENT),
  payer: PayerValidationSchema,
  planType: z.nativeEnum(PlanType, {
    errorMap: () => ({ message: 'Plan type must be basic or premium' }),
  }),
  description: z.string().max(255, 'Description too long').optional(),
  externalReference: ExternalReferenceSchema,
  installments: z.number()
    .int('Installments must be a whole number')
    .min(1, 'Installments must be at least 1')
    .max(12, 'Maximum 12 installments allowed')
    .optional(),
  metadata: z.record(z.unknown()).optional(),
  deviceId: z.string().max(255, 'Device ID too long').optional(),
  ipAddress: z.string()
    .ip('Invalid IP address format')
    .optional(),
});

// Payment update validation
export const UpdatePaymentSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  installments: z.number().int().min(1).max(12).optional(),
  profileId: z.string().uuid('Invalid profile ID format').optional(),
  description: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
  externalId: z.string().max(255).optional(),
  preferenceId: z.string().max(255).optional(),
}).strict();

// Refund validation
export const RefundRequestSchema = z.object({
  amount: z.number()
    .positive('Refund amount must be positive')
    .optional(), // If not provided, refund full amount
  reason: z.string()
    .min(3, 'Refund reason must have at least 3 characters')
    .max(500, 'Refund reason too long')
    .optional(),
});

// MercadoPago webhook validation
export const MercadoPagoWebhookSchema = z.object({
  id: z.string().min(1, 'Webhook ID is required'),
  type: z.string().min(1, 'Webhook type is required'),
  action: z.string().min(1, 'Webhook action is required'),
  api_version: z.string().min(1, 'API version is required'),
  date_created: z.string().datetime('Invalid date format'),
  user_id: z.number().int('User ID must be an integer'),
  live_mode: z.boolean(),
  data: z.object({
    id: z.string().min(1, 'Payment ID is required'),
  }),
});

// MercadoPago payment validation
export const MercadoPagoPaymentValidationSchema = z.object({
  id: z.number().int().positive('Payment ID must be a positive integer'),
  date_created: z.string().datetime('Invalid creation date'),
  date_approved: z.string().datetime('Invalid approval date').optional(),
  date_last_updated: z.string().datetime('Invalid update date'),
  status: z.string().min(1, 'Payment status is required'),
  status_detail: z.string().optional(),
  currency_id: z.string()
    .regex(/^[A-Z]{3}$/, 'Invalid currency format'),
  description: z.string().optional(),
  live_mode: z.boolean(),
  payment_method_id: z.string().min(1, 'Payment method is required'),
  payment_type_id: z.string().min(1, 'Payment type is required'),
  transaction_amount: z.number().positive('Transaction amount must be positive'),
  transaction_amount_refunded: z.number().min(0).optional(),
  installments: z.number().int().min(1).optional(),
  external_reference: z.string().optional(),
  payer: z.object({
    id: z.string().optional(),
    email: z.string().email().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    identification: z.object({
      type: z.string(),
      number: z.string(),
    }).optional(),
  }),
  metadata: z.record(z.unknown()).optional(),
  fee_details: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    fee_payer: z.string(),
  })).optional(),
  refunds: z.array(z.object({
    id: z.number().int(),
    payment_id: z.number().int(),
    amount: z.number().positive(),
    status: z.string(),
    reason: z.string().optional(),
    date_created: z.string().datetime(),
  })).optional(),
});

// Payment query/filter validation
export const PaymentQuerySchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  profileId: z.string().uuid().optional(),
  externalReference: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
}).refine(
  (data) => !data.dateTo || !data.dateFrom || data.dateTo >= data.dateFrom,
  {
    message: 'End date must be after start date',
    path: ['dateTo'],
  }
);

// Payment statistics validation
export const PaymentStatsQuerySchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
}).refine(
  (data) => data.dateTo >= data.dateFrom,
  {
    message: 'End date must be after start date',
    path: ['dateTo'],
  }
);

// Business rule validators
export class PaymentValidators {
  /**
   * Validates if payment can be refunded
   */
  static canRefund(payment: PaymentData): { valid: boolean; reason?: string } {
    if (payment.status !== PaymentStatus.APPROVED) {
      return {
        valid: false,
        reason: 'Only approved payments can be refunded',
      };
    }

    const totalRefunded = payment.refunds?.reduce(
      (sum, refund) => (refund.status === RefundStatus.APPROVED ? sum + refund.amount : sum),
      0
    ) || 0;

    if (totalRefunded >= payment.amount) {
      return {
        valid: false,
        reason: 'Payment has already been fully refunded',
      };
    }

    // Check if payment is older than 180 days (MercadoPago limit)
    const paymentAge = Date.now() - payment.createdAt.getTime();
    const maxAge = 180 * 24 * 60 * 60 * 1000; // 180 days in milliseconds

    if (paymentAge > maxAge) {
      return {
        valid: false,
        reason: 'Payment is too old to be refunded (180 days limit)',
      };
    }

    return { valid: true };
  }

  /**
   * Validates refund amount
   */
  static validateRefundAmount(
    payment: PaymentData,
    refundAmount: number
  ): { valid: boolean; reason?: string } {
    if (refundAmount <= 0) {
      return { valid: false, reason: 'Refund amount must be positive' };
    }

    const totalRefunded = payment.refunds?.reduce(
      (sum, refund) => (refund.status === RefundStatus.APPROVED ? sum + refund.amount : sum),
      0
    ) || 0;

    if (totalRefunded + refundAmount > payment.amount) {
      return {
        valid: false,
        reason: 'Refund amount exceeds remaining refundable amount',
      };
    }

    return { valid: true };
  }

  /**
   * Validates payment state transition
   */
  static canTransitionTo(
    currentStatus: PaymentStatus,
    newStatus: PaymentStatus
  ): { valid: boolean; reason?: string } {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [
        PaymentStatus.PROCESSING,
        PaymentStatus.AUTHORIZED,
        PaymentStatus.APPROVED,
        PaymentStatus.REJECTED,
        PaymentStatus.CANCELLED,
      ],
      [PaymentStatus.PROCESSING]: [
        PaymentStatus.APPROVED,
        PaymentStatus.REJECTED,
        PaymentStatus.CANCELLED,
        PaymentStatus.IN_PROCESS,
        PaymentStatus.IN_MEDIATION,
      ],
      [PaymentStatus.AUTHORIZED]: [
        PaymentStatus.APPROVED,
        PaymentStatus.CANCELLED,
      ],
      [PaymentStatus.IN_PROCESS]: [
        PaymentStatus.APPROVED,
        PaymentStatus.REJECTED,
        PaymentStatus.IN_MEDIATION,
      ],
      [PaymentStatus.IN_MEDIATION]: [
        PaymentStatus.APPROVED,
        PaymentStatus.REJECTED,
      ],
      [PaymentStatus.APPROVED]: [
        PaymentStatus.REFUNDED,
        PaymentStatus.CHARGED_BACK,
      ],
      [PaymentStatus.REJECTED]: [],
      [PaymentStatus.CANCELLED]: [],
      [PaymentStatus.REFUNDED]: [],
      [PaymentStatus.CHARGED_BACK]: [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates if payment metadata is within acceptable limits
   */
  static validateMetadata(metadata: Record<string, unknown>): { valid: boolean; reason?: string } {
    const maxKeys = 20;
    const maxValueSize = 1024; // 1KB per value
    const maxTotalSize = 5120; // 5KB total

    const keys = Object.keys(metadata);
    if (keys.length > maxKeys) {
      return {
        valid: false,
        reason: `Too many metadata keys (max: ${maxKeys})`,
      };
    }

    let totalSize = 0;
    for (const [key, value] of Object.entries(metadata)) {
      const valueStr = JSON.stringify(value);
      const keyValueSize = key.length + valueStr.length;
      
      if (keyValueSize > maxValueSize) {
        return {
          valid: false,
          reason: `Metadata entry '${key}' too large (max: ${maxValueSize} chars)`,
        };
      }
      
      totalSize += keyValueSize;
    }

    if (totalSize > maxTotalSize) {
      return {
        valid: false,
        reason: `Total metadata size too large (max: ${maxTotalSize} chars)`,
      };
    }

    return { valid: true };
  }
}

/**
 * CPF validation algorithm
 */
function validateCPF(cpf: string): boolean {
  // Remove any non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleanCPF[9]) !== firstCheckDigit) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = sum % 11;
  const secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleanCPF[10]) !== secondCheckDigit) return false;
  
  return true;
}

// Type exports for the validated schemas
export type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentData = z.infer<typeof UpdatePaymentSchema>;
export type RefundRequestData = z.infer<typeof RefundRequestSchema>;
export type PaymentQueryData = z.infer<typeof PaymentQuerySchema>;
export type PaymentStatsQueryData = z.infer<typeof PaymentStatsQuerySchema>;
export type MercadoPagoWebhookData = z.infer<typeof MercadoPagoWebhookSchema>;
export type ValidatedMercadoPagoPayment = z.infer<typeof MercadoPagoPaymentValidationSchema>;