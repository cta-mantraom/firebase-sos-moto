import { z } from 'zod';

/**
 * Firebase Configuration
 * Lazy-loaded singleton pattern for optimal performance
 */

const FirebaseConfigSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email('Invalid Firebase client email'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'Firebase private key is required'),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
});

export interface FirebaseConfigType {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket?: string;
}

class FirebaseConfig {
  private static instance: FirebaseConfigType | null = null;

  static get(): FirebaseConfigType {
    if (!this.instance) {
      const validated = FirebaseConfigSchema.parse(process.env);
      
      this.instance = {
        projectId: validated.FIREBASE_PROJECT_ID,
        clientEmail: validated.FIREBASE_CLIENT_EMAIL,
        privateKey: validated.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        storageBucket: validated.FIREBASE_STORAGE_BUCKET,
      };
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

/**
 * Get Firebase configuration
 * @returns Validated and typed Firebase configuration
 */
export const getFirebaseConfig = (): FirebaseConfigType => FirebaseConfig.get();