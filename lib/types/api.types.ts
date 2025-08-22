import { z } from 'zod';
import { PlanType, ProfileStatus } from '../domain/profile/profile.types.js';

// Request Schemas
export const CreatePaymentRequestSchema = z.object({
  selectedPlan: z.nativeEnum(PlanType),
  name: z.string().min(2),
  surname: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10,11}$/),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  age: z.number().min(1).max(120),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  emergencyContacts: z.array(z.object({
    name: z.string().min(2),
    phone: z.string().regex(/^\d{10,11}$/),
    relationship: z.string(),
    isPrimary: z.boolean().default(false),
  })).min(1).max(3),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
  deviceId: z.string().optional(),
});

export const GetProfileRequestSchema = z.object({
  id: z.string().min(1),
});

export const CheckStatusRequestSchema = z.object({
  paymentId: z.string().min(1),
});

// Response Schemas
export const PaymentResponseSchema = z.object({
  preferenceId: z.string(),
  checkoutUrl: z.string().url(),
  uniqueUrl: z.string(),
  correlationId: z.string(),
  status: z.enum(['pending', 'processing']),
});

export const ProfileResponseSchema = z.object({
  uniqueUrl: z.string(),
  name: z.string(),
  surname: z.string(),
  age: z.number(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  medicalConditions: z.array(z.string()),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  })),
  qrCodeUrl: z.string().url().optional(),
  memorialUrl: z.string().url(),
  planType: z.nativeEnum(PlanType),
  status: z.nativeEnum(ProfileStatus),
});

export const StatusResponseSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processing', 'completed', 'failed']),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  correlationId: z.string().optional(),
});

// Webhook Schemas
export const MercadoPagoWebhookSchema = z.object({
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  user_id: z.number(),
  api_version: z.string(),
  action: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

// Types derivados
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
export type GetProfileRequest = z.infer<typeof GetProfileRequestSchema>;
export type CheckStatusRequest = z.infer<typeof CheckStatusRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
export type StatusResponse = z.infer<typeof StatusResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type MercadoPagoWebhook = z.infer<typeof MercadoPagoWebhookSchema>;

// MercadoPago Preference Response Schema
export const MercadoPagoPreferenceResponseSchema = z.object({
  id: z.string(),
  init_point: z.string().url().optional(),
  sandbox_init_point: z.string().url().optional(),
  date_created: z.string().optional(),
  collector_id: z.number().optional(),
});

export type MercadoPagoPreferenceResponse = z.infer<typeof MercadoPagoPreferenceResponseSchema>;

// Headers customizados
export interface ApiHeaders {
  'X-Correlation-Id'?: string;
  'X-Idempotency-Key'?: string;
  'X-Request-Id'?: string;
  'X-Device-Id'?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}