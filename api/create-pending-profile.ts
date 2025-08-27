import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirebaseConfig } from "../lib/config/index.js";
import { logInfo, logError } from "../lib/utils/logger.js";
import { generateCorrelationId } from "../lib/utils/ids.js";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const firebaseConfig = getFirebaseConfig();
    initializeApp({
      credential: cert({
        projectId: firebaseConfig.projectId,
        clientEmail: firebaseConfig.clientEmail,
        privateKey: firebaseConfig.privateKey,
      }),
      storageBucket: firebaseConfig.storageBucket,
    });
    logInfo("Firebase Admin initialized successfully");
  } catch (error) {
    logError("Error initializing Firebase Admin", error as Error);
  }
}

// Schema for pending profile creation
const CreatePendingProfileSchema = z.object({
  uniqueUrl: z.string().min(1),
  paymentId: z.string().min(1),
  selectedPlan: z.enum(['basic', 'premium']),
  
  // Personal data
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  age: z.number().positive().optional(),
  
  // Medical data
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
  
  // Emergency contacts
  emergencyContacts: z.array(z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(10).max(20),
    relationship: z.string().optional(),
  })).min(1),
  
  // Device ID - CRITICAL for approval rate
  deviceId: z.string().min(1),
});

/**
 * Create Pending Profile Endpoint
 * 
 * Creates a pending profile in Firestore before payment processing.
 * This profile will be converted to active profile after payment approval.
 * 
 * CRITICAL: Device ID must be present for 85%+ approval rate
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = generateCorrelationId();

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      correlationId,
    });
  }

  try {
    logInfo("Creating pending profile", {
      correlationId,
      hasDeviceId: !!req.body.deviceId,
    });

    // Validate input
    const validation = CreatePendingProfileSchema.safeParse(req.body);
    
    if (!validation.success) {
      logError("Invalid pending profile data", new Error("Validation failed"), {
        correlationId,
        errors: validation.error.errors,
      });
      
      return res.status(400).json({
        error: "Dados inválidos",
        details: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        correlationId,
      });
    }

    const data = validation.data;
    
    // CRITICAL: Log Device ID presence for monitoring
    logInfo("Device ID status for pending profile", {
      correlationId,
      deviceId: data.deviceId.substring(0, 10) + "...",
      expectedApprovalRate: "85%+",
    });

    // Prepare pending profile data
    const pendingProfile = {
      // IDs
      uniqueUrl: data.uniqueUrl,
      paymentId: data.paymentId,
      deviceId: data.deviceId,
      
      // Status
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      
      // Plan
      planType: data.selectedPlan,
      planPrice: data.selectedPlan === 'premium' ? 85.0 : 5.0,
      
      // Personal data
      personalData: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age || null,
      },
      
      // Medical data
      medicalData: {
        bloodType: data.bloodType,
        allergies: data.allergies || [],
        medications: data.medications || [],
        medicalConditions: data.medicalConditions || [],
        healthPlan: data.healthPlan || null,
        preferredHospital: data.preferredHospital || null,
        medicalNotes: data.medicalNotes || null,
      },
      
      // Emergency contacts
      emergencyContacts: data.emergencyContacts,
      
      // Metadata
      metadata: {
        correlationId,
        source: "payment_brick",
        hasDeviceId: true,
        expectedApprovalRate: "85%+",
      },
    };

    // Save to Firestore
    const db = getFirestore();
    await db
      .collection("pending_profiles")
      .doc(data.uniqueUrl)
      .set(pendingProfile);

    logInfo("Pending profile created successfully", {
      correlationId,
      uniqueUrl: data.uniqueUrl,
      paymentId: data.paymentId,
      bloodType: data.bloodType,
      emergencyContactsCount: data.emergencyContacts.length,
    });

    return res.status(200).json({
      success: true,
      uniqueUrl: data.uniqueUrl,
      paymentId: data.paymentId,
      correlationId,
      message: "Perfil pendente criado. Aguardando pagamento.",
    });

  } catch (error) {
    logError("Failed to create pending profile", error as Error, {
      correlationId,
    });

    return res.status(500).json({
      error: "Erro ao criar perfil pendente",
      message: "Tente novamente em alguns instantes",
      correlationId,
    });
  }
}