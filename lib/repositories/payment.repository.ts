import { getFirestore, Firestore, CollectionReference, Query, FieldPath } from 'firebase-admin/firestore';
import { Payment } from '../domain/payment/payment.entity';
import {
  PaymentData,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  PaymentProcessingResult,
} from '../domain/payment/payment.types';
import { PaymentQueryData, PaymentStatsQueryData } from '../domain/payment/payment.validators';
import { logInfo, logError } from '../utils/logger';

/**
 * Payment Repository
 * 
 * This repository handles all data access operations for payments.
 * It follows the repository pattern and provides type-safe database operations
 * with comprehensive audit logging.
 */
export class PaymentRepository {
  private readonly db: Firestore;
  private readonly paymentsCollection: CollectionReference;
  private readonly paymentEventsCollection: CollectionReference;
  private readonly paymentStatsCollection: CollectionReference;

  constructor() {
    this.db = getFirestore();
    this.paymentsCollection = this.db.collection('payments');
    this.paymentEventsCollection = this.db.collection('payment_events');
    this.paymentStatsCollection = this.db.collection('payment_stats');
  }

  /**
   * Creates a new payment in the database
   */
  async create(payment: Payment, correlationId?: string): Promise<void> {
    try {
      logInfo('Creating payment in database', {
        correlationId,
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        planType: payment.planType,
      });

      const data = this.mapPaymentToFirestore(payment.toJSON());
      await this.paymentsCollection.doc(payment.id).set(data);

      // Log payment creation event
      await this.logPaymentEvent(payment.id, 'payment_created', {
        status: payment.status,
        amount: payment.amount,
        planType: payment.planType,
      }, correlationId);

      logInfo('Payment created successfully', {
        correlationId,
        paymentId: payment.id,
      });
    } catch (error) {
      logError('Error creating payment', error as Error, {
        correlationId,
        paymentId: payment.id,
      });
      throw error;
    }
  }

  /**
   * Updates an existing payment
   */
  async update(payment: Payment, correlationId?: string): Promise<void> {
    try {
      logInfo('Updating payment in database', {
        correlationId,
        paymentId: payment.id,
        status: payment.status,
      });

      const data = this.mapPaymentToFirestore(payment.toJSON());
      await this.paymentsCollection.doc(payment.id).update(data);

      // Log payment update event
      await this.logPaymentEvent(payment.id, 'payment_updated', {
        status: payment.status,
        updatedAt: new Date().toISOString(),
      }, correlationId);

      logInfo('Payment updated successfully', {
        correlationId,
        paymentId: payment.id,
      });
    } catch (error) {
      logError('Error updating payment', error as Error, {
        correlationId,
        paymentId: payment.id,
      });
      throw error;
    }
  }

  /**
   * Finds a payment by ID
   */
  async findById(paymentId: string, correlationId?: string): Promise<Payment | null> {
    try {
      logInfo('Finding payment by ID', { correlationId, paymentId });

      const doc = await this.paymentsCollection.doc(paymentId).get();

      if (!doc.exists) {
        logInfo('Payment not found', { correlationId, paymentId });
        return null;
      }

      const data = doc.data();
      if (!data) {
        logInfo('Payment document has no data', { correlationId, paymentId });
        return null;
      }

      const paymentData = this.mapFirestoreToPayment(data, paymentId);
      const payment = Payment.fromJSON(paymentData);

      logInfo('Payment found successfully', {
        correlationId,
        paymentId,
        status: payment.status,
      });

      return payment;
    } catch (error) {
      logError('Error finding payment by ID', error as Error, {
        correlationId,
        paymentId,
      });
      throw error;
    }
  }

