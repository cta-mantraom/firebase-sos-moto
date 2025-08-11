import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/schemas/profile';

export const useFirebase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get user profile by unique URL
  const getProfile = async (uniqueUrl: string): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, 'user_profiles', uniqueUrl);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        bloodType: data.bloodType,
        allergies: data.allergies || [],
        medications: data.medications || [],
        medicalConditions: data.medicalConditions || [],
        healthPlan: data.healthPlan,
        preferredHospital: data.preferredHospital,
        medicalNotes: data.medicalNotes,
        emergencyContacts: data.emergencyContacts || [],
        planType: data.planType,
        planPrice: data.planPrice,
      } as UserProfile;
      
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching profile:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create or update user profile
  const saveProfile = async (uniqueUrl: string, profile: UserProfile): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, 'user_profiles', uniqueUrl);
      await setDoc(docRef, {
        ...profile,
        uniqueUrl,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      return true;
    } catch (err) {
      setError(err as Error);
      console.error('Error saving profile:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get payment status
  const getPaymentStatus = async (paymentId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, 'payments_log', paymentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return docSnap.data().status;
      
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching payment status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get memorial page data
  const getMemorialPage = async (uniqueUrl: string): Promise<DocumentData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, 'memorial_pages', uniqueUrl);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return docSnap.data();
      
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching memorial page:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getProfile,
    saveProfile,
    getPaymentStatus,
    getMemorialPage,
  };
};