/**
 * Payment Repository Interface
 * CRITICAL: Defines all required methods for payment data operations
 * Following Interface-First Development pattern
 */

import { Payment, PaymentStatus, PaymentLogData } from './payment.types';

/**
 * PaymentRepository Interface
 * Manages all payment-related data operations
 */
export interface IPaymentRepository {
  /**
   * Save payment log data for audit trail
   * @param data Payment log data to be saved
   * @returns Promise resolving when log is saved
   */
  savePaymentLog(data: PaymentLogData): Promise<void>;

  /**
   * Find payment by MercadoPago payment ID
   * @param paymentId MercadoPago payment ID
   * @returns Payment if found, null otherwise
   */
  findByPaymentId(paymentId: string): Promise<Payment | null>;

  /**
   * Get payment history for a specific user
   * @param userId User identifier
   * @returns Array of payments for the user
   */
  getPaymentHistory(userId: string): Promise<Payment[]>;

  /**
   * Update payment status
   * @param paymentId Payment identifier
   * @param status New payment status
   * @returns Promise resolving when status is updated
   */
  updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void>;

  /**
   * Find payment by external reference (profile ID)
   * @param externalReference Profile/reference ID
   * @returns Payment if found, null otherwise
   */
  findByExternalReference(externalReference: string): Promise<Payment | null>;

  /**
   * Log payment webhook event
   * @param webhookData Raw webhook data
   * @param correlationId Correlation ID for tracking
   * @returns Promise resolving when event is logged
   */
  logWebhookEvent(webhookData: unknown, correlationId: string): Promise<void>;
}