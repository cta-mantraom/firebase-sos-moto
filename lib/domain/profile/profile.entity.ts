import { v4 as uuidv4 } from 'uuid';
import {
  ProfileData,
  ProfileStatus,
  PlanType,
  BloodType,
  PersonalData,
  MedicalData,
  EmergencyContact,
  VehicleData,
  ProfileUpdateData,
  ValidationResult,
  ProfileDataSchema,
  PersonalDataSchema,
  MedicalDataSchema,
  EmergencyContactSchema,
  VehicleDataSchema,
  PROFILE_EXPIRATION_HOURS,
  MAX_EMERGENCY_CONTACTS,
  MIN_EMERGENCY_CONTACTS,
} from './profile.types.js';
import { z } from 'zod';

/**
 * Profile Domain Entity
 * 
 * This entity represents a user profile in the SOS Moto system.
 * It encapsulates all profile-related business logic and domain rules.
 */
export class Profile {
  private readonly _uniqueUrl: string;
  private _personalData: PersonalData;
  private _medicalData: MedicalData;
  private _emergencyContacts: EmergencyContact[];
  private _vehicleData?: VehicleData;
  private readonly _planType: PlanType;
  private _status: ProfileStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _paymentId?: string;
  private _qrCodeUrl?: string;
  private _memorialUrl?: string;

  constructor(data: Partial<ProfileData>) {
    this._uniqueUrl = data.uniqueUrl || this.generateUniqueUrl();
    this._personalData = this.validatePersonalData(data.personalData);
    this._medicalData = this.validateMedicalData(data.medicalData);
    this._emergencyContacts = this.validateEmergencyContacts(data.emergencyContacts);
    this._vehicleData = data.vehicleData ? this.validateVehicleData(data.vehicleData) : undefined;
    this._planType = data.planType || PlanType.BASIC;
    this._status = data.status || ProfileStatus.PENDING;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
    this._paymentId = data.paymentId;
    this._qrCodeUrl = data.qrCodeUrl;
    this._memorialUrl = data.memorialUrl;

    this.validateDomainRules();
  }

  private generateUniqueUrl(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    return `${timestamp}_${random}`;
  }

