import { getFirestore, Firestore, CollectionReference, DocumentReference, Query } from 'firebase-admin/firestore';
import { Profile } from '../domain/profile/profile.entity';
import {
  ProfileData,
  ProfileStatus,
  PlanType,
  ProfileSearchFilters,
} from '../domain/profile/profile.types';
import { logInfo, logError } from '../utils/logger';

/**
 * Profile Repository
 * 
 * This repository handles all data access operations for profiles.
 * It follows the repository pattern and provides type-safe database operations.
 */
export class ProfileRepository {
  private readonly db: Firestore;
  private readonly profilesCollection: CollectionReference;
  private readonly pendingProfilesCollection: CollectionReference;
  private readonly memorialPagesCollection: CollectionReference;

  constructor() {
    this.db = getFirestore();
    this.profilesCollection = this.db.collection('user_profiles');
    this.pendingProfilesCollection = this.db.collection('pending_profiles');
    this.memorialPagesCollection = this.db.collection('memorial_pages');
  }

  /**
   * Creates a new profile in the database
   */
  async create(profile: Profile, correlationId?: string): Promise<void> {
    try {
      logInfo('Creating profile in database', { 
        correlationId, 
        profileId: profile.uniqueUrl,
        status: profile.status 
      });

      const data = this.mapProfileToFirestore(profile.toJSON());
      await this.profilesCollection.doc(profile.uniqueUrl).set(data);

      // If profile is active, also create memorial page
      if (profile.status === ProfileStatus.ACTIVE && profile.memorialUrl) {
        await this.createMemorialPage(profile, correlationId);
      }

      logInfo('Profile created successfully', { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
    } catch (error) {
      logError('Error creating profile', error as Error, { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Updates an existing profile
   */
  async update(profile: Profile, correlationId?: string): Promise<void> {
    try {
      logInfo('Updating profile in database', { 
        correlationId, 
        profileId: profile.uniqueUrl,
        status: profile.status 
      });

      const data = this.mapProfileToFirestore(profile.toJSON());
      await this.profilesCollection.doc(profile.uniqueUrl).update(data);

      // Update memorial page if profile is active
      if (profile.status === ProfileStatus.ACTIVE) {
        await this.updateMemorialPage(profile, correlationId);
      }

      logInfo('Profile updated successfully', { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
    } catch (error) {
      logError('Error updating profile', error as Error, { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Finds a profile by unique URL
   */
  async findByUniqueUrl(uniqueUrl: string, correlationId?: string): Promise<Profile | null> {
    try {
      logInfo('Finding profile by unique URL', { correlationId, uniqueUrl });

      const doc = await this.profilesCollection.doc(uniqueUrl).get();
      
      if (!doc.exists) {
        logInfo('Profile not found', { correlationId, uniqueUrl });
        return null;
      }

      const data = doc.data();
      if (!data) {
        logInfo('Profile document has no data', { correlationId, uniqueUrl });
        return null;
      }

      const profileData = this.mapFirestoreToProfile(data, uniqueUrl);
      const profile = Profile.fromJSON(profileData);

      logInfo('Profile found successfully', { 
        correlationId, 
        uniqueUrl, 
        status: profile.status 
      });

      return profile;
    } catch (error) {
      logError('Error finding profile by unique URL', error as Error, { 
        correlationId, 
        uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Finds a profile by payment ID
   */
  async findByPaymentId(paymentId: string, correlationId?: string): Promise<Profile | null> {
    try {
      logInfo('Finding profile by payment ID', { correlationId, paymentId });

      const querySnapshot = await this.profilesCollection
        .where('paymentId', '==', paymentId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        logInfo('Profile not found by payment ID', { correlationId, paymentId });
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const profileData = this.mapFirestoreToProfile(data, doc.id);
      const profile = Profile.fromJSON(profileData);

      logInfo('Profile found by payment ID', { 
        correlationId, 
        paymentId, 
        profileId: profile.uniqueUrl 
      });

      return profile;
    } catch (error) {
      logError('Error finding profile by payment ID', error as Error, { 
        correlationId, 
        paymentId 
      });
      throw error;
    }
  }

  /**
   * Searches profiles with filters and pagination
   */
  async search(
    queryData: ProfileSearchFilters,
    correlationId?: string
  ): Promise<{ profiles: Profile[]; total: number; hasMore: boolean }> {
    try {
      logInfo('Searching profiles', { correlationId, queryData });

      let query: Query = this.profilesCollection;

      // Apply filters
      if (queryData.status) {
        query = query.where('status', '==', queryData.status);
      }

      if (queryData.planType) {
        query = query.where('planType', '==', queryData.planType);
      }

      if (queryData.createdFrom) {
        query = query.where('createdAt', '>=', queryData.createdFrom);
      }

      if (queryData.createdTo) {
        query = query.where('createdAt', '<=', queryData.createdTo);
      }

      // Apply ordering and pagination
      query = query.orderBy('createdAt', 'desc');

      if (queryData.offset > 0) {
        query = query.offset(queryData.offset);
      }

      query = query.limit(queryData.limit + 1); // Get one extra to check if there are more

      const querySnapshot = await query.get();
      const docs = querySnapshot.docs;

      // Check if there are more results
      const hasMore = docs.length > queryData.limit;
      const profileDocs = hasMore ? docs.slice(0, queryData.limit) : docs;

      const profiles: Profile[] = [];
      for (const doc of profileDocs) {
        const data = doc.data();
        const profileData = this.mapFirestoreToProfile(data, doc.id);
        
        // Apply text search filter if provided
        if (queryData.searchTerm) {
          const searchLower = queryData.searchTerm.toLowerCase();
          const fullName = `${profileData.personalData.name} ${profileData.personalData.surname}`.toLowerCase();
          const email = profileData.personalData.email.toLowerCase();
          
          if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
            continue;
          }
        }

        const profile = Profile.fromJSON(profileData);
        profiles.push(profile);
      }

      // Get total count for pagination info
      const totalQuery = this.buildCountQuery(queryData);
      const totalSnapshot = await totalQuery.count().get();
      const total = totalSnapshot.data().count;

      logInfo('Profile search completed', { 
        correlationId, 
        resultCount: profiles.length,
        total,
        hasMore 
      });

      return { profiles, total, hasMore };
    } catch (error) {
      logError('Error searching profiles', error as Error, { 
        correlationId, 
        queryData 
      });
      throw error;
    }
  }

  /**
   * Gets profiles that have expired (pending status for too long)
   */
  async findExpiredProfiles(correlationId?: string): Promise<Profile[]> {
    try {
      logInfo('Finding expired profiles', { correlationId });

      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 24); // 24 hours ago

      const querySnapshot = await this.profilesCollection
        .where('status', '==', ProfileStatus.PENDING)
        .where('createdAt', '<=', expiredDate)
        .get();

      const profiles: Profile[] = [];
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const profileData = this.mapFirestoreToProfile(data, doc.id);
        const profile = Profile.fromJSON(profileData);
        profiles.push(profile);
      }

      logInfo('Found expired profiles', { 
        correlationId, 
        count: profiles.length 
      });

      return profiles;
    } catch (error) {
      logError('Error finding expired profiles', error as Error, { correlationId });
      throw error;
    }
  }

  /**
   * Gets profiles that need QR code generation
   */
  async findProfilesNeedingQRCode(correlationId?: string): Promise<Profile[]> {
    try {
      logInfo('Finding profiles needing QR code', { correlationId });

      const querySnapshot = await this.profilesCollection
        .where('status', '==', ProfileStatus.ACTIVE)
        .where('qrCodeUrl', '==', null)
        .limit(50) // Process in batches
        .get();

      const profiles: Profile[] = [];
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const profileData = this.mapFirestoreToProfile(data, doc.id);
        const profile = Profile.fromJSON(profileData);
        
        if (profile.isReadyForQRCode()) {
          profiles.push(profile);
        }
      }

      logInfo('Found profiles needing QR code', { 
        correlationId, 
        count: profiles.length 
      });

      return profiles;
    } catch (error) {
      logError('Error finding profiles needing QR code', error as Error, { correlationId });
      throw error;
    }
  }

  /**
   * Deletes a profile and its related data
   */
  async delete(uniqueUrl: string, correlationId?: string): Promise<void> {
    try {
      logInfo('Deleting profile', { correlationId, uniqueUrl });

      // Use batch operation for consistency
      const batch = this.db.batch();

      // Delete profile
      const profileRef = this.profilesCollection.doc(uniqueUrl);
      batch.delete(profileRef);

      // Delete memorial page if exists
      const memorialRef = this.memorialPagesCollection.doc(uniqueUrl);
      batch.delete(memorialRef);

      // Delete pending profile if exists
      const pendingRef = this.pendingProfilesCollection.doc(uniqueUrl);
      batch.delete(pendingRef);

      await batch.commit();

      logInfo('Profile deleted successfully', { correlationId, uniqueUrl });
    } catch (error) {
      logError('Error deleting profile', error as Error, { 
        correlationId, 
        uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Bulk update profiles status
   */
  async bulkUpdateStatus(
    profileIds: string[],
    newStatus: ProfileStatus,
    correlationId?: string
  ): Promise<{ successful: string[]; failed: Array<{ profileId: string; error: string }> }> {
    try {
      logInfo('Bulk updating profile status', { 
        correlationId, 
        profileCount: profileIds.length, 
        newStatus 
      });

      const successful: string[] = [];
      const failed: Array<{ profileId: string; error: string }> = [];

      // Process in batches of 10 (Firestore batch limit is 500, but we want smaller batches)
      const batchSize = 10;
      for (let i = 0; i < profileIds.length; i += batchSize) {
        const batch = this.db.batch();
        const batchProfileIds = profileIds.slice(i, i + batchSize);

        try {
          for (const profileId of batchProfileIds) {
            const profileRef = this.profilesCollection.doc(profileId);
            batch.update(profileRef, {
              status: newStatus,
              updatedAt: new Date(),
            });
          }

          await batch.commit();
          successful.push(...batchProfileIds);
        } catch (error) {
          for (const profileId of batchProfileIds) {
            failed.push({
              profileId,
              error: (error as Error).message,
            });
          }
        }
      }

      logInfo('Bulk update completed', { 
        correlationId, 
        successful: successful.length, 
        failed: failed.length 
      });

      return { successful, failed };
    } catch (error) {
      logError('Error in bulk update', error as Error, { 
        correlationId, 
        profileCount: profileIds.length 
      });
      throw error;
    }
  }

  /**
   * Gets profile statistics
   */
  async getStatistics(
    dateFrom: Date,
    dateTo: Date,
    correlationId?: string
  ): Promise<{
    total: number;
    byStatus: Record<ProfileStatus, number>;
    byPlan: Record<PlanType, number>;
    newProfiles: number;
  }> {
    try {
      logInfo('Getting profile statistics', { correlationId, dateFrom, dateTo });

      // Get all profiles in date range
      const querySnapshot = await this.profilesCollection
        .where('createdAt', '>=', dateFrom)
        .where('createdAt', '<=', dateTo)
        .get();

      const stats = {
        total: querySnapshot.size,
        byStatus: {} as Record<ProfileStatus, number>,
        byPlan: {} as Record<PlanType, number>,
        newProfiles: querySnapshot.size,
      };

      // Initialize counters
      Object.values(ProfileStatus).forEach(status => {
        stats.byStatus[status] = 0;
      });
      Object.values(PlanType).forEach(plan => {
        stats.byPlan[plan] = 0;
      });

      // Count by status and plan
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const status = data.status as ProfileStatus;
        const planType = data.planType as PlanType;

        if (status) {
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        }
        if (planType) {
          stats.byPlan[planType] = (stats.byPlan[planType] || 0) + 1;
        }
      }

      logInfo('Profile statistics generated', { correlationId, stats });

      return stats;
    } catch (error) {
      logError('Error getting profile statistics', error as Error, { 
        correlationId, 
        dateFrom, 
        dateTo 
      });
      throw error;
    }
  }

  /**
   * Checks if a profile exists
   */
  async exists(uniqueUrl: string, correlationId?: string): Promise<boolean> {
    try {
      const doc = await this.profilesCollection.doc(uniqueUrl).get();
      const exists = doc.exists;

      logInfo('Profile existence check', { correlationId, uniqueUrl, exists });

      return exists;
    } catch (error) {
      logError('Error checking profile existence', error as Error, { 
        correlationId, 
        uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Saves a profile (alias for create method)
   */
  async save(profile: Profile, correlationId?: string): Promise<void> {
    return this.create(profile, correlationId);
  }

  /**
   * Finds a pending profile by unique URL
   */
  async findPendingProfile(uniqueUrl: string, correlationId?: string): Promise<Profile | null> {
    try {
      logInfo('Finding pending profile', { correlationId, uniqueUrl });

      const doc = await this.pendingProfilesCollection.doc(uniqueUrl).get();

      if (!doc.exists) {
        logInfo('Pending profile not found', { correlationId, uniqueUrl });
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      const profileData = this.mapFirestoreToProfile(data, uniqueUrl);
      const profile = Profile.fromJSON(profileData);

      logInfo('Pending profile found', { 
        correlationId, 
        uniqueUrl,
        status: profile.status 
      });

      return profile;
    } catch (error) {
      logError('Error finding pending profile', error as Error, { 
        correlationId, 
        uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Saves a pending profile
   */
  async savePendingProfile(profile: Profile, correlationId?: string): Promise<void> {
    try {
      logInfo('Saving pending profile', { 
        correlationId, 
        profileId: profile.uniqueUrl,
        status: profile.status 
      });

      const data = this.mapProfileToFirestore(profile.toJSON());
      await this.pendingProfilesCollection.doc(profile.uniqueUrl).set(data);

      logInfo('Pending profile saved successfully', { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
    } catch (error) {
      logError('Error saving pending profile', error as Error, { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Deletes a pending profile
   */
  async deletePendingProfile(uniqueUrl: string, correlationId?: string): Promise<void> {
    try {
      logInfo('Deleting pending profile', { correlationId, uniqueUrl });

      await this.pendingProfilesCollection.doc(uniqueUrl).delete();

      logInfo('Pending profile deleted successfully', { correlationId, uniqueUrl });
    } catch (error) {
      logError('Error deleting pending profile', error as Error, { 
        correlationId, 
        uniqueUrl 
      });
      throw error;
    }
  }

  /**
   * Updates the status of a single profile
   */
  async updateStatus(
    uniqueUrl: string,
    status: ProfileStatus,
    correlationId?: string
  ): Promise<void> {
    try {
      logInfo('Updating profile status', { 
        correlationId, 
        uniqueUrl,
        newStatus: status 
      });

      await this.profilesCollection.doc(uniqueUrl).update({
        status,
        updatedAt: new Date(),
      });

      logInfo('Profile status updated successfully', { 
        correlationId, 
        uniqueUrl,
        newStatus: status 
      });
    } catch (error) {
      logError('Error updating profile status', error as Error, { 
        correlationId, 
        uniqueUrl,
        status 
      });
      throw error;
    }
  }

  /**
   * Deletes expired pending profiles
   */
  async deleteExpiredPendingProfiles(
    expirationDate: Date,
    correlationId?: string
  ): Promise<number> {
    try {
      logInfo('Deleting expired pending profiles', { 
        correlationId, 
        expirationDate 
      });

      const querySnapshot = await this.pendingProfilesCollection
        .where('createdAt', '<', expirationDate)
        .get();

      let deletedCount = 0;
      const batch = this.db.batch();

      for (const doc of querySnapshot.docs) {
        batch.delete(doc.ref);
        deletedCount++;
      }

      if (deletedCount > 0) {
        await batch.commit();
      }

      logInfo('Expired pending profiles deleted', { 
        correlationId, 
        deletedCount 
      });

      return deletedCount;
    } catch (error) {
      logError('Error deleting expired pending profiles', error as Error, { 
        correlationId, 
        expirationDate 
      });
      throw error;
    }
  }

  // Private helper methods

  private async createMemorialPage(profile: Profile, correlationId?: string): Promise<void> {
    try {
      const memorialData = profile.getMemorialData();
      
      await this.memorialPagesCollection.doc(profile.uniqueUrl).set({
        profileId: profile.uniqueUrl,
        name: memorialData.name,
        birthDate: memorialData.birthDate,
        bloodType: memorialData.bloodType,
        allergies: memorialData.allergies,
        medications: memorialData.medications,
        emergencyContacts: memorialData.emergencyContacts,
        qrCodeUrl: memorialData.qrCodeUrl || null,
        vehicleInfo: memorialData.vehicleInfo || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logInfo('Memorial page created', { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
    } catch (error) {
      logError('Error creating memorial page', error as Error, { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
      // Don't throw - memorial page creation is not critical
    }
  }

  private async updateMemorialPage(profile: Profile, correlationId?: string): Promise<void> {
    try {
      const memorialData = profile.getMemorialData();
      
      await this.memorialPagesCollection.doc(profile.uniqueUrl).set({
        profileId: profile.uniqueUrl,
        name: memorialData.name,
        birthDate: memorialData.birthDate,
        bloodType: memorialData.bloodType,
        allergies: memorialData.allergies,
        medications: memorialData.medications,
        emergencyContacts: memorialData.emergencyContacts,
        qrCodeUrl: memorialData.qrCodeUrl || null,
        vehicleInfo: memorialData.vehicleInfo || null,
        isActive: profile.status === ProfileStatus.ACTIVE,
        updatedAt: new Date(),
      }, { merge: true });

      logInfo('Memorial page updated', { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
    } catch (error) {
      logError('Error updating memorial page', error as Error, { 
        correlationId, 
        profileId: profile.uniqueUrl 
      });
      // Don't throw - memorial page update is not critical
    }
  }

  private buildCountQuery(queryData: ProfileSearchFilters): Query {
    let query: Query = this.profilesCollection;

    if (queryData.status) {
      query = query.where('status', '==', queryData.status);
    }

    if (queryData.planType) {
      query = query.where('planType', '==', queryData.planType);
    }

    if (queryData.createdFrom) {
      query = query.where('createdAt', '>=', queryData.createdFrom);
    }

    if (queryData.createdTo) {
      query = query.where('createdAt', '<=', queryData.createdTo);
    }

    return query;
  }

  private mapProfileToFirestore(profile: ProfileData): Record<string, unknown> {
    return {
      // Personal data
      name: profile.personalData.name,
      surname: profile.personalData.surname,
      cpf: profile.personalData.cpf,
      birthDate: profile.personalData.birthDate,
      phone: profile.personalData.phone,
      email: profile.personalData.email,
      address: profile.personalData.address,

      // Medical data
      bloodType: profile.medicalData.bloodType,
      allergies: profile.medicalData.allergies,
      medications: profile.medicalData.medications,
      medicalConditions: profile.medicalData.medicalConditions,
      organDonor: profile.medicalData.organDonor,
      emergencyNotes: profile.medicalData.emergencyNotes,

      // Emergency contacts
      emergencyContacts: profile.emergencyContacts,

      // Vehicle data (if present)
      vehicleData: profile.vehicleData || null,

      // Profile metadata
      planType: profile.planType,
      status: profile.status,
      paymentId: profile.paymentId || null,
      qrCodeUrl: profile.qrCodeUrl || null,
      memorialUrl: profile.memorialUrl || null,

      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private mapFirestoreToProfile(data: Record<string, unknown>, uniqueUrl: string): ProfileData {
    return {
      uniqueUrl,
      personalData: {
        name: data.name as string,
        surname: data.surname as string,
        cpf: data.cpf as string,
        birthDate: data.birthDate as string,
        phone: data.phone as string,
        email: data.email as string,
        address: data.address as ProfileData['personalData']['address'],
      },
      medicalData: {
        bloodType: data.bloodType as ProfileData['medicalData']['bloodType'],
        allergies: (data.allergies as string[]) || [],
        medications: (data.medications as string[]) || [],
        medicalConditions: (data.medicalConditions as string[]) || [],
        organDonor: (data.organDonor as boolean) || false,
        emergencyNotes: data.emergencyNotes as string | undefined,
      },
      emergencyContacts: (data.emergencyContacts as ProfileData['emergencyContacts']) || [],
      vehicleData: data.vehicleData as ProfileData['vehicleData'] | undefined,
      planType: data.planType as PlanType,
      status: data.status as ProfileStatus,
      paymentId: data.paymentId as string | undefined,
      qrCodeUrl: data.qrCodeUrl as string | undefined,
      memorialUrl: data.memorialUrl as string | undefined,
      createdAt: (data.createdAt as Date) || new Date(),
      updatedAt: (data.updatedAt as Date) || new Date(),
    };
  }
}