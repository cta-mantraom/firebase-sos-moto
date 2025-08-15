import { z } from 'zod';
import { logInfo, logError, logWarning } from '../../utils/logger';
import { ProfileRepository } from '../../repositories/profile.repository';
import { Profile } from '../../domain/profile/profile.entity';
import {
  ProfileData,
  ProfileDataSchema,
  PendingProfile,
  MemorialData,
  ValidationResult,
  ProfileStatus,
  PlanType,
  ProfileUpdateData,
  PersonalDataSchema,
  MedicalDataSchema,
  EmergencyContactSchema,
  VehicleDataSchema,
  PROFILE_EXPIRATION_HOURS,
  MAX_EMERGENCY_CONTACTS,
  MIN_EMERGENCY_CONTACTS,
} from '../../domain/profile/profile.types';
import { generateUniqueUrl } from '../../utils/ids';

export interface ProfileServiceConfig {
  maxRetries: number;
  cacheEnabled: boolean;
}

export class ProfileService {
  private readonly profileRepository: ProfileRepository;
  private readonly config: ProfileServiceConfig;

  constructor(
    profileRepository: ProfileRepository,
    config?: Partial<ProfileServiceConfig>
  ) {
    this.profileRepository = profileRepository;
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      cacheEnabled: config?.cacheEnabled ?? true,
    };
  }

  /**
   * Cria um novo perfil
   */
  async createProfile(data: ProfileData): Promise<Profile> {
    try {
      // Validar dados de entrada
      const validatedData = ProfileDataSchema.parse(data);

      // Validar dados médicos
      const medicalValidation = await this.validateMedicalData(validatedData.medicalData);
      if (!medicalValidation.isValid) {
        throw new Error(`Medical data validation failed: ${medicalValidation.errors?.join(', ')}`);
      }

      // Validar contatos de emergência
      if (validatedData.emergencyContacts.length < MIN_EMERGENCY_CONTACTS) {
        throw new Error(`At least ${MIN_EMERGENCY_CONTACTS} emergency contact is required`);
      }
      if (validatedData.emergencyContacts.length > MAX_EMERGENCY_CONTACTS) {
        throw new Error(`Maximum ${MAX_EMERGENCY_CONTACTS} emergency contacts allowed`);
      }

      // Garantir que há pelo menos um contato primário
      const hasPrimaryContact = validatedData.emergencyContacts.some(c => c.isPrimary);
      if (!hasPrimaryContact) {
        validatedData.emergencyContacts[0].isPrimary = true;
      }

      // Criar entidade de perfil
      const profile = new Profile(
        validatedData.uniqueUrl,
        validatedData.personalData,
        validatedData.medicalData,
        validatedData.emergencyContacts,
        validatedData.planType,
        validatedData.vehicleData
      );

      // Validar entidade
      if (!profile.isValid()) {
        throw new Error('Profile entity validation failed');
      }

      // Salvar no repositório
      await this.profileRepository.save(profile);

      logInfo('Profile created successfully', {
        uniqueUrl: profile.uniqueUrl,
        planType: profile.planType,
      });

      return profile;
    } catch (error) {
      logError('Failed to create profile', error as Error, {
        uniqueUrl: data.uniqueUrl,
      });
      throw error;
    }
  }

  /**
   * Busca um perfil pela URL única
   */
  async getProfile(uniqueUrl: string): Promise<Profile | null> {
    try {
      logInfo('Fetching profile', { uniqueUrl });

      const profile = await this.profileRepository.findByUniqueUrl(uniqueUrl);

      if (!profile) {
        logWarning('Profile not found', { uniqueUrl });
        return null;
      }

      // Validar se o perfil está ativo
      if (profile.status === ProfileStatus.INACTIVE) {
        logWarning('Profile is inactive', { uniqueUrl });
        return null;
      }

      return profile;
    } catch (error) {
      logError('Failed to get profile', error as Error, { uniqueUrl });
      throw error;
    }
  }

  /**
   * Busca um perfil pendente
   */
  async getPendingProfile(uniqueUrl: string): Promise<PendingProfile | null> {
    try {
      const pendingProfile = await this.profileRepository.findPendingProfile(uniqueUrl);

      if (!pendingProfile) {
        return null;
      }

      // Verificar se não expirou
      if (pendingProfile.expiresAt < new Date()) {
        logWarning('Pending profile expired', {
          uniqueUrl,
          expiresAt: pendingProfile.expiresAt.toISOString(),
        });
        return null;
      }

      return pendingProfile;
    } catch (error) {
      logError('Failed to get pending profile', error as Error, { uniqueUrl });
      throw error;
    }
  }

  /**
   * Atualiza um perfil existente
   */
  async updateProfile(
    uniqueUrl: string,
    data: ProfileUpdateData
  ): Promise<void> {
    try {
      const profile = await this.getProfile(uniqueUrl);
      if (!profile) {
        throw new Error(`Profile not found: ${uniqueUrl}`);
      }

      // Validar dados de atualização
      if (data.personalData) {
        const partialSchema = PersonalDataSchema.partial();
        partialSchema.parse(data.personalData);
      }

      if (data.medicalData) {
        const partialSchema = MedicalDataSchema.partial();
        partialSchema.parse(data.medicalData);
        
        // Validar dados médicos atualizados
        const mergedMedicalData = { ...profile.medicalData, ...data.medicalData };
        const validation = await this.validateMedicalData(mergedMedicalData);
        if (!validation.isValid) {
          throw new Error(`Medical data validation failed: ${validation.errors?.join(', ')}`);
        }
      }

      if (data.emergencyContacts) {
        // Validar contatos de emergência
        data.emergencyContacts.forEach(contact => {
          EmergencyContactSchema.parse(contact);
        });
        
        if (data.emergencyContacts.length < MIN_EMERGENCY_CONTACTS ||
            data.emergencyContacts.length > MAX_EMERGENCY_CONTACTS) {
          throw new Error(`Emergency contacts must be between ${MIN_EMERGENCY_CONTACTS} and ${MAX_EMERGENCY_CONTACTS}`);
        }
      }

      if (data.vehicleData) {
        const partialSchema = VehicleDataSchema.partial();
        partialSchema.parse(data.vehicleData);
      }

      // Aplicar atualizações
      await this.profileRepository.update(uniqueUrl, data);

      logInfo('Profile updated successfully', {
        uniqueUrl,
        updatedFields: Object.keys(data),
      });
    } catch (error) {
      logError('Failed to update profile', error as Error, {
        uniqueUrl,
      });
      throw error;
    }
  }

  /**
   * Valida dados médicos
   */
  async validateMedicalData(data: unknown): Promise<ValidationResult> {
    try {
      const medicalData = MedicalDataSchema.parse(data);
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validar tipo sanguíneo
      if (!medicalData.bloodType) {
        errors.push('Blood type is required');
      }

      // Validar alergias
      if (medicalData.allergies.length > 10) {
        warnings.push('Too many allergies listed. Consider listing only the most important ones');
      }

      // Validar medicações
      if (medicalData.medications.length > 15) {
        warnings.push('Too many medications listed. Consider listing only current medications');
      }

      // Validar condições médicas
      if (medicalData.medicalConditions.length > 10) {
        warnings.push('Too many medical conditions listed. Consider listing only active conditions');
      }

      // Validar notas de emergência
      if (medicalData.emergencyNotes && medicalData.emergencyNotes.length > 500) {
        errors.push('Emergency notes must be less than 500 characters');
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        return {
          isValid: false,
          errors,
        };
      }
      throw error;
    }
  }

  /**
   * Transforma perfil em dados do memorial
   */
  transformToMemorialData(profile: Profile): MemorialData {
    const vehicleInfo = profile.vehicleData
      ? `${profile.vehicleData.brand} ${profile.vehicleData.model} ${profile.vehicleData.year} - ${profile.vehicleData.licensePlate}`
      : undefined;

    return {
      name: `${profile.personalData.name} ${profile.personalData.surname}`,
      birthDate: profile.personalData.birthDate,
      bloodType: profile.medicalData.bloodType,
      allergies: profile.medicalData.allergies,
      medications: profile.medicalData.medications,
      emergencyContacts: profile.emergencyContacts.map(c => ({
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
      })),
      qrCodeUrl: profile.qrCodeUrl || '',
      vehicleInfo,
    };
  }

  /**
   * Cria um perfil pendente para pagamento
   */
  async createPendingProfile(
    profileData: Omit<ProfileData, 'status' | 'uniqueUrl'>,
    userId: string
  ): Promise<PendingProfile> {
    try {
      const uniqueUrl = generateUniqueUrl();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + PROFILE_EXPIRATION_HOURS);

      const pendingProfile: PendingProfile = {
        ...profileData,
        uniqueUrl,
        status: ProfileStatus.PENDING,
        userId,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.profileRepository.savePendingProfile(pendingProfile);

      logInfo('Pending profile created', {
        uniqueUrl,
        userId,
        expiresAt: expiresAt.toISOString(),
        planType: profileData.planType,
      });

      return pendingProfile;
    } catch (error) {
      logError('Failed to create pending profile', error as Error, {
        userId,
        planType: profileData.planType,
      });
      throw error;
    }
  }

  /**
   * Ativa um perfil após pagamento aprovado
   */
  async activateProfile(
    uniqueUrl: string,
    paymentId: string,
    qrCodeUrl?: string
  ): Promise<Profile> {
    try {
      const pendingProfile = await this.getPendingProfile(uniqueUrl);
      if (!pendingProfile) {
        throw new Error(`Pending profile not found: ${uniqueUrl}`);
      }

      // Criar perfil ativo
      const profileData: ProfileData = {
        ...pendingProfile,
        status: ProfileStatus.ACTIVE,
        paymentId,
        qrCodeUrl,
        memorialUrl: `${process.env.NEXT_PUBLIC_APP_URL}/memorial/${uniqueUrl}`,
        updatedAt: new Date(),
      };

      const profile = await this.createProfile(profileData);

      // Remover perfil pendente
      await this.profileRepository.deletePendingProfile(uniqueUrl);

      logInfo('Profile activated successfully', {
        uniqueUrl,
        paymentId,
        planType: profile.planType,
      });

      return profile;
    } catch (error) {
      logError('Failed to activate profile', error as Error, {
        uniqueUrl,
        paymentId,
      });
      throw error;
    }
  }

  /**
   * Desativa um perfil
   */
  async deactivateProfile(uniqueUrl: string): Promise<void> {
    try {
      await this.profileRepository.updateStatus(uniqueUrl, ProfileStatus.INACTIVE);
      
      logInfo('Profile deactivated', { uniqueUrl });
    } catch (error) {
      logError('Failed to deactivate profile', error as Error, { uniqueUrl });
      throw error;
    }
  }

  /**
   * Verifica se um perfil pode gerar QR Code
   */
  async canGenerateQRCode(uniqueUrl: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(uniqueUrl);
      if (!profile) {
        return false;
      }

      return profile.canGenerateQRCode();
    } catch (error) {
      logError('Failed to check if profile can generate QR code', error as Error, {
        uniqueUrl,
      });
      return false;
    }
  }

  /**
   * Limpa perfis pendentes expirados
   */
  async cleanupExpiredPendingProfiles(): Promise<number> {
    try {
      const count = await this.profileRepository.deleteExpiredPendingProfiles();
      
      if (count > 0) {
        logInfo('Expired pending profiles cleaned up', { count });
      }
      
      return count;
    } catch (error) {
      logError('Failed to cleanup expired pending profiles', error as Error);
      throw error;
    }
  }
}