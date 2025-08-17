/**
 * Profile Repository Interface
 * CRITICAL: Defines all required methods for profile data operations
 * Following Interface-First Development pattern
 */

import { PendingProfile, ProfileStatus } from './profile.types';
import { Profile } from './profile.entity';

/**
 * ProfileRepository Interface
 * Manages all profile-related data operations
 */
export interface IProfileRepository {
  /**
   * Find pending profile by ID
   * @param id Profile identifier
   * @returns PendingProfile if found, null otherwise
   */
  findPendingProfile(id: string): Promise<PendingProfile | null>;

  /**
   * Save a completed profile
   * @param profile Profile data to save
   * @returns Promise resolving when profile is saved
   */
  save(profile: Profile): Promise<void>;

  /**
   * Save a pending profile (before payment approval)
   * @param profile Pending profile data
   * @returns Promise resolving when pending profile is saved
   */
  savePendingProfile(profile: PendingProfile): Promise<void>;

  /**
   * Delete a pending profile
   * @param id Profile identifier to delete
   * @returns Promise resolving when profile is deleted
   */
  deletePendingProfile(id: string): Promise<void>;

  /**
   * Update profile status
   * @param id Profile identifier
   * @param status New profile status
   * @returns Promise resolving when status is updated
   */
  updateStatus(id: string, status: ProfileStatus): Promise<void>;

  /**
   * Delete expired pending profiles
   * @returns Number of profiles deleted
   */
  deleteExpiredPendingProfiles(): Promise<number>;

  /**
   * Find profile by ID
   * @param id Profile identifier
   * @returns Profile if found, null otherwise
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * Find profile by email
   * @param email User email
   * @returns Profile if found, null otherwise
   */
  findByEmail(email: string): Promise<Profile | null>;

  /**
   * Update profile QR code data
   * @param id Profile identifier
   * @param qrCodeUrl QR code image URL
   * @param qrCodeData QR code data/content
   * @returns Promise resolving when QR code is updated
   */
  updateQRCode(id: string, qrCodeUrl: string, qrCodeData: string): Promise<void>;

  /**
   * Get profiles by status
   * @param status Profile status filter
   * @returns Array of profiles with the specified status
   */
  getProfilesByStatus(status: ProfileStatus): Promise<Profile[]>;
}