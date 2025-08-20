import { MemorialData } from '../types/index.js';
import { logInfo, logError } from '../utils/logger.js';

export class FirebaseService {
  async getProfile(uniqueUrl: string, correlationId: string): Promise<MemorialData | null> {
    try {
      logInfo('Fetching profile via REST API', { correlationId, uniqueUrl });
      
      // Use Firebase REST API instead of Admin SDK for Vercel Edge Functions
      // Project ID is hardcoded for this specific project
      const projectId = 'moto-sos-guardian-app-78272';
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_profiles/${uniqueUrl}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          logInfo('Profile not found in Firebase', { correlationId, uniqueUrl });
          return null;
        }
        throw new Error(`Firebase API error: ${response.status}`);
      }
      
      const doc = await response.json();
      const fields = doc.fields || {};
      
      // Convert Firebase REST API format to MemorialData
      const memorialData: MemorialData = {
        unique_url: uniqueUrl,
        name: fields.name?.stringValue || '',
        phone: fields.phone?.stringValue || '',
        blood_type: fields.bloodType?.stringValue || null,
        allergies: fields.allergies?.arrayValue?.values?.map((v: unknown) => {
          const value = v as { stringValue?: string };
          return value.stringValue || '';
        }).filter(Boolean) || [],
        medications: fields.medications?.arrayValue?.values?.map((v: unknown) => {
          const value = v as { stringValue?: string };
          return value.stringValue || '';
        }).filter(Boolean) || [],
        medical_conditions: fields.medicalConditions?.arrayValue?.values?.map((v: unknown) => {
          const value = v as { stringValue?: string };
          return value.stringValue || '';
        }).filter(Boolean) || [],
        emergency_contacts: fields.emergencyContacts?.arrayValue?.values?.map((v: unknown) => {
          const contact = v as {
            mapValue?: {
              fields?: {
                name?: { stringValue?: string };
                phone?: { stringValue?: string };
                relationship?: { stringValue?: string };
              };
            };
          };
          return {
            name: contact.mapValue?.fields?.name?.stringValue || '',
            phone: contact.mapValue?.fields?.phone?.stringValue || '',
            relationship: contact.mapValue?.fields?.relationship?.stringValue || '',
          };
        }) || [],
        age: parseInt(fields.age?.integerValue || '0'),
        email: fields.email?.stringValue || '',
        health_plan: fields.healthPlan?.stringValue || null,
        preferred_hospital: fields.preferredHospital?.stringValue || null,
        medical_notes: fields.medicalNotes?.stringValue || null,
        plan_type: (fields.planType?.stringValue as 'basic' | 'premium') || 'basic',
        created_at: fields.createdAt?.timestampValue || new Date().toISOString(),
        qr_code_data: fields.qrCodeData?.stringValue || null,
        qr_code_image_url: fields.qrCodeImageUrl?.stringValue || null,
      };
      
      logInfo('Profile fetched successfully from Firebase', { correlationId, uniqueUrl });
      return memorialData;
      
    } catch (error) {
      logError('Error fetching profile from Firebase', error as Error, { correlationId, uniqueUrl });
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();