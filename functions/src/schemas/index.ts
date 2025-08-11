import { z } from "zod";

// Emergency contact schema
export const EmergencyContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  relationship: z.string().min(1),
});

// User profile schema
export const UserProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  age: z.number().min(1).max(150),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).min(1),
  planType: z.enum(["basic", "premium"]),
  planPrice: z.number(),
  uniqueUrl: z.string().optional(),
  paymentId: z.string().optional(),
  qrCodeData: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Payment webhook schema
export const MercadoPagoWebhookSchema = z.object({
  id: z.string(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  user_id: z.string().optional(),
  api_version: z.string().optional(),
  action: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

// Payment creation request
export const PaymentRequestSchema = z.object({
  planType: z.enum(["basic", "premium"]),
  userData: UserProfileSchema.omit({ 
    uniqueUrl: true, 
    paymentId: true, 
    qrCodeData: true,
    createdAt: true,
    updatedAt: true 
  }),
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type MercadoPagoWebhook = z.infer<typeof MercadoPagoWebhookSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;