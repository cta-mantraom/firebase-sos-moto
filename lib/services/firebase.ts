import * as admin from 'firebase-admin';
import { MemorialData } from '../types/index.js';
import { logInfo, logError } from '../utils/logger.js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

export class FirebaseService {
  async getProfile(uniqueUrl: string, correlationId: string): Promise<MemorialData | null> {
    try {
      logInfo('Fetching profile from Firebase', { correlationId, uniqueUrl });
      
      const profileDoc = await db.collection('user_profiles').doc(uniqueUrl).get();
      
      if (!profileDoc.exists) {
        logInfo('Profile not found in Firebase', { correlationId, uniqueUrl });
        return null;
      }
      
      const data = profileDoc.data();
      
      // Convert Firebase data to MemorialData format
      const memorialData: MemorialData = {
        unique_url: data?.uniqueUrl || uniqueUrl,
        name: data?.name || '',
        phone: data?.phone || '',
        blood_type: data?.bloodType || null,
        allergies: data?.allergies || [],
        medications: data?.medications || [],
        medical_conditions: data?.medicalConditions || [],
        emergency_contacts: data?.emergencyContacts || [],
        age: data?.age || 0,
        email: data?.email || '',
        health_plan: data?.healthPlan || null,
        preferred_hospital: data?.preferredHospital || null,
        medical_notes: data?.medicalNotes || null,
        plan_type: data?.planType || 'basic',
        created_at: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        qr_code_data: data?.qrCodeData || null,
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