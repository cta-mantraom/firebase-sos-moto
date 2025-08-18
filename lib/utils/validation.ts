import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
// CORRETO: Import centralized schema from domain layer (no duplicate schemas)
import { PaymentType } from '../domain/payment/payment.types';
import { PlanType } from '../domain/profile/profile.types';

// Schema para criação de pagamento com dados do perfil
export const CreatePaymentSchema = z.object({
    // Payment fields
    type: z.nativeEnum(PaymentType).default(PaymentType.REGULAR_PAYMENT),
    amount: z.number().positive(),
    currency: z.string().default('BRL'),
    payer: z.object({
        email: z.string().email(),
        name: z.string().min(2),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        surname: z.string().optional(),
        identification: z.object({
            type: z.string(),
            number: z.string(),
        }).optional(),
    }),
    planType: z.nativeEnum(PlanType),
    description: z.string().optional(),
    externalReference: z.string(),
    installments: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
    deviceId: z.string().optional(),
    ipAddress: z.string().optional(),
    // Profile fields
    name: z.string().min(2).max(100),
    age: z.number().min(18).max(120),
    phone: z.string().regex(/^(\(?[1-9]{2}\)?\s?)?9?[0-9]{4}-?[0-9]{4}$/),
    email: z.string().email(),
    selectedPlan: z.nativeEnum(PlanType),
    bloodType: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    medicalConditions: z.array(z.string()).optional(),
    emergencyContacts: z.array(z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        relationship: z.string().min(1)
    })).optional(),
    surname: z.string().optional(),
    cpf: z.string().optional(),
    birthDate: z.string().optional(),
    healthPlan: z.string().optional(),
    preferredHospital: z.string().optional(),
    medicalNotes: z.string().optional()
});

export type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;

// Schema principal do perfil (Core Layer - Centralizado)
export const ProfileSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
    age: z.number().min(18, "Idade mínima é 18 anos").max(120, "Idade máxima é 120 anos"),
    phone: z.string().regex(/^(\(?[1-9]{2}\)?\s?)?9?[0-9]{4}-?[0-9]{4}$/, "Formato de telefone inválido"),
    email: z.string().email("Email inválido"),
    plan_type: z.nativeEnum(PlanType),
    blood_type: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    medical_conditions: z.array(z.string()).optional(),
    emergency_contacts: z.array(z.object({
        name: z.string().min(1, "Nome do contato é obrigatório"),
        phone: z.string().min(1, "Telefone do contato é obrigatório"),
        relationship: z.string().min(1, "Relacionamento é obrigatório")
    })).optional()
});

// Função de validação de UUID
export function validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Função para transformar dados da API para o formato do banco
export function transformApiToProfile(apiData: CreatePaymentData): z.infer<typeof ProfileSchema> {
    return {
        name: apiData.name,
        age: apiData.age,
        phone: apiData.phone,
        email: apiData.email,
        plan_type: apiData.selectedPlan,
        blood_type: apiData.bloodType,
        allergies: apiData.allergies,
        medications: apiData.medications,
        medical_conditions: apiData.medicalConditions,
        emergency_contacts: apiData.emergencyContacts?.map(contact => ({
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship
        }))
    };
}

// HMAC validation for MercadoPago webhooks
export function validateHMACSignature(
  requestId: string,
  signature: string,
  secret: string
): boolean {
  try {
    const parts = signature.split(',');
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && key.trim() === 'v1') {
        const expectedSignature = createHmac('sha256', secret)
          .update(requestId)
          .digest('hex');
        
        return timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(value || '')
        );
      }
    }
    
    return false;
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

// Types exportados
export type Profile = z.infer<typeof ProfileSchema>;
// CreatePaymentData now imported from centralized location
