import { z } from 'zod';
import {
  ProfileStatus,
  PlanType,
  BloodType,
  PersonalData,
  MedicalData,
  EmergencyContact,
  VehicleData,
  ProfileData,
  ProfileSearchFilters,
  ProfileUpdateData,
  PersonalDataSchema,
  MedicalDataSchema,
  EmergencyContactSchema,
  VehicleDataSchema,
  ProfileDataSchema,
} from './profile.types.js';

/**
 * Profile Domain Validators
 * 
 * This module provides comprehensive validation schemas for profile-related data.
 * All validations follow strict TypeScript guidelines with no "any" types.
 */

// Enhanced validation schemas with custom business rules


export const PhoneValidationSchema = z.string()
  .regex(/^\d{10,11}$/, 'Phone must be 10 or 11 digits')
  .refine(validatePhone, 'Invalid phone number format');

export const ZipCodeValidationSchema = z.string()
  .regex(/^\d{8}$/, 'ZIP code must be exactly 8 digits')
  .refine(validateZipCode, 'Invalid ZIP code format');

export const LicensePlateValidationSchema = z.string()
  .regex(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/, 'License plate must follow Brazilian format (ABC1D23)')
  .refine(validateLicensePlate, 'Invalid license plate format');

// Extended personal data validation
export const ExtendedPersonalDataSchema = PersonalDataSchema.extend({
  phone: PhoneValidationSchema,
  address: z.object({
    street: z.string()
      .min(3, 'Street name must have at least 3 characters')
      .max(100, 'Street name too long'),
    number: z.string()
      .min(1, 'Address number is required')
      .max(10, 'Address number too long'),
    complement: z.string()
      .max(50, 'Complement too long')
      .optional(),
    neighborhood: z.string()
      .min(2, 'Neighborhood must have at least 2 characters')
      .max(50, 'Neighborhood name too long'),
    city: z.string()
      .min(2, 'City must have at least 2 characters')
      .max(50, 'City name too long'),
    state: z.string()
      .length(2, 'State must be exactly 2 characters')
      .regex(/^[A-Z]{2}$/, 'State must be in uppercase format'),
    zipCode: ZipCodeValidationSchema,
  }),
}).refine(validateAge, {
  message: 'Person must be at least 18 years old',
  path: ['birthDate'],
});

// Extended medical data validation
export const ExtendedMedicalDataSchema = MedicalDataSchema.extend({
  allergies: z.array(z.string().min(2, 'Allergy description too short'))
    .max(10, 'Too many allergies listed')
    .default([]),
  medications: z.array(z.string().min(2, 'Medication name too short'))
    .max(15, 'Too many medications listed')
    .default([]),
  medicalConditions: z.array(z.string().min(2, 'Medical condition description too short'))
    .max(10, 'Too many medical conditions listed')
    .default([]),
  emergencyNotes: z.string()
    .max(500, 'Emergency notes too long')
    .optional(),
}).refine(validateMedicalData, {
  message: 'Invalid medical data combination',
});

// Extended emergency contact validation
export const ExtendedEmergencyContactSchema = EmergencyContactSchema.extend({
  phone: PhoneValidationSchema,
  relationship: z.string()
    .min(2, 'Relationship must have at least 2 characters')
    .max(30, 'Relationship description too long')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Relationship can only contain letters'),
}).refine(validateEmergencyContactData, {
  message: 'Invalid emergency contact data',
});

// Extended vehicle data validation
export const ExtendedVehicleDataSchema = VehicleDataSchema.extend({
  licensePlate: LicensePlateValidationSchema,
  year: z.number()
    .min(1990, 'Vehicle year too old')
    .max(new Date().getFullYear() + 1, 'Invalid future vehicle year'),
}).refine(validateVehicleData, {
  message: 'Invalid vehicle data combination',
});

