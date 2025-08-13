import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import QRCode from 'qrcode';
import { z } from 'zod';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

// Initialize AWS SES
const sesClient = new SESv2Client({
  region: process.env.AWS_SES_REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
  },
});

// Firebase Storage upload function for QR code images
async function uploadQRCodeToStorage(imageBuffer: Buffer, profileId: string): Promise<string> {
  try {
    const bucket = getStorage().bucket();
    const fileName = `qr-codes/${profileId}.png`;
    const file = bucket.file(fileName);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    
    // Make file publicly readable
    await file.makePublic();
    
    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error('Error uploading QR code to Firebase Storage:', error);
    throw new Error('Failed to upload QR code image');
  }
}

// Validation Schema
const PaymentSchema = z.object({
  selectedPlan: z.enum(['basic', 'premium']),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  age: z.number().min(1).max(120),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional().default([]),
  medications: z.array(z.string()).optional().default([]),
  medicalConditions: z.array(z.string()).optional().default([]),
  healthPlan: z.string().optional(),
  preferredHospital: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    isMain: z.boolean().default(false),
  })).default([]),
});

const PLAN_PRICES = {
  basic: { title: "SOS Motoboy - Plano Básico", unit_price: 55.0 },
  premium: { title: "SOS Motoboy - Plano Premium", unit_price: 85.0 }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = crypto.randomUUID();
  const db = getFirestore();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input
    const validatedData = PaymentSchema.parse(req.body);
    const plan = PLAN_PRICES[validatedData.selectedPlan];
    const uniqueUrl = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Create MercadoPago preference
    const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          id: validatedData.selectedPlan,
          title: plan.title,
          quantity: 1,
          unit_price: plan.unit_price,
          currency_id: 'BRL',
        }],
        payer: {
          name: validatedData.name,
          email: validatedData.email,
          phone: { number: validatedData.phone },
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success?id=${uniqueUrl}`,
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`,
        },
        auto_return: 'approved',
        external_reference: uniqueUrl,
        notification_url: `${process.env.FRONTEND_URL}/api/mercadopago-webhook`,
        statement_descriptor: 'MOTO SOS',
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    if (!preferenceResponse.ok) {
      const errorText = await preferenceResponse.text();
      throw new Error(`MercadoPago API error: ${preferenceResponse.status} ${errorText}`);
    }

    const preference = await preferenceResponse.json();

    // Save pending profile to Firestore
    await db.collection("pending_profiles").doc(uniqueUrl).set({
      ...validatedData,
      planPrice: plan.unit_price,
      uniqueUrl,
      preferenceId: preference.id,
      correlationId,
      status: "pending",
      createdAt: new Date(),
    });

    return res.status(200).json({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point || preference.sandbox_init_point,
      uniqueUrl,
      correlationId,
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid data provided',
        details: error.errors,
        correlationId,
      });
    }

    return res.status(500).json({
      error: 'Failed to create payment',
      correlationId,
    });
  }
}

// Payment data interface from MercadoPago
interface MercadoPagoPayment {
  id: string;
  status: string;
  status_detail: string;
  external_reference: string;
  payer?: {
    email?: string;
    identification?: unknown;
  };
  transaction_amount: number;
}