  /**
   * Finds a payment by external ID (MercadoPago ID)
   */
  async findByExternalId(externalId: string, correlationId?: string): Promise<Payment | null> {
    try {
      logInfo('Finding payment by external ID', { correlationId, externalId });

      const querySnapshot = await this.paymentsCollection
        .where('externalId', '==', externalId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        logInfo('Payment not found by external ID', { correlationId, externalId });
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const paymentData = this.mapFirestoreToPayment(data, doc.id);
      const payment = Payment.fromJSON(paymentData);

      logInfo('Payment found by external ID', {
        correlationId,
        externalId,
        paymentId: payment.id,
      });

      return payment;
    } catch (error) {
      logError('Error finding payment by external ID', error as Error, {
        correlationId,
        externalId,
      });
      throw error;
    }
  }

  /**
   * Finds a payment by external reference
   */
  async findByExternalReference(externalReference: string, correlationId?: string): Promise<Payment | null> {
    try {
      logInfo('Finding payment by external reference', { correlationId, externalReference });

      const querySnapshot = await this.paymentsCollection
        .where('externalReference', '==', externalReference)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        logInfo('Payment not found by external reference', { correlationId, externalReference });
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const paymentData = this.mapFirestoreToPayment(data, doc.id);
      const payment = Payment.fromJSON(paymentData);

      logInfo('Payment found by external reference', {
        correlationId,
        externalReference,
        paymentId: payment.id,
      });

      return payment;
    } catch (error) {
      logError('Error finding payment by external reference', error as Error, {
        correlationId,
        externalReference,
      });
      throw error;
    }
  }

  /**
   * Finds payments by profile ID
   */
  async findByProfileId(profileId: string, correlationId?: string): Promise<Payment[]> {
    try {
      logInfo('Finding payments by profile ID', { correlationId, profileId });

      const querySnapshot = await this.paymentsCollection
        .where('profileId', '==', profileId)
        .orderBy('createdAt', 'desc')
        .get();

      const payments: Payment[] = [];
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const paymentData = this.mapFirestoreToPayment(data, doc.id);
        const payment = Payment.fromJSON(paymentData);
        payments.push(payment);
      }

      logInfo('Payments found by profile ID', {
        correlationId,
        profileId,
        count: payments.length,
      });

      return payments;
    } catch (error) {
      logError('Error finding payments by profile ID', error as Error, {
        correlationId,
        profileId,
      });
      throw error;
    }
  }

  /**
   * Searches payments with filters and pagination
   */
  async search(
    queryData: PaymentQueryData,
    correlationId?: string
  ): Promise<{ payments: Payment[]; total: number; hasMore: boolean }> {
    try {
      logInfo('Searching payments', { correlationId, queryData });

      let query: Query = this.paymentsCollection;

      // Apply filters
      if (queryData.status) {
        query = query.where('status', '==', queryData.status);
      }

      if (queryData.method) {
        query = query.where('method', '==', queryData.method);
      }

      if (queryData.profileId) {
        query = query.where('profileId', '==', queryData.profileId);
      }

      if (queryData.externalReference) {
        query = query.where('externalReference', '==', queryData.externalReference);
      }

      if (queryData.dateFrom) {
        query = query.where('createdAt', '>=', queryData.dateFrom);
      }

      if (queryData.dateTo) {
        query = query.where('createdAt', '<=', queryData.dateTo);
      }

      // Apply ordering and pagination
      query = query.orderBy('createdAt', 'desc');

      if (queryData.offset > 0) {
        query = query.offset(queryData.offset);
      }

      query = query.limit(queryData.limit + 1); // Get one extra to check if there are more

      const querySnapshot = await query.get();
      const docs = querySnapshot.docs;

      // Check if there are more results
      const hasMore = docs.length > queryData.limit;
      const paymentDocs = hasMore ? docs.slice(0, queryData.limit) : docs;

      const payments: Payment[] = [];
      for (const doc of paymentDocs) {
        const data = doc.data();
        const paymentData = this.mapFirestoreToPayment(data, doc.id);
        const payment = Payment.fromJSON(paymentData);
        payments.push(payment);
      }

      // Get total count for pagination info
      const totalQuery = this.buildCountQuery(queryData);
      const totalSnapshot = await totalQuery.count().get();
      const total = totalSnapshot.data().count;

      logInfo('Payment search completed', {
        correlationId,
        resultCount: payments.length,
        total,
        hasMore,
      });

      return { payments, total, hasMore };
    } catch (error) {
      logError('Error searching payments', error as Error, {
        correlationId,
        queryData,
      });
      throw error;
    }
  }