// Profile creation validation
export const CreateProfileSchema = z.object({
  personalData: ExtendedPersonalDataSchema,
  medicalData: ExtendedMedicalDataSchema,
  emergencyContacts: z.array(ExtendedEmergencyContactSchema)
    .min(1, 'At least 1 emergency contact is required')
    .max(3, 'Maximum 3 emergency contacts allowed'),
  vehicleData: ExtendedVehicleDataSchema.optional(),
  planType: z.nativeEnum(PlanType, {
    errorMap: () => ({ message: 'Invalid plan type' }),
  }),
}).refine(validateProfileCreation, {
  message: 'Invalid profile configuration',
});

// Base schemas without effects for partial operations
const BasePersonalDataSchema = PersonalDataSchema.extend({
  phone: z.string(),
  address: z.object({
    street: z.string()
      .min(3, 'Street name must have at least 3 characters')
      .max(100, 'Street name too long'),
    number: z.string()
      .min(1, 'Street number is required')
      .max(10, 'Street number too long'),
    neighborhood: z.string()
      .min(2, 'Neighborhood must have at least 2 characters')
      .max(50, 'Neighborhood name too long'),
    city: z.string()
      .min(2, 'City must have at least 2 characters')
      .max(50, 'City name too long'),
    state: z.string()
      .length(2, 'State must be exactly 2 characters')
      .toUpperCase(),
    zipCode: z.string()
      .regex(/^\d{5}-?\d{3}$/, 'Invalid ZIP code format'),
    complement: z.string()
      .max(100, 'Complement too long')
      .optional(),
  }),
});

const BaseMedicalDataSchema = MedicalDataSchema.extend({
  bloodType: z.nativeEnum(BloodType),
  organDonor: z.boolean().default(false),
});

// Profile update validation
export const UpdateProfileSchema = z.object({
  personalData: BasePersonalDataSchema.partial().optional(),
  medicalData: BaseMedicalDataSchema.partial().optional(),
  emergencyContacts: z.array(ExtendedEmergencyContactSchema)
    .min(1, 'At least 1 emergency contact is required')
    .max(3, 'Maximum 3 emergency contacts allowed')
    .optional(),
  vehicleData: ExtendedVehicleDataSchema.optional(),
  status: z.nativeEnum(ProfileStatus).optional(),
}).refine(validateProfileUpdate, {
  message: 'Invalid profile update data',
});

// Profile query validation
export const ProfileQuerySchema = z.object({
  status: z.nativeEnum(ProfileStatus).optional(),
  planType: z.nativeEnum(PlanType).optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  searchTerm: z.string()
    .min(2, 'Search term must have at least 2 characters')
    .max(50, 'Search term too long')
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
}).refine(
  (data) => !data.createdTo || !data.createdFrom || data.createdTo >= data.createdFrom,
  {
    message: 'End date must be after start date',
    path: ['createdTo'],
  }
);

// Memorial data validation
export const MemorialDataValidationSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid birth date format'),
  bloodType: z.nativeEnum(BloodType),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  emergencyContacts: z.array(z.object({
    name: z.string().min(2),
    phone: PhoneValidationSchema,
    relationship: z.string().min(2),
  })).min(1).max(3),
  qrCodeUrl: z.string().url('Invalid QR code URL'),
  vehicleInfo: z.string().optional(),
});

// Bulk operation validation
export const BulkProfileOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete'], {
    errorMap: () => ({ message: 'Invalid bulk operation type' }),
  }),
  profileIds: z.array(z.string().min(1))
    .min(1, 'At least 1 profile ID is required')
    .max(50, 'Too many profiles for bulk operation'),
  reason: z.string()
    .min(3, 'Reason must have at least 3 characters')
    .max(200, 'Reason too long')
    .optional(),
});

