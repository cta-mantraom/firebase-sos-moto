import { z } from "zod";

// Emergency contact schema
export const EmergencyContactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  relationship: z.string().min(1, "Parentesco é obrigatório"),
});

// User profile schema
export const UserProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  age: z.number().min(1).max(150),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).min(1, "Pelo menos um contato de emergência é obrigatório"),
  planType: z.enum(["basic", "premium"]),
  planPrice: z.number(),
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;