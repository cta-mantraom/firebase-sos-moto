import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirebaseConfig } from "../lib/config/index.js";
import { logInfo, logError, logWarning } from "../lib/utils/logger.js";
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

// Query params schema
const QueryParamsSchema = z.object({
  paymentId: z.string().optional(),
  uniqueUrl: z.string().optional(),
  id: z.string().optional(), // Legacy support
});

/**
 * Check Payment Status Endpoint
 * 
 * Used by frontend to poll for payment approval status.
 * This prevents premature redirection and ensures payment is confirmed.
 * 
 * CRITICAL: This solves the "sistema aceita pagamentos falsos" issue
 * by making frontend wait for actual approval before redirecting.
 * 
 * Query params:
 * - paymentId: The payment ID to check
 * - uniqueUrl or id: The unique URL to check
 * 
 * Returns:
 * - status: pending | approved | rejected | processing | error
 * - shouldRedirect: boolean indicating if frontend should redirect
 * - redirectUrl: where to redirect if approved
 * - pixData: PIX QR code data if applicable
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      correlationId,
    });
  }

  try {
    // Parse query parameters
    const queryValidation = QueryParamsSchema.safeParse(req.query);
    
    if (!queryValidation.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: queryValidation.error.errors,
        correlationId,
      });
    }

    const { paymentId, uniqueUrl, id } = queryValidation.data;
    const profileId = uniqueUrl || id; // Support both parameter names

    if (!paymentId && !profileId) {
      return res.status(400).json({
        error: "Either paymentId or uniqueUrl/id is required",
        correlationId,
      });
    }

    logInfo("Checking payment status", {
      correlationId,
      paymentId,
      profileId,
      source: "polling",
    });

    const db = getFirestore();

    // First, check if profile already exists (payment approved and processed)
    if (profileId) {
      const profileDoc = await db
        .collection("profiles")
        .doc(profileId)
        .get();

      if (profileDoc.exists) {
        const profile = profileDoc.data()!;
        
        logInfo("Profile found - payment approved", {
          correlationId,
          profileId,
          hasQRCode: !!profile.qrCodeUrl,
        });

        return res.status(200).json({
          status: "approved",
          shouldRedirect: true,
          redirectUrl: `/success?id=${profileId}`,
          profileUrl: profile.memorialUrl,
          qrCodeUrl: profile.qrCodeUrl,
          message: "Pagamento aprovado e perfil criado com sucesso",
          correlationId,
          processingTime: Date.now() - startTime,
        });
      }
    }

    // Check pending profiles collection
    let pendingProfile = null;
    
    if (profileId) {
      const pendingDoc = await db
        .collection("pending_profiles")
        .doc(profileId)
        .get();
      
      if (pendingDoc.exists) {
        pendingProfile = pendingDoc.data();
      }
    } else if (paymentId) {
      // Search by paymentId
      const pendingQuery = await db
        .collection("pending_profiles")
        .where("paymentId", "==", paymentId)
        .limit(1)
        .get();
      
      if (!pendingQuery.empty) {
        pendingProfile = pendingQuery.docs[0].data();
      }
    }

    if (!pendingProfile) {
      logInfo("No profile found for payment", {
        correlationId,
        paymentId,
        profileId,
      });

      return res.status(200).json({
        status: "not_found",
        shouldRedirect: false,
        message: "Pagamento não encontrado",
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    // Check payment status
    const paymentStatus = pendingProfile.paymentStatus || pendingProfile.status;

    if (paymentStatus === "approved" || paymentStatus === "payment_approved") {
      // Payment approved but profile not yet created (still processing)
      logInfo("Payment approved, profile creation in progress", {
        correlationId,
        profileId: pendingProfile.uniqueUrl,
        paymentId: pendingProfile.paymentId,
      });

      return res.status(200).json({
        status: "processing",
        shouldRedirect: false,
        message: "Pagamento aprovado! Criando seu perfil de emergência...",
        progress: 75, // Percentage for UI progress bar
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      logInfo("Payment rejected or cancelled", {
        correlationId,
        status: paymentStatus,
        statusDetail: pendingProfile.paymentStatusDetail,
      });

      return res.status(200).json({
        status: "rejected",
        shouldRedirect: true,
        redirectUrl: `/failure?id=${pendingProfile.uniqueUrl}&reason=${paymentStatus}`,
        message: paymentStatus === "rejected" 
          ? "Pagamento recusado. Por favor, verifique seus dados e tente novamente."
          : "Pagamento cancelado.",
        statusDetail: pendingProfile.paymentStatusDetail,
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    // Check for PIX payment that needs QR code display
    if (pendingProfile.paymentId) {
      const pixPaymentDoc = await db
        .collection("pix_payments")
        .doc(pendingProfile.paymentId)
        .get();

      if (pixPaymentDoc.exists) {
        const pixData = pixPaymentDoc.data()!;
        
        logInfo("PIX payment found - returning QR code", {
          correlationId,
          paymentId: pendingProfile.paymentId,
          hasQRCode: !!pixData.qrCodeBase64,
        });

        return res.status(200).json({
          status: "pending_pix",
          shouldRedirect: false,
          pixData: {
            qrCode: pixData.qrCode,
            qrCodeBase64: pixData.qrCodeBase64,
            ticketUrl: pixData.ticketUrl,
            amount: pixData.amount,
          },
          message: "Escaneie o QR Code para pagar com PIX",
          instructions: [
            "1. Abra o app do seu banco",
            "2. Procure a opção PIX",
            "3. Escaneie o QR Code",
            "4. Confirme o pagamento"
          ],
          correlationId,
          processingTime: Date.now() - startTime,
        });
      }
    }

    // Payment still pending
    logInfo("Payment still pending", {
      correlationId,
      status: paymentStatus,
      createdAt: pendingProfile.createdAt,
    });

    // Calculate time since creation
    const createdAt = new Date(pendingProfile.createdAt).getTime();
    const timePending = Date.now() - createdAt;
    const timeoutMs = 10 * 60 * 1000; // 10 minutes

    if (timePending > timeoutMs) {
      logWarning("Payment timeout", {
        correlationId,
        timePending,
        timeoutMs,
      });

      return res.status(200).json({
        status: "timeout",
        shouldRedirect: true,
        redirectUrl: `/failure?id=${pendingProfile.uniqueUrl}&reason=timeout`,
        message: "Tempo de pagamento expirado. Por favor, tente novamente.",
        correlationId,
        processingTime: Date.now() - startTime,
      });
    }

    // Calculate progress for UI
    const progress = Math.min(Math.floor((timePending / timeoutMs) * 50), 50); // Max 50% while pending

    return res.status(200).json({
      status: "pending",
      shouldRedirect: false,
      message: "Aguardando confirmação do pagamento...",
      progress, // Percentage for UI progress bar
      timeElapsed: Math.floor(timePending / 1000), // seconds
      maxTime: Math.floor(timeoutMs / 1000), // seconds
      correlationId,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    logError("Error checking payment status", error as Error, {
      correlationId,
    });

    return res.status(500).json({
      error: "Failed to check payment status",
      message: "Erro ao verificar status do pagamento. Tente novamente.",
      correlationId,
      processingTime: Date.now() - startTime,
    });
  }
}