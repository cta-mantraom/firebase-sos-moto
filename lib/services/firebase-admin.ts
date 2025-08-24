import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { logInfo, logError } from '../utils/logger.js';
import { getFirebaseConfig } from '../config/index.js';

/**
 * Firebase Admin Helper - Factory Pattern for Serverless Functions
 * 
 * CRITICAL: Serverless functions are STATELESS
 * - Each function execution is isolated
 * - No shared memory between executions
 * - Must use Factory Pattern for initialization
 * 
 * This module provides helper functions to get Firebase services
 * following the Serverless Architecture best practices
 */

/**
 * Gets or initializes Firebase Admin App
 * Uses Factory Pattern as required by Serverless Architecture
 */
export function getFirebaseApp(): App {
  // Check if already initialized in this execution context
  if (!getApps().length) {
    try {
      const firebaseConfig = getFirebaseConfig();
      const app = initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey?.replace(/\\n/g, '\n'),
        }),
        storageBucket: firebaseConfig.storageBucket,
      });
      
      logInfo('Firebase Admin initialized successfully');
      return app;
    } catch (error) {
      logError('Error initializing Firebase Admin', error as Error);
      throw error;
    }
  }
  
  return getApps()[0];
}

/**
 * Gets Firestore instance
 * Ensures Firebase is initialized first
 */
export function getDb(): Firestore {
  getFirebaseApp(); // Ensure app is initialized
  return getFirestore();
}

/**
 * Gets Storage instance
 * Ensures Firebase is initialized first
 */
export function getStorageInstance(): Storage {
  getFirebaseApp(); // Ensure app is initialized
  return getStorage();
}

// Export convenience references
// NOTE: These are functions, not constants, following Serverless pattern
export const db = getDb();
export const storage = getStorageInstance();