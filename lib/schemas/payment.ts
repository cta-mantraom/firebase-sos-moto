import { z } from 'zod';

// Emergency Contact Schema
export const EmergencyContactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  relationship: z.string().min(1, "Relacionamento é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  isMain: z.boolean().default(false),
});

// Profile Schema
export const ProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  age: z.number().min(1, "Idade é obrigatória").max(120, "Idade inválida"),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional().default([]),
  medications: z.array(z.string()).optional().default([]),
  medicalConditions: z.array(z.string()).optional().default([]),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).default([]),
});

// Payment Request Schema
export const PaymentRequestSchema = z.object({
  planType: z.enum(['basic', 'premium']),
  userData: ProfileSchema,
});

// MercadoPago Webhook Schema
export const MercadoPagoWebhookSchema = z.object({
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  application_id: z.number(),
  user_id: z.number(),
  version: z.number(),
  api_version: z.string(),
  action: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type MercadoPagoWebhook = z.infer<typeof MercadoPagoWebhookSchema>;