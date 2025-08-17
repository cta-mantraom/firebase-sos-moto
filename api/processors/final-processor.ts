import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import QRCode from 'qrcode';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { ProcessingJobDataSchema } from '../../lib/types/queue.types';
import { Profile } from '../../lib/domain/profile/profile.entity';
import { BloodType } from '../../lib/domain/profile/profile.types';
import { ProfileRepository } from '../../lib/repositories/profile.repository';
import { Payment } from '../../lib/domain/payment/payment.entity';
import { PaymentRepository } from '../../lib/repositories/payment.repository';
import { QStashService } from '../../lib/services/queue/qstash.service';
import { logInfo, logError } from '../../lib/utils/logger';
import { env } from '../../lib/config/env';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
  } catch (error) {
    logError('Error initializing Firebase Admin', error as Error);
  }
}

// Initialize services
const profileRepository = new ProfileRepository();
const paymentRepository = new PaymentRepository();
const qstashService = new QStashService();

let redis: Redis | null = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Final Processor API Endpoint
 * 
 * This endpoint handles complete processing of approved payments,
 * orchestrating all necessary services to finalize the profile creation.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = (req.headers['x-correlation-id'] as string) || 
                       crypto.randomUUID();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type, x-correlation-id');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      correlationId 
    });
  }

  try {
    logInfo('Final processor started', { 
      correlationId,
      method: req.method,
      userAgent: req.headers['user-agent'],
    });

    // Validate request body
    const validationResult = ProcessingJobDataSchema.safeParse(req.body);
    if (!validationResult.success) {
      logError('Invalid request data', new Error('Validation failed'), {
        correlationId,
        errors: validationResult.error.errors,
      });
      
      return res.status(400).json({
        error: 'Invalid request data',
        details: validationResult.error.errors,
        correlationId,
      });
    }

    const jobData = validationResult.data;
    
    logInfo('Processing payment approval job', {
      correlationId,
      paymentId: jobData.paymentId,
      profileId: jobData.profileId,
      planType: jobData.planType,
      retryCount: jobData.retryCount,
    });

    // Step 1: Create and save profile
    const profile = await createProfile(jobData, correlationId);
    
    // Step 2: Update payment with profile link
    await linkPaymentToProfile(jobData.paymentId, profile.uniqueUrl, correlationId);
    
    // Step 3: Generate and save QR code
    const qrCodeUrl = await generateQRCode(profile, correlationId);
    
    // Step 4: Update profile with QR code URL
    profile.setQRCodeUrl(qrCodeUrl);
    await profileRepository.update(profile, correlationId);
    
    // Step 5: Update cache
    await updateCache(profile, correlationId);
    
    // Step 6: Queue email notification
    await queueEmailNotification(profile, correlationId);

    logInfo('Final processing completed successfully', {
      correlationId,
      profileId: profile.uniqueUrl,
      paymentId: jobData.paymentId,
      qrCodeUrl,
    });

    return res.status(200).json({
      success: true,
      profileId: profile.uniqueUrl,
      memorialUrl: profile.memorialUrl,
      qrCodeUrl,
      correlationId,
    });

  } catch (error) {
    logError('Final processing failed', error as Error, { correlationId });
    
    // Determine if this is a retryable error
    const isRetryable = isRetryableError(error as Error);
    const statusCode = isRetryable ? 500 : 422;
    
    return res.status(statusCode).json({
      error: 'Processing failed',
      message: (error as Error).message,
      retryable: isRetryable,
      correlationId,
    });
  }
}

/**
 * Creates a profile from job data
 */
async function createProfile(
  jobData: z.infer<typeof ProcessingJobDataSchema>,
  correlationId: string
): Promise<Profile> {
  try {
    logInfo('Creating profile from job data', {
      correlationId,
      profileId: jobData.profileId,
    });

    // Create profile entity from job data
    const profileData = jobData.profileData as Record<string, unknown>; // Type assertion for external data
    
    // Safely extract and validate profile data fields
    const name = typeof profileData.name === 'string' ? profileData.name : '';
    const surname = typeof profileData.surname === 'string' ? profileData.surname : '';
    const cpf = typeof profileData.cpf === 'string' ? profileData.cpf : '';
    const birthDate = typeof profileData.birthDate === 'string' ? profileData.birthDate : '';
    const phone = typeof profileData.phone === 'string' ? profileData.phone : '';
    const email = typeof profileData.email === 'string' ? profileData.email : '';
    
    const address = profileData.address && typeof profileData.address === 'object' ? 
      profileData.address as Record<string, unknown> : {};
    
    const addressData = {
      street: typeof address.street === 'string' ? address.street : '',
      number: typeof address.number === 'string' ? address.number : '',
      neighborhood: typeof address.neighborhood === 'string' ? address.neighborhood : '',
      city: typeof address.city === 'string' ? address.city : '',
      state: typeof address.state === 'string' ? address.state : '',
      zipCode: typeof address.zipCode === 'string' ? address.zipCode : '',
    };

    // Map the profile data to our domain format
    const profile = Profile.createPendingProfile(
      {
        name,
        surname,
        cpf,
        birthDate,
        phone,
        email,
        address: addressData,
      },
      {
        bloodType: profileData.bloodType as BloodType | undefined,
        allergies: Array.isArray(profileData.allergies) ? profileData.allergies as string[] : [],
        medications: Array.isArray(profileData.medications) ? profileData.medications as string[] : [],
        medicalConditions: Array.isArray(profileData.medicalConditions) ? profileData.medicalConditions as string[] : [],
        organDonor: typeof profileData.organDonor === 'boolean' ? profileData.organDonor : false,
        emergencyNotes: typeof profileData.emergencyNotes === 'string' ? profileData.emergencyNotes : undefined,
      },
      Array.isArray(profileData.emergencyContacts) ? profileData.emergencyContacts : [],
      jobData.planType === 'premium' ? 'premium' : 'basic',
      profileData.vehicleData as Record<string, unknown> | undefined
    );

    // Set unique URL and memorial URL
    const memorialUrl = `${env.FRONTEND_URL}/memorial/${jobData.uniqueUrl}`;
    profile.setMemorialUrl(memorialUrl);
    
    // Mark as payment approved
    profile.markPaymentApproved(jobData.paymentId);
    
    // Activate the profile
    profile.activate(jobData.paymentId);

    // Save to repository
    await profileRepository.create(profile, correlationId);

    logInfo('Profile created and saved', {
      correlationId,
      profileId: profile.uniqueUrl,
      status: profile.status,
    });

    return profile;
  } catch (error) {
    logError('Error creating profile', error as Error, {
      correlationId,
      profileId: jobData.profileId,
    });
    throw error;
  }
}

