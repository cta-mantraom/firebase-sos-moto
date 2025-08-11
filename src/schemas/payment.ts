import { z } from "zod";

// Payment plan schema
export const PaymentPlanSchema = z.enum(["basic", "premium"]);

// Payment status schema
export const PaymentStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "in_process",
  "refunded",
]);

// Payment creation request schema
export const PaymentRequestSchema = z.object({
  planType: PaymentPlanSchema,
  userData: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
});

// MercadoPago webhook notification schema
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

export type PaymentPlan = z.infer<typeof PaymentPlanSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type MercadoPagoWebhook = z.infer<typeof MercadoPagoWebhookSchema>;