// Business rule validators
export class ProfileValidators {
  /**
   * Validates if emergency contacts are valid and not duplicated
   */
  static validateEmergencyContacts(
    contacts: EmergencyContact[],
    personalPhone?: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const phoneNumbers = new Set<string>();
    let primaryCount = 0;

    // Check each contact
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // Check for duplicate phones
      if (phoneNumbers.has(contact.phone)) {
        errors.push(`Duplicate phone number found: ${contact.phone}`);
      } else {
        phoneNumbers.add(contact.phone);
      }

      // Check if phone matches personal phone
      if (personalPhone && contact.phone === personalPhone) {
        errors.push(`Emergency contact phone cannot match personal phone: ${contact.phone}`);
      }

      // Count primary contacts
      if (contact.isPrimary) {
        primaryCount++;
      }

      // Validate relationship
      if (contact.relationship.toLowerCase() === 'self' || 
          contact.relationship.toLowerCase() === 'próprio' ||
          contact.relationship.toLowerCase() === 'eu mesmo') {
        errors.push(`Emergency contact cannot be self: ${contact.name}`);
      }
    }

    // Check primary contact rules
    if (primaryCount === 0) {
      errors.push('At least one emergency contact must be marked as primary');
    } else if (primaryCount > 1) {
      errors.push('Only one emergency contact can be marked as primary');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates profile transition rules
   */
  static validateStatusTransition(
    currentStatus: ProfileStatus,
    newStatus: ProfileStatus
  ): { valid: boolean; reason?: string } {
    const validTransitions: Record<ProfileStatus, ProfileStatus[]> = {
      [ProfileStatus.PENDING]: [
        ProfileStatus.PAYMENT_PENDING,
        ProfileStatus.PROCESSING_FAILED,
      ],
      [ProfileStatus.PAYMENT_PENDING]: [
        ProfileStatus.PAYMENT_APPROVED,
        ProfileStatus.PROCESSING_FAILED,
      ],
      [ProfileStatus.PAYMENT_APPROVED]: [
        ProfileStatus.ACTIVE,
        ProfileStatus.PROCESSING_FAILED,
      ],
      [ProfileStatus.ACTIVE]: [
        ProfileStatus.INACTIVE,
      ],
      [ProfileStatus.INACTIVE]: [
        ProfileStatus.ACTIVE,
      ],
      [ProfileStatus.PROCESSING_FAILED]: [
        ProfileStatus.PENDING,
        ProfileStatus.PAYMENT_PENDING,
      ],
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
   * Validates plan type requirements
   */
  static validatePlanRequirements(
    planType: PlanType,
    vehicleData?: VehicleData
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (planType === PlanType.PREMIUM && !vehicleData) {
      errors.push('Vehicle data is required for premium plans');
    }

    if (planType === PlanType.BASIC && vehicleData) {
      // Warning, not error - basic plan can have vehicle data but it won't be displayed
      // This is for future upgrade scenarios
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates profile completeness
   */
  static validateProfileCompleteness(profile: ProfileData): { 
    valid: boolean; 
    completeness: number; 
    missingFields: string[] 
  } {
    const missingFields: string[] = [];
    let totalFields = 0;
    let completedFields = 0;

    // Personal data fields
    const personalFields = [
      'name', 'surname', 'birthDate', 'phone', 'email',
      'address.street', 'address.number', 'address.neighborhood', 
      'address.city', 'address.state', 'address.zipCode'
    ];
    
    totalFields += personalFields.length;
    personalFields.forEach(field => {
      const value = getNestedValue(profile.personalData, field);
      if (value && value !== '') {
        completedFields++;
      } else {
        missingFields.push(`personalData.${field}`);
      }
    });

    // Medical data fields
    const medicalFields = ['bloodType'];
    totalFields += medicalFields.length;
    medicalFields.forEach(field => {
      const value = getNestedValue(profile.medicalData, field);
      if (value && value !== '') {
        completedFields++;
      } else {
        missingFields.push(`medicalData.${field}`);
      }
    });

    // Emergency contacts (at least one)
    totalFields += 1;
    if (profile.emergencyContacts && profile.emergencyContacts.length > 0) {
      completedFields++;
    } else {
      missingFields.push('emergencyContacts');
    }

    // Vehicle data for premium plans
    if (profile.planType === PlanType.PREMIUM) {
      const vehicleFields = ['brand', 'model', 'year', 'color', 'licensePlate'];
      totalFields += vehicleFields.length;
      
      if (profile.vehicleData) {
        vehicleFields.forEach(field => {
          const value = getNestedValue(profile.vehicleData as Record<string, unknown>, field);
          if (value && value !== '') {
            completedFields++;
          } else {
            missingFields.push(`vehicleData.${field}`);
          }
        });
      } else {
        missingFields.push('vehicleData');
      }
    }

    const completeness = Math.round((completedFields / totalFields) * 100);

    return {
      valid: missingFields.length === 0,
      completeness,
      missingFields,
    };
  }

  /**
   * Validates if profile data meets age requirements
   */
  static validateAgeRequirements(birthDate: string): { 
    valid: boolean; 
    age: number; 
    reason?: string 
  } {
    const birth = new Date(birthDate);
    const today = new Date();
    
    if (birth > today) {
      return {
        valid: false,
        age: 0,
        reason: 'Birth date cannot be in the future',
      };
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 18) {
      return {
        valid: false,
        age,
        reason: 'Profile holder must be at least 18 years old',
      };
    }

    if (age > 100) {
      return {
        valid: false,
        age,
        reason: 'Invalid age - exceeds 100 years',
      };
    }

    return { valid: true, age };
  }

  /**
   * Validates memorial data access permissions
   */
  static validateMemorialAccess(
    profileStatus: ProfileStatus,
    requestType: 'view' | 'edit' | 'emergency'
  ): { valid: boolean; reason?: string } {
    switch (requestType) {
      case 'emergency':
        // Emergency access allowed for all active and payment approved profiles
        if ([ProfileStatus.ACTIVE, ProfileStatus.PAYMENT_APPROVED].includes(profileStatus)) {
          return { valid: true };
        }
        return {
          valid: false,
          reason: 'Memorial emergency access requires active or payment approved profile',
        };

      case 'view':
        // View access for active profiles only
        if (profileStatus === ProfileStatus.ACTIVE) {
          return { valid: true };
        }
        return {
          valid: false,
          reason: 'Memorial view access requires active profile',
        };

      case 'edit':
        // Edit access only for active profiles
        if (profileStatus === ProfileStatus.ACTIVE) {
          return { valid: true };
        }
        return {
          valid: false,
          reason: 'Memorial edit access requires active profile',
        };

      default:
        return {
          valid: false,
          reason: 'Invalid access request type',
        };
    }
  }
}

// Helper functions


/**
 * Validates Brazilian phone number format
 */
function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Mobile phones: 11 digits (including area code)
  // Landline phones: 10 digits (including area code)
  if (cleanPhone.length === 11) {
    // Mobile phone validation
    const areaCode = cleanPhone.substring(0, 2);
    const firstDigit = cleanPhone.substring(2, 3);
    
    // Area codes should be valid
    const validAreaCodes = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99', // MA
    ];
    
    if (!validAreaCodes.includes(areaCode)) return false;
    
    // First digit for mobile should be 9
    if (firstDigit !== '9') return false;
    
    return true;
  } else if (cleanPhone.length === 10) {
    // Landline phone validation
    const areaCode = cleanPhone.substring(0, 2);
    const firstDigit = cleanPhone.substring(2, 3);
    
    // Same area code validation as above
    const validAreaCodes = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38',
      '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55',
      '61', '62', '64', '63', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77',
      '79', '81', '87', '82', '83', '84', '85', '88', '86', '89', '91', '93', '94',
      '92', '97', '95', '96', '98', '99',
    ];
    
    if (!validAreaCodes.includes(areaCode)) return false;
    
    // First digit for landline should be 2-5
    if (!['2', '3', '4', '5'].includes(firstDigit)) return false;
    
    return true;
  }
  
  return false;
}

/**
 * Validates Brazilian ZIP code
 */
function validateZipCode(zipCode: string): boolean {
  const cleanZip = zipCode.replace(/\D/g, '');
  return cleanZip.length === 8 && /^\d{8}$/.test(cleanZip);
}

/**
 * Validates Brazilian license plate
 */
function validateLicensePlate(plate: string): boolean {
  // New Mercosur format: ABC1D23 or old format: ABC1234
  const mercosurPattern = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;
  const oldPattern = /^[A-Z]{3}\d{4}$/;
  
  return mercosurPattern.test(plate) || oldPattern.test(plate);
}

/**
 * Validates age from birth date
 */
function validateAge(data: { birthDate: string }): boolean {
  const result = ProfileValidators.validateAgeRequirements(data.birthDate);
  return result.valid;
}

/**
 * Validates medical data consistency
 */
function validateMedicalData(data: MedicalData): boolean {
  // Check for conflicting information
  if (data.organDonor && data.medicalConditions.some(condition => 
    condition.toLowerCase().includes('hepatite') ||
    condition.toLowerCase().includes('hiv') ||
    condition.toLowerCase().includes('cancer')
  )) {
    // This might be a warning rather than an error in real scenarios
    // For now, we allow it but it could be flagged for review
  }
  
  return true;
}

/**
 * Validates emergency contact data
 */
function validateEmergencyContactData(contact: EmergencyContact): boolean {
  // Contact name cannot be generic terms
  const invalidNames = ['emergency', 'contact', 'unknown', 'n/a', 'não informado'];
  const nameWords = contact.name.toLowerCase().split(' ');
  
  for (const invalidName of invalidNames) {
    if (nameWords.includes(invalidName)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates vehicle data consistency
 */
function validateVehicleData(data: VehicleData): boolean {
  const currentYear = new Date().getFullYear();
  
  // Future vehicle years are only allowed for the next year (pre-orders)
  if (data.year > currentYear + 1) {
    return false;
  }
  
  // Very old vehicles might need special consideration
  if (data.year < 1990) {
    // Could be a classic vehicle, allow but might need verification
  }
  
  return true;
}

/**
 * Validates profile creation rules
 */
function validateProfileCreation(data: {
  planType: PlanType;
  vehicleData?: VehicleData;
  emergencyContacts: EmergencyContact[];
  personalData: PersonalData;
}): boolean {
  // Premium plan requires vehicle data
  if (data.planType === PlanType.PREMIUM && !data.vehicleData) {
    return false;
  }
  
  // Validate emergency contacts don't conflict with personal data
  const personalPhone = data.personalData.phone;
  const hasPhoneConflict = data.emergencyContacts.some(
    contact => contact.phone === personalPhone
  );
  
  if (hasPhoneConflict) {
    return false;
  }
  
  return true;
}

/**
 * Validates profile update rules
 */
function validateProfileUpdate(data: unknown): boolean {
  const typedData = data as {
    personalData?: Partial<PersonalData>;
    vehicleData?: VehicleData;
    emergencyContacts?: EmergencyContact[];
  };
  // If updating phone and emergency contacts, ensure no conflicts
  if (typedData.personalData?.phone && typedData.emergencyContacts) {
    for (const contact of typedData.emergencyContacts) {
      if (contact.phone === typedData.personalData.phone) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Gets nested object value by dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

// Type exports for the validated schemas
export type CreateProfileData = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
export type ProfileQueryData = z.infer<typeof ProfileQuerySchema>;
export type MemorialDataValidation = z.infer<typeof MemorialDataValidationSchema>;
export type BulkProfileOperation = z.infer<typeof BulkProfileOperationSchema>;