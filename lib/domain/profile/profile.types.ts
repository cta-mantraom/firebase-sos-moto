import { z } from 'zod';

// Enums
export enum PlanType {
  BASIC = 'basic',
  PREMIUM = 'premium',
}

export enum ProfileStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_APPROVED = 'payment_approved',
  PROCESSING_FAILED = 'processing_failed',
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

// Schemas de validação
export const PersonalDataSchema = z.object({
  name: z.string().min(2),
  surname: z.string().min(2),
  cpf: z.string().regex(/^\d{11}$/),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().regex(/^\d{10,11}$/),
  email: z.string().email(),
  address: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{8}$/),
  }),
});

export const MedicalDataSchema = z.object({
  bloodType: z.nativeEnum(BloodType),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  organDonor: z.boolean().default(false),
  emergencyNotes: z.string().optional(),
});

export const EmergencyContactSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  relationship: z.string(),
  phone: z.string().regex(/^\d{10,11}$/),
  isPrimary: z.boolean().default(false),
});

export const VehicleDataSchema = z.object({
  brand: z.string(),
  model: z.string(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string(),
  licensePlate: z.string().regex(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/),
});

export const ProfileDataSchema = z.object({
  uniqueUrl: z.string(),
  personalData: PersonalDataSchema,
  medicalData: MedicalDataSchema,
  emergencyContacts: z.array(EmergencyContactSchema).min(1).max(3),
  vehicleData: VehicleDataSchema.optional(),
  planType: z.nativeEnum(PlanType),
  status: z.nativeEnum(ProfileStatus).default(ProfileStatus.PENDING),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  paymentId: z.string().optional(),
  qrCodeUrl: z.string().url().optional(),
  memorialUrl: z.string().url().optional(),
});

export const PendingProfileSchema = ProfileDataSchema.extend({
  status: z.literal(ProfileStatus.PENDING),
  userId: z.string(),
  expiresAt: z.date(),
});

export const MemorialDataSchema = z.object({
  name: z.string(),
  birthDate: z.string(),
  bloodType: z.nativeEnum(BloodType),
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  })),
  qrCodeUrl: z.string().url(),
  vehicleInfo: z.string().optional(),
});

// Tipos derivados dos schemas
export type PersonalData = z.infer<typeof PersonalDataSchema>;
export type MedicalData = z.infer<typeof MedicalDataSchema>;
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type VehicleData = z.infer<typeof VehicleDataSchema>;
export type ProfileData = z.infer<typeof ProfileDataSchema>;
export type PendingProfile = z.infer<typeof PendingProfileSchema>;
export type MemorialData = z.infer<typeof MemorialDataSchema>;

// Interfaces adicionais
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ProfileSearchFilters {
  status?: ProfileStatus;
  planType?: PlanType;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface ProfileUpdateData {
  personalData?: Partial<PersonalData>;
  medicalData?: Partial<MedicalData>;
  emergencyContacts?: EmergencyContact[];
  vehicleData?: Partial<VehicleData>;
  status?: ProfileStatus;
}

// Constantes
export const PROFILE_EXPIRATION_HOURS = 24;
export const MAX_EMERGENCY_CONTACTS = 3;
export const MIN_EMERGENCY_CONTACTS = 1;

export const PLAN_PRICES = {
  [PlanType.BASIC]: 55.0,
  [PlanType.PREMIUM]: 85.0,
} as const;

export const PLAN_FEATURES = {
  [PlanType.BASIC]: [
    'QR Code de emergência',
    'Dados médicos essenciais',
    'Até 2 contatos de emergência',
    'Suporte via email',
  ],
  [PlanType.PREMIUM]: [
    'QR Code de emergência',
    'Dados médicos completos',
    'Até 3 contatos de emergência',
    'Informações do veículo',
    'Suporte prioritário',
    'Atualizações ilimitadas',
  ],
} as const;