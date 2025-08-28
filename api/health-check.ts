import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MercadoPagoService } from "../lib/services/payment/mercadopago.service.js";
import { getPaymentConfig } from "../lib/config/index.js";
import { logInfo, logError, logWarning } from "../lib/utils/logger.js";
import { generateCorrelationId } from "../lib/utils/ids.js";

/**
 * Health Check Endpoint
 * 
 * Validates MercadoPago configuration and token
 * Helps diagnose UNAUTHORIZED errors
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = generateCorrelationId();
  
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
    const config = getPaymentConfig();
    const service = new MercadoPagoService(config);
    
    logInfo("Running health check", { correlationId });
    
    const healthStatus = {
      status: "checking",
      correlationId,
      timestamp: new Date().toISOString(),
      checks: {
        tokenPresent: false,
        tokenValid: false,
        paymentMethodsAvailable: false,
        pixEnabled: false,
        cardEnabled: false,
      },
      errors: [] as string[],
      warnings: [] as string[],
      availablePaymentMethods: [] as string[],
    };
    
    // Check 1: Token present
    if (config.accessToken) {
      healthStatus.checks.tokenPresent = true;
      const tokenMasked = `${config.accessToken.substring(0, 20)}...`;
      logInfo("Token present", { tokenMasked, correlationId });
    } else {
      healthStatus.errors.push("Access token not configured");
      logError("Access token missing", new Error("No token"), { correlationId });
    }
    
    // Check 2: Token valid by searching payments
    try {
      // Simple search to validate token
      const searchResult = await service.payment.search({
        options: {
          limit: 1,
          sort: 'date_created',
          criteria: 'desc'
        }
      });
      
      healthStatus.checks.tokenValid = true;
      logInfo("Token validated successfully", { correlationId });
      
      // Check 3: Verify we can create a payment (dry run)
      // Since MercadoPago SDK doesn't have a payment_methods method,
      // we'll test by checking if we can search payments (validates account permissions)
      try {
        // Try to search recent payments to verify account has proper permissions
        const recentPayments = await service.payment.search({
          options: {
            limit: 5,
            sort: 'date_created',
            criteria: 'desc'
          }
        });
        
        healthStatus.checks.paymentMethodsAvailable = true;
        
        // Check if any PIX payments exist
        if (recentPayments.results && recentPayments.results.length > 0) {
          const pixPayments = recentPayments.results.filter((p: any) => p.payment_method_id === 'pix');
          const cardPayments = recentPayments.results.filter((p: any) => 
            p.payment_type_id === 'credit_card' || p.payment_type_id === 'debit_card'
          );
          
          if (pixPayments.length > 0) {
            healthStatus.checks.pixEnabled = true;
            logInfo("PIX payments found in history", { correlationId });
          } else {
            healthStatus.warnings.push("No PIX payments in history - verify PIX is enabled");
          }
          
          if (cardPayments.length > 0) {
            healthStatus.checks.cardEnabled = true;
            logInfo("Card payments found in history", { correlationId });
          } else {
            healthStatus.warnings.push("No card payments in history");
          }
        } else {
          healthStatus.warnings.push("No payment history found - new account or no transactions");
          // For new accounts, assume methods are available
          healthStatus.checks.pixEnabled = true;
          healthStatus.checks.cardEnabled = true;
        }
        
        logInfo("Payment search successful - account has proper permissions", { correlationId });
        
      } catch (error) {
        healthStatus.errors.push(`Error verifying payment permissions: ${error}`);
        logError("Exception verifying payments", error as Error, { correlationId });
      }
      
    } catch (error) {
      healthStatus.checks.tokenValid = false;
      const errorMessage = (error as any)?.message || "Unknown error";
      
      if (errorMessage.includes("UNAUTHORIZED") || errorMessage.includes("401")) {
        healthStatus.errors.push("Token is invalid or expired - regenerate in MercadoPago dashboard");
        logError("Token validation failed - UNAUTHORIZED", error as Error, { correlationId });
      } else {
        healthStatus.errors.push(`Token validation error: ${errorMessage}`);
        logError("Token validation failed", error as Error, { correlationId });
      }
    }
    
    // Determine overall status
    if (healthStatus.errors.length > 0) {
      healthStatus.status = "unhealthy";
    } else if (healthStatus.warnings.length > 0) {
      healthStatus.status = "degraded";
    } else if (Object.values(healthStatus.checks).every(check => check === true)) {
      healthStatus.status = "healthy";
    } else {
      healthStatus.status = "partial";
    }
    
    // Add recommendations
    const recommendations = [];
    
    if (!healthStatus.checks.tokenValid) {
      recommendations.push("1. Regenerate access token in MercadoPago dashboard");
      recommendations.push("2. Ensure token is from PRODUCTION credentials, not test");
      recommendations.push("3. Verify account is active and not suspended");
    }
    
    if (!healthStatus.checks.pixEnabled) {
      recommendations.push("Enable PIX in your MercadoPago account settings");
      recommendations.push("Verify your account is a Brazilian business account");
    }
    
    if (healthStatus.warnings.length > 0 || healthStatus.errors.length > 0) {
      recommendations.push("Check MercadoPago dashboard for account restrictions");
      recommendations.push("Ensure all required business information is complete");
    }
    
    const statusCode = healthStatus.status === "healthy" ? 200 : 
                       healthStatus.status === "degraded" || healthStatus.status === "partial" ? 206 :
                       503;
    
    return res.status(statusCode).json({
      ...healthStatus,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      documentation: "https://www.mercadopago.com.br/developers/pt/reference",
    });
    
  } catch (error) {
    logError("Health check failed catastrophically", error as Error, { correlationId });
    
    return res.status(500).json({
      status: "error",
      error: "Health check failed",
      message: (error as Error).message,
      correlationId,
    });
  }
}