  /**
   * Gets payments requiring processing (failed or pending)
   */
  async findPaymentsRequiringProcessing(correlationId?: string): Promise<Payment[]> {
    try {
      logInfo('Finding payments requiring processing', { correlationId });

      const querySnapshot = await this.paymentsCollection
        .where('status', 'in', [PaymentStatus.PENDING, PaymentStatus.PROCESSING])
        .orderBy('createdAt', 'asc')
        .limit(50) // Process in batches
        .get();

      const payments: Payment[] = [];
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const paymentData = this.mapFirestoreToPayment(data, doc.id);
        const payment = Payment.fromJSON(paymentData);
        payments.push(payment);
      }

      logInfo('Found payments requiring processing', {
        correlationId,
        count: payments.length,
      });

      return payments;
    } catch (error) {
      logError('Error finding payments requiring processing', error as Error, {
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Gets payments that need refund processing
   */
  async findRefundablePayments(correlationId?: string): Promise<Payment[]> {
    try {
      logInfo('Finding refundable payments', { correlationId });

      const querySnapshot = await this.paymentsCollection
        .where('status', '==', PaymentStatus.APPROVED)
        .where('refunds', '!=', null)
        .limit(25)
        .get();

      const payments: Payment[] = [];
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const paymentData = this.mapFirestoreToPayment(data, doc.id);
        const payment = Payment.fromJSON(paymentData);
        
        // Check if payment has pending refunds
        if (payment.hasRefunds() && payment.canBeRefunded()) {
          payments.push(payment);
        }
      }

      logInfo('Found refundable payments', {
        correlationId,
        count: payments.length,
      });

      return payments;
    } catch (error) {
      logError('Error finding refundable payments', error as Error, {
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Gets payment statistics for reporting
   */
  async getStatistics(
    queryData: PaymentStatsQueryData,
    correlationId?: string
  ): Promise<{
    total: number;
    totalAmount: number;
    byStatus: Record<PaymentStatus, { count: number; amount: number }>;
    byMethod: Record<PaymentMethod, { count: number; amount: number }>;
    byPlan: Record<'basic' | 'premium', { count: number; amount: number }>;
    refundedAmount: number;
    netAmount: number;
  }> {
    try {
      logInfo('Getting payment statistics', { correlationId, queryData });

      const querySnapshot = await this.paymentsCollection
        .where('createdAt', '>=', queryData.dateFrom)
        .where('createdAt', '<=', queryData.dateTo)
        .get();

      const stats = {
        total: querySnapshot.size,
        totalAmount: 0,
        byStatus: {} as Record<PaymentStatus, { count: number; amount: number }>,
        byMethod: {} as Record<PaymentMethod, { count: number; amount: number }>,
        byPlan: {} as Record<'basic' | 'premium', { count: number; amount: number }>,
        refundedAmount: 0,
        netAmount: 0,
      };

      // Initialize counters
      Object.values(PaymentStatus).forEach(status => {
        stats.byStatus[status] = { count: 0, amount: 0 };
      });
      Object.values(PaymentMethod).forEach(method => {
        stats.byMethod[method] = { count: 0, amount: 0 };
      });
      stats.byPlan.basic = { count: 0, amount: 0 };
      stats.byPlan.premium = { count: 0, amount: 0 };

      // Process payments
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const paymentData = this.mapFirestoreToPayment(data, doc.id);
        const payment = Payment.fromJSON(paymentData);

        stats.totalAmount += payment.amount;

        // Count by status
        if (payment.status) {
          stats.byStatus[payment.status].count++;
          stats.byStatus[payment.status].amount += payment.amount;
        }

        // Count by method
        if (payment.method) {
          stats.byMethod[payment.method].count++;
          stats.byMethod[payment.method].amount += payment.amount;
        }

        // Count by plan
        stats.byPlan[payment.planType].count++;
        stats.byPlan[payment.planType].amount += payment.amount;

        // Calculate refunded amount
        if (payment.hasRefunds()) {
          stats.refundedAmount += payment.getTotalRefunded();
        }

        // Calculate net amount
        stats.netAmount += payment.getNetAmount();
      }

      logInfo('Payment statistics generated', { correlationId, stats });

      return stats;
    } catch (error) {
      logError('Error getting payment statistics', error as Error, {
        correlationId,
        queryData,
      });
      throw error;
    }
  }

  /**
   * Deletes a payment (soft delete by marking as cancelled)
   */
  async delete(paymentId: string, reason: string, correlationId?: string): Promise<void> {
    try {
      logInfo('Soft deleting payment', { correlationId, paymentId, reason });

      await this.paymentsCollection.doc(paymentId).update({
        status: PaymentStatus.CANCELLED,
        updatedAt: new Date(),
        metadata: {
          deletionReason: reason,
          deletedAt: new Date().toISOString(),
        },
      });

      // Log payment deletion event
      await this.logPaymentEvent(paymentId, 'payment_deleted', {
        reason,
      }, correlationId);

      logInfo('Payment soft deleted successfully', { correlationId, paymentId });
    } catch (error) {
      logError('Error deleting payment', error as Error, {
        correlationId,
        paymentId,
      });
      throw error;
    }
  }

  /**
   * Logs payment events for audit trail
   */
  async logPaymentEvent(
    paymentId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    correlationId?: string
  ): Promise<void> {
    try {
      const eventId = `${paymentId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await this.paymentEventsCollection.doc(eventId).set({
        paymentId,
        eventType,
        eventData,
        timestamp: new Date(),
        correlationId: correlationId || null,
      });

      logInfo('Payment event logged', { correlationId, paymentId, eventType });
    } catch (error) {
      logError('Error logging payment event', error as Error, {
        correlationId,
        paymentId,
        eventType,
      });
      // Don't throw - event logging is not critical
    }
  }

  /**
   * Gets payment audit trail
   */
  async getPaymentEvents(paymentId: string, correlationId?: string): Promise<Array<{
    id: string;
    eventType: string;
    eventData: Record<string, unknown>;
    timestamp: Date;
    correlationId?: string;
  }>> {
    try {
      logInfo('Getting payment events', { correlationId, paymentId });

      const querySnapshot = await this.paymentEventsCollection
        .where('paymentId', '==', paymentId)
        .orderBy('timestamp', 'desc')
        .get();

      const events = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          eventType: data.eventType as string,
          eventData: data.eventData as Record<string, unknown>,
          timestamp: data.timestamp.toDate(),
          correlationId: data.correlationId as string | undefined,
        };
      });

      logInfo('Payment events retrieved', {
        correlationId,
        paymentId,
        eventCount: events.length,
      });

      return events;
    } catch (error) {
      logError('Error getting payment events', error as Error, {
        correlationId,
        paymentId,
      });
      throw error;
    }
  }

  /**
   * Checks if a payment exists
   */
  async exists(paymentId: string, correlationId?: string): Promise<boolean> {
    try {
      const doc = await this.paymentsCollection.doc(paymentId).get();
      const exists = doc.exists;

      logInfo('Payment existence check', { correlationId, paymentId, exists });

      return exists;
    } catch (error) {
      logError('Error checking payment existence', error as Error, {
        correlationId,
        paymentId,
      });
      throw error;
    }
  }

  /**
   * Saves a payment log entry for audit trail
   */
  async savePaymentLog(
    paymentId: string,
    logType: string,
    logData: Record<string, unknown>,
    correlationId?: string
  ): Promise<void> {
    try {
      logInfo('Saving payment log', {
        correlationId,
        paymentId,
        logType,
      });

      await this.logPaymentEvent(paymentId, logType, logData, correlationId);

      logInfo('Payment log saved successfully', {
        correlationId,
        paymentId,
        logType,
      });
    } catch (error) {
      logError('Error saving payment log', error as Error, {
        correlationId,
        paymentId,
        logType,
      });
      throw error;
    }
  }

  /**
   * Finds a payment by payment ID (alias for findById)
   */
  async findByPaymentId(paymentId: string, correlationId?: string): Promise<Payment | null> {
    return this.findById(paymentId, correlationId);
  }

  /**
   * Gets payment history for a payment
   */
  async getPaymentHistory(
    paymentId: string,
    correlationId?: string
  ): Promise<Array<{
    id: string;
    eventType: string;
    eventData: Record<string, unknown>;
    timestamp: Date;
    correlationId?: string;
  }>> {
    return this.getPaymentEvents(paymentId, correlationId);
  }

  // Private helper methods

  private buildCountQuery(queryData: PaymentQueryData): Query {
    let query: Query = this.paymentsCollection;

    if (queryData.status) {
      query = query.where('status', '==', queryData.status);
    }

    if (queryData.method) {
      query = query.where('method', '==', queryData.method);
    }

    if (queryData.profileId) {
      query = query.where('profileId', '==', queryData.profileId);
    }

    if (queryData.externalReference) {
      query = query.where('externalReference', '==', queryData.externalReference);
    }

    if (queryData.dateFrom) {
      query = query.where('createdAt', '>=', queryData.dateFrom);
    }

    if (queryData.dateTo) {
      query = query.where('createdAt', '<=', queryData.dateTo);
    }

    return query;
  }

  private mapPaymentToFirestore(payment: PaymentData): Record<string, unknown> {
    return {
      id: payment.id,
      externalId: payment.externalId || null,
      preferenceId: payment.preferenceId || null,
      status: payment.status,
      method: payment.method || null,
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      installments: payment.installments || null,
      payer: payment.payer,
      profileId: payment.profileId || null,
      planType: payment.planType,
      description: payment.description || null,
      externalReference: payment.externalReference,
      metadata: payment.metadata || null,
      refunds: payment.refunds || [],
      fees: payment.fees || [],
      deviceId: payment.deviceId || null,
      ipAddress: payment.ipAddress || null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      approvedAt: payment.approvedAt || null,
      rejectedAt: payment.rejectedAt || null,
      cancelledAt: payment.cancelledAt || null,
      refundedAt: payment.refundedAt || null,
    };
  }

  private mapFirestoreToPayment(data: Record<string, unknown>, paymentId: string): PaymentData {
    return {
      id: paymentId,
      externalId: data.externalId as string | undefined,
      preferenceId: data.preferenceId as string | undefined,
      status: data.status as PaymentStatus,
      method: data.method as PaymentMethod | undefined,
      type: data.type as PaymentType,
      amount: data.amount as number,
      currency: data.currency as string,
      installments: data.installments as number | undefined,
      payer: data.payer as PaymentData['payer'],
      profileId: data.profileId as string | undefined,
      planType: data.planType as 'basic' | 'premium',
      description: data.description as string | undefined,
      externalReference: data.externalReference as string,
      metadata: data.metadata as Record<string, unknown> | undefined,
      refunds: (data.refunds as PaymentData['refunds']) || [],
      fees: data.fees as PaymentData['fees'] | undefined,
      deviceId: data.deviceId as string | undefined,
      ipAddress: data.ipAddress as string | undefined,
      createdAt: (data.createdAt as Date) || new Date(),
      updatedAt: (data.updatedAt as Date) || new Date(),
      approvedAt: data.approvedAt as Date | undefined,
      rejectedAt: data.rejectedAt as Date | undefined,
      cancelledAt: data.cancelledAt as Date | undefined,
      refundedAt: data.refundedAt as Date | undefined,
    };
  }
}