  private validatePersonalData(data: unknown): PersonalData {
    if (!data) {
      throw new Error('Personal data is required');
    }

    const result = PersonalDataSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid personal data: ${result.error.message}`);
    }

    return result.data;
  }

  private validateMedicalData(data: unknown): MedicalData {
    if (!data) {
      throw new Error('Medical data is required');
    }

    const result = MedicalDataSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid medical data: ${result.error.message}`);
    }

    return result.data;
  }

  private validateEmergencyContacts(contacts: unknown): EmergencyContact[] {
    if (!Array.isArray(contacts)) {
      throw new Error('Emergency contacts must be an array');
    }

    if (contacts.length < MIN_EMERGENCY_CONTACTS) {
      throw new Error(`At least ${MIN_EMERGENCY_CONTACTS} emergency contact is required`);
    }

    if (contacts.length > MAX_EMERGENCY_CONTACTS) {
      throw new Error(`Maximum ${MAX_EMERGENCY_CONTACTS} emergency contacts allowed`);
    }

    const validatedContacts = contacts.map((contact, index) => {
      const result = EmergencyContactSchema.safeParse({
        ...contact,
        id: contact.id || uuidv4(),
      });
      
      if (!result.success) {
        throw new Error(`Invalid emergency contact at index ${index}: ${result.error.message}`);
      }

      return result.data;
    });

    // Ensure at least one primary contact
    const primaryContacts = validatedContacts.filter(c => c.isPrimary);
    if (primaryContacts.length === 0) {
      validatedContacts[0].isPrimary = true;
    } else if (primaryContacts.length > 1) {
      // Only keep the first one as primary
      validatedContacts.forEach((contact, index) => {
        if (index > 0) contact.isPrimary = false;
      });
    }

    return validatedContacts;
  }

  private validateVehicleData(data: unknown): VehicleData {
    const result = VehicleDataSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid vehicle data: ${result.error.message}`);
    }

    return result.data;
  }

  private validateDomainRules(): void {
    // Age validation
    const birthDate = new Date(this._personalData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Adjust age if birthday hasn't occurred this year
    }

    if (age < 18) {
      throw new Error('Profile holder must be at least 18 years old');
    }

    if (age > 100) {
      throw new Error('Invalid birth date - age exceeds 100 years');
    }

    // Vehicle data validation for premium plans
    if (this._planType === PlanType.PREMIUM && !this._vehicleData) {
      throw new Error('Vehicle data is required for premium plans');
    }

    // Emergency contacts phone uniqueness
    const phoneNumbers = this._emergencyContacts.map(c => c.phone);
    const uniquePhones = new Set(phoneNumbers);
    if (phoneNumbers.length !== uniquePhones.size) {
      throw new Error('Emergency contacts cannot have duplicate phone numbers');
    }

    // Personal phone should not be the same as emergency contacts
    const personalPhone = this._personalData.phone;
    if (phoneNumbers.includes(personalPhone)) {
      throw new Error('Emergency contact phone cannot be the same as personal phone');
    }
  }

  // Domain logic methods

  /**
   * Activates the profile after successful payment
   */
  public activate(paymentId: string): void {
    if (this._status !== ProfileStatus.PAYMENT_APPROVED) {
      throw new Error(`Cannot activate profile from status: ${this._status}`);
    }

    this._status = ProfileStatus.ACTIVE;
    this._paymentId = paymentId;
    this._updatedAt = new Date();
  }

  /**
   * Marks profile as payment approved
   */
  public markPaymentApproved(paymentId: string): void {
    if (this._status !== ProfileStatus.PAYMENT_PENDING) {
      throw new Error(`Cannot mark payment approved from status: ${this._status}`);
    }

    this._status = ProfileStatus.PAYMENT_APPROVED;
    this._paymentId = paymentId;
    this._updatedAt = new Date();
  }

  /**
   * Marks profile as payment failed
   */
  public markPaymentFailed(): void {
    if (![ProfileStatus.PENDING, ProfileStatus.PAYMENT_PENDING].includes(this._status)) {
      throw new Error(`Cannot mark payment failed from status: ${this._status}`);
    }

    this._status = ProfileStatus.PROCESSING_FAILED;
    this._updatedAt = new Date();
  }

  /**
   * Sets the QR code URL
   */
  public setQRCodeUrl(qrCodeUrl: string): void {
    if (!qrCodeUrl || !this.isValidUrl(qrCodeUrl)) {
      throw new Error('Invalid QR code URL');
    }

    this._qrCodeUrl = qrCodeUrl;
    this._updatedAt = new Date();
  }

  /**
   * Sets the memorial URL
   */
  public setMemorialUrl(memorialUrl: string): void {
    if (!memorialUrl || !this.isValidUrl(memorialUrl)) {
      throw new Error('Invalid memorial URL');
    }

    this._memorialUrl = memorialUrl;
    this._updatedAt = new Date();
  }

  /**
   * Updates profile data
   */
  public updateProfile(updateData: ProfileUpdateData): void {
    if (this._status !== ProfileStatus.ACTIVE) {
      throw new Error('Can only update active profiles');
    }

    if (updateData.personalData) {
      this._personalData = this.validatePersonalData({
        ...this._personalData,
        ...updateData.personalData,
      });
    }

    if (updateData.medicalData) {
      this._medicalData = this.validateMedicalData({
        ...this._medicalData,
        ...updateData.medicalData,
      });
    }

    if (updateData.emergencyContacts) {
      this._emergencyContacts = this.validateEmergencyContacts(updateData.emergencyContacts);
    }

    if (updateData.vehicleData !== undefined) {
      this._vehicleData = updateData.vehicleData ? 
        this.validateVehicleData(updateData.vehicleData) : 
        undefined;
    }

    this.validateDomainRules();
    this._updatedAt = new Date();
  }

  /**
   * Deactivates the profile
   */
  public deactivate(): void {
    if (this._status !== ProfileStatus.ACTIVE) {
      throw new Error('Can only deactivate active profiles');
    }

    this._status = ProfileStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * Reactivates the profile
   */
  public reactivate(): void {
    if (this._status !== ProfileStatus.INACTIVE) {
      throw new Error('Can only reactivate inactive profiles');
    }

    this._status = ProfileStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  // Business logic methods

  /**
   * Checks if profile has expired (for pending profiles)
   */
  public hasExpired(): boolean {
    if (this._status !== ProfileStatus.PENDING) {
      return false;
    }

    const expirationTime = this._createdAt.getTime() + (PROFILE_EXPIRATION_HOURS * 60 * 60 * 1000);
    return Date.now() > expirationTime;
  }

  /**
   * Checks if profile can be activated
   */
  public canBeActivated(): boolean {
    return this._status === ProfileStatus.PAYMENT_APPROVED && 
           this._paymentId !== undefined;
  }

  /**
   * Checks if profile is ready for QR code generation
   */
  public isReadyForQRCode(): boolean {
    return this._status === ProfileStatus.ACTIVE && 
           this._memorialUrl !== undefined;
  }

  /**
   * Gets the primary emergency contact
   */
  public getPrimaryEmergencyContact(): EmergencyContact {
    const primary = this._emergencyContacts.find(c => c.isPrimary);
    return primary || this._emergencyContacts[0];
  }

  /**
   * Gets age from birth date
   */
  public getAge(): number {
    const birthDate = new Date(this._personalData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Checks if profile supports vehicle data
   */
  public supportsVehicleData(): boolean {
    return this._planType === PlanType.PREMIUM;
  }

  /**
   * Validates if a status transition is allowed
   */
  public canTransitionTo(newStatus: ProfileStatus): boolean {
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
      ],
    };

    const allowedTransitions = validTransitions[this._status] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Gets display data for memorial page
   */
  public getMemorialData(): {
    name: string;
    birthDate: string;
    bloodType: BloodType;
    allergies: string[];
    medications: string[];
    emergencyContacts: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
    qrCodeUrl?: string;
    vehicleInfo?: string;
  } {
    return {
      name: `${this._personalData.name} ${this._personalData.surname}`,
      birthDate: this._personalData.birthDate,
      bloodType: this._medicalData.bloodType,
      allergies: this._medicalData.allergies,
      medications: this._medicalData.medications,
      emergencyContacts: this._emergencyContacts.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
      })),
      qrCodeUrl: this._qrCodeUrl,
      vehicleInfo: this._vehicleData ? 
        `${this._vehicleData.brand} ${this._vehicleData.model} ${this._vehicleData.year} - ${this._vehicleData.licensePlate}` : 
        undefined,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Getters
  get uniqueUrl(): string {
    return this._uniqueUrl;
  }

  get personalData(): PersonalData {
    return { ...this._personalData };
  }

  get medicalData(): MedicalData {
    return {
      ...this._medicalData,
      allergies: [...this._medicalData.allergies],
      medications: [...this._medicalData.medications],
      medicalConditions: [...this._medicalData.medicalConditions],
    };
  }

  get emergencyContacts(): EmergencyContact[] {
    return this._emergencyContacts.map(contact => ({ ...contact }));
  }

  get vehicleData(): VehicleData | undefined {
    return this._vehicleData ? { ...this._vehicleData } : undefined;
  }

  get planType(): PlanType {
    return this._planType;
  }

  get status(): ProfileStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get paymentId(): string | undefined {
    return this._paymentId;
  }

  get qrCodeUrl(): string | undefined {
    return this._qrCodeUrl;
  }

  get memorialUrl(): string | undefined {
    return this._memorialUrl;
  }

  // Serialization
  public toJSON(): ProfileData {
    return {
      uniqueUrl: this._uniqueUrl,
      personalData: this.personalData,
      medicalData: this.medicalData,
      emergencyContacts: this.emergencyContacts,
      vehicleData: this.vehicleData,
      planType: this._planType,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      paymentId: this._paymentId,
      qrCodeUrl: this._qrCodeUrl,
      memorialUrl: this._memorialUrl,
    };
  }

  // Factory methods
  public static fromJSON(data: ProfileData): Profile {
    return new Profile(data);
  }

  public static createPendingProfile(
    personalData: PersonalData,
    medicalData: MedicalData,
    emergencyContacts: EmergencyContact[],
    planType: PlanType,
    vehicleData?: VehicleData
  ): Profile {
    return new Profile({
      personalData,
      medicalData,
      emergencyContacts,
      planType,
      vehicleData,
      status: ProfileStatus.PENDING,
    });
  }

  /**
   * Creates a profile for immediate activation (used in testing or admin creation)
   */
  public static createActiveProfile(
    personalData: PersonalData,
    medicalData: MedicalData,
    emergencyContacts: EmergencyContact[],
    planType: PlanType,
    paymentId: string,
    vehicleData?: VehicleData
  ): Profile {
    const profile = new Profile({
      personalData,
      medicalData,
      emergencyContacts,
      planType,
      vehicleData,
      paymentId,
      status: ProfileStatus.ACTIVE,
    });

    return profile;
  }

  /**
   * Validates profile data without creating an instance
   */
  public static validate(data: unknown): ValidationResult {
    try {
      ProfileDataSchema.parse(data);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      
      return {
        isValid: false,
        errors: [(error as Error).message],
      };
    }
  }
}