// Helper function to process approved payments
export async function processApprovedPayment(profileId: string, paymentData: unknown) {
  // Validate payment data at system boundary
  const payment = paymentData as MercadoPagoPayment;
  const db = getFirestore();
  
  try {
    // Get pending profile
    const pendingProfile = await db.collection("pending_profiles").doc(profileId).get();
    
    if (!pendingProfile.exists) {
      throw new Error('Profile not found');
    }

    const pendingData = pendingProfile.data()!;

    // Generate QR code
    const memorialUrl = `${process.env.FRONTEND_URL}/memorial/${profileId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(memorialUrl, {
      width: 300,
      margin: 2,
    });
    
    // Generate QR code as image buffer and upload to Firebase Storage
    const qrCodeImageBuffer = await QRCode.toBuffer(memorialUrl, {
      width: 300,
      margin: 2,
      type: 'png',
    });
    const qrCodeImageUrl = await uploadQRCodeToStorage(qrCodeImageBuffer, profileId);

    // Create user profile
    const userProfile = {
      uniqueUrl: profileId,
      ...pendingData,
      paymentId: payment.id,
      qrCodeData: qrCodeDataUrl,          // Data URL for inline display
      qrCodeImageUrl: qrCodeImageUrl,     // Public image URL from Firebase Storage
      memorialUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to collections
    await Promise.all([
      db.collection("user_profiles").doc(profileId).set(userProfile),
      db.collection("memorial_pages").doc(profileId).set({
        profileId,
        memorialUrl,
        qrCodeData: qrCodeDataUrl,          // Data URL for inline display
        qrCodeImageUrl: qrCodeImageUrl,     // Public image URL from Firebase Storage
        isActive: true,
        createdAt: new Date(),
      }),
      db.collection("pending_profiles").doc(profileId).update({
        status: "completed",
        paymentId: payment.id,
        paymentData: payment,
        processedAt: new Date(),
      })
    ]);

    // Cache in Redis if available
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      await redis.setex(`qr_code:${profileId}`, 86400, JSON.stringify({
        profileId,
        memorialUrl,
        qrCodeData: qrCodeDataUrl,          // Data URL for inline display
        qrCodeImageUrl: qrCodeImageUrl,     // Public image URL from Firebase Storage
        name: pendingData.name,
        cached_at: new Date().toISOString(),
      }));
    } catch (redisError) {
      console.error('Redis cache failed:', redisError);
      // Continue without cache
    }

    // Send confirmation email
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .qr-code { text-align: center; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Moto SOS Guardian</h1>
                <p>Confirmação de Cadastro</p>
              </div>
              <div class="content">
                <h2>Olá ${pendingData.name}!</h2>
                <p>Seu cadastro no Moto SOS Guardian foi realizado com sucesso!</p>
                <p><strong>Plano contratado:</strong> ${pendingData.selectedPlan === "premium" ? "Premium" : "Básico"}</p>
                
                <div class="qr-code">
                  <p><strong>Seu QR Code de emergência:</strong></p>
                  <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 200px;">
                </div>
                
                <p>Acesse sua página memorial através do link:</p>
                <p style="text-align: center;">
                  <a href="${memorialUrl}" class="button">Acessar Minha Página</a>
                </p>
                
                <p>Mantenha este QR Code sempre com você durante suas viagens!</p>
              </div>
              <div class="footer">
                <p>© 2024 Moto SOS Guardian. Todos os direitos reservados.</p>
                <p>Este é um email automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const command = new SendEmailCommand({
        FromEmailAddress: process.env.SES_FROM_EMAIL || "contact@memoryys.com",
        Destination: {
          ToAddresses: [pendingData.email],
        },
        Content: {
          Simple: {
            Subject: {
              Data: "Moto SOS Guardian - Cadastro Confirmado",
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: emailHtml,
                Charset: "UTF-8",
              },
              Text: {
                Data: `Olá ${pendingData.name}! Seu cadastro no Moto SOS Guardian foi realizado com sucesso. Acesse sua página: ${memorialUrl}`,
                Charset: "UTF-8",
              },
            },
          },
        },
      });

      await sesClient.send(command);
      console.log(`Email sent successfully to ${pendingData.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue without email - don't fail the profile creation
    }

    console.log(`Successfully processed profile ${profileId}`);
    return { success: true, profileId, memorialUrl };

  } catch (error) {
    console.error(`Error processing profile ${profileId}:`, error);
    
    // Mark as failed
    await db.collection("pending_profiles").doc(profileId).update({
      status: "failed",
      error: (error as Error).message,
      failedAt: new Date(),
    });
    
    throw error;
  }
}