/**
 * Links payment to profile
 */
async function linkPaymentToProfile(
  paymentId: string,
  profileId: string,
  correlationId: string
): Promise<void> {
  try {
    logInfo('Linking payment to profile', {
      correlationId,
      paymentId,
      profileId,
    });

    const payment = await paymentRepository.findById(paymentId, correlationId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    payment.linkToProfile(profileId);
    await paymentRepository.update(payment, correlationId);

    logInfo('Payment linked to profile', {
      correlationId,
      paymentId,
      profileId,
    });
  } catch (error) {
    logError('Error linking payment to profile', error as Error, {
      correlationId,
      paymentId,
      profileId,
    });
    throw error;
  }
}

/**
 * Generates QR code and uploads to Firebase Storage
 */
async function generateQRCode(
  profile: Profile,
  correlationId: string
): Promise<string> {
  try {
    logInfo('Generating QR code', {
      correlationId,
      profileId: profile.uniqueUrl,
      memorialUrl: profile.memorialUrl,
    });

    if (!profile.memorialUrl) {
      throw new Error('Memorial URL is required for QR code generation');
    }

    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(profile.memorialUrl, {
      width: 300,
      margin: 2,
      type: 'png',
      errorCorrectionLevel: 'M',
    });

    // Upload to Firebase Storage
    const bucket = getStorage().bucket();
    const fileName = `qr-codes/${profile.uniqueUrl}.png`;
    const file = bucket.file(fileName);
    
    await file.save(qrCodeBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    
    // Make file publicly readable
    await file.makePublic();
    
    // Return public URL
    const qrCodeUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    logInfo('QR code generated and uploaded', {
      correlationId,
      profileId: profile.uniqueUrl,
      qrCodeUrl,
    });

    return qrCodeUrl;
  } catch (error) {
    logError('Error generating QR code', error as Error, {
      correlationId,
      profileId: profile.uniqueUrl,
    });
    throw error;
  }
}

/**
 * Updates Redis cache with profile data
 */
async function updateCache(
  profile: Profile,
  correlationId: string
): Promise<void> {
  if (!redis) {
    logInfo('Redis not configured, skipping cache update', { correlationId });
    return;
  }

  try {
    logInfo('Updating cache', {
      correlationId,
      profileId: profile.uniqueUrl,
    });

    const memorialData = profile.getMemorialData();
    
    await redis.setex(
      `profile:${profile.uniqueUrl}`,
      86400, // 24 hours TTL
      JSON.stringify({
        ...memorialData,
        cached_at: new Date().toISOString(),
      })
    );

    logInfo('Cache updated successfully', {
      correlationId,
      profileId: profile.uniqueUrl,
    });
  } catch (error) {
    logError('Error updating cache', error as Error, {
      correlationId,
      profileId: profile.uniqueUrl,
    });
    // Don't throw - cache update failure is not critical
  }
}

/**
 * Queues email notification
 */
async function queueEmailNotification(
  profile: Profile,
  correlationId: string
): Promise<void> {
  try {
    logInfo('Queuing email notification', {
      correlationId,
      profileId: profile.uniqueUrl,
      email: profile.personalData.email,
    });

    const templateData = {
      userName: profile.personalData.name,
      userEmail: profile.personalData.email,
      planType: profile.planType,
      memorialUrl: profile.memorialUrl!,
      qrCodeUrl: profile.qrCodeUrl,
      timestamp: new Date(),
    };

    await qstashService.publishEmailJob(
      profile.uniqueUrl,
      profile.personalData.email,
      profile.personalData.name,
      'confirmation',
      templateData,
      correlationId
    );

    logInfo('Email notification queued', {
      correlationId,
      profileId: profile.uniqueUrl,
      template: 'confirmation',
    });
  } catch (error) {
    logError('Error queuing email notification', error as Error, {
      correlationId,
      profileId: profile.uniqueUrl,
    });
    // Don't throw - email notification failure is not critical for profile creation
  }
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const retryableErrors = [
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EAI_AGAIN',
  ];

  // Check error code
  if ('code' in error && typeof error.code === 'string') {
    if (retryableErrors.includes(error.code)) {
      return true;
    }
  }

  // Check error message for transient issues
  const errorMessage = error.message.toLowerCase();
  const retryableMessages = [
    'timeout',
    'connection',
    'network',
    'temporary',
    'rate limit',
    'quota exceeded',
  ];

  return retryableMessages.some(msg => errorMessage.includes(msg));
}