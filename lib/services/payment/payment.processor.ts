import { z } from 'zod';
import { logInfo, logError, logWarning } from '../../utils/logger';
import { MercadoPagoService, PaymentDetails } from './mercadopago.service';
import { ProfileRepository } from '../../repositories/profile.repository';
import { PaymentRepository } from '../../repositories/payment.repository';
import { QueueService } from '../notification/queue.service';
import { generateCorrelationId } from '../../utils/ids';
import { PlanType, PendingProfile } from '../../domain/profile/profile.types';
import { JobType } from '../../types/queue.types';

// Schemas de validação
const PaymentDataSchema = z.object({
  uniqueUrl: z.string(),
  amount: z.number().positive(),
  planType: z.nativeEnum(PlanType),
  paymentMethod: z.string(),
  userEmail: z.string().email(),
  userName: z.string(),
  deviceId: z.string().optional(),
});

const ProcessingResultSchema = z.object({
  success: z.boolean(),
  paymentId: z.string().optional(),
  profileId: z.string().optional(),
  error: z.string().optional(),
  correlationId: z.string(),
});

// Tipos derivados
export type PaymentData = z.infer<typeof PaymentDataSchema>;
export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;

export interface PaymentProcessorConfig {
  maxRetries: number;
  retryDelayMs: number;
}

export class PaymentProcessor {
  private readonly mercadoPagoService: MercadoPagoService;
  private readonly profileRepository: ProfileRepository;
  private readonly paymentRepository: PaymentRepository;
  private readonly queueService: QueueService;
  private readonly config: PaymentProcessorConfig;

  constructor(
    mercadoPagoService: MercadoPagoService,
    profileRepository: ProfileRepository,
    paymentRepository: PaymentRepository,
    queueService: QueueService,
    config?: Partial<PaymentProcessorConfig>
  ) {
    this.mercadoPagoService = mercadoPagoService;
    this.profileRepository = profileRepository;
    this.paymentRepository = paymentRepository;
    this.queueService = queueService;
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      retryDelayMs: config?.retryDelayMs ?? 1000,
    };
  }

  /**
   * Processa um pagamento aprovado
   */
  async processApprovedPayment(
    paymentId: string,
    paymentData: PaymentDetails
  ): Promise<ProcessingResult> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    try {
      logInfo('Starting approved payment processing', {
        paymentId,
        correlationId,
        externalReference: paymentData.external_reference,
        amount: paymentData.transaction_amount,
      });

      // Validar estado do pagamento
      if (paymentData.status !== 'approved') {
        throw new Error(`Payment status is not approved: ${paymentData.status}`);
      }

      // Buscar perfil pendente
      const uniqueUrl = paymentData.external_reference;
      if (!uniqueUrl) {
        throw new Error('External reference (uniqueUrl) not found in payment');
      }

      const pendingProfile = await this.profileRepository.findPendingProfile(uniqueUrl);
      if (!pendingProfile) {
        throw new Error(`Pending profile not found for uniqueUrl: ${uniqueUrl}`);
      }

      // Validar valor do pagamento
      const expectedAmount = pendingProfile.planType === 'premium' ? 85.0 : 55.0;
      if (Math.abs(paymentData.transaction_amount - expectedAmount) > 0.01) {
        logWarning('Payment amount mismatch', {
          expected: expectedAmount,
          received: paymentData.transaction_amount,
          paymentId,
          correlationId,
        });
      }

      // Salvar log de pagamento
      await this.paymentRepository.savePaymentLog(
        paymentData.id.toString(),
        'payment_webhook_received',
        {
          externalReference: uniqueUrl,
          status: paymentData.status,
          statusDetail: paymentData.status_detail || '',
          amount: paymentData.transaction_amount,
          paymentMethodId: paymentData.payment_method_id,
          payerEmail: paymentData.payer.email,
        correlationId,
        processedAt: new Date(),
        metadata: {
          planType: pendingProfile.planType,
        },
      });

      // Enfileirar job de processamento final
      await this.queueService.enqueueProcessingJob({
        jobType: JobType.PROCESS_PROFILE,
        profileId: uniqueUrl, // Using uniqueUrl as profileId
        uniqueUrl,
        paymentId: paymentData.id.toString(),
        planType: pendingProfile.planType,
        profileData: {
          uniqueUrl: pendingProfile.uniqueUrl,
          planType: pendingProfile.planType,
          personalData: pendingProfile.personalData,
          medicalData: pendingProfile.medicalData,
          emergencyContacts: pendingProfile.emergencyContacts,
          vehicleData: pendingProfile.vehicleData,
          status: pendingProfile.status,
          createdAt: pendingProfile.createdAt,
          updatedAt: pendingProfile.updatedAt,
          paymentId: pendingProfile.paymentId,
          qrCodeUrl: pendingProfile.qrCodeUrl,
          memorialUrl: pendingProfile.memorialUrl,
        },
        paymentData: {
          id: paymentData.id.toString(),
          status: paymentData.status,
          amount: paymentData.transaction_amount,
          externalReference: paymentData.external_reference || uniqueUrl,
        },
        correlationId,
        retryCount: 0,
        maxRetries: 3
      });

      const duration = Date.now() - startTime;
      logInfo('Payment processing completed successfully', {
        paymentId,
        uniqueUrl,
        duration,
        correlationId,
      });

      return {
        success: true,
        paymentId: paymentData.id.toString(),
        profileId: uniqueUrl,
        correlationId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Failed to process approved payment', error as Error, {
        paymentId,
        duration,
        correlationId,
      });

      // Salvar erro no log de pagamento
      await this.paymentRepository.savePaymentLog(
        paymentId,
        'processing_failed',
        {
          externalReference: paymentData.external_reference || '',
          status: 'processing_failed',
          statusDetail: (error as Error).message,
          amount: paymentData.transaction_amount,
        paymentMethodId: paymentData.payment_method_id,
        payerEmail: paymentData.payer.email,
        correlationId,
        processedAt: new Date(),
        error: (error as Error).message,
      });

      return {
        success: false,
        error: (error as Error).message,
        correlationId,
      };
    }
  }

  /**
   * Trata falha de pagamento
   */
  async handlePaymentFailure(
    paymentId: string,
    error: Error
  ): Promise<ProcessingResult> {
    const correlationId = generateCorrelationId();

    try {
      logInfo('Handling payment failure', {
        paymentId,
        error: error.message,
        correlationId,
      });

      // Buscar detalhes do pagamento
      const paymentDetails = await this.mercadoPagoService.getPaymentDetails(paymentId);

      // Salvar log de falha
      await this.paymentRepository.savePaymentLog(
        paymentId,
        'payment_failed',
        {
          externalReference: paymentDetails.external_reference || '',
          status: 'failed',
          statusDetail: error.message,
          amount: paymentDetails.transaction_amount,
        paymentMethodId: paymentDetails.payment_method_id,
        payerEmail: paymentDetails.payer.email,
        correlationId,
        processedAt: new Date(),
        error: error.message,
      });

      // Enfileirar notificação de falha se houver email
      if (paymentDetails.payer.email) {
        await this.queueService.enqueueEmailJob({
          jobType: JobType.SEND_EMAIL,
          profileId: '',
          email: paymentDetails.payer.email,
          name: 'Cliente',
          subject: 'Falha no processamento do pagamento',
          template: 'failure',
          templateData: {
            qrCodeUrl: undefined,
            memorialUrl: '',
            planType: PlanType.BASIC,
            amount: paymentDetails.transaction_amount,
            paymentId,
          },
          correlationId,
          retryCount: 0,
          maxRetries: 3
        });
      }

      return {
        success: false,
        paymentId,
        error: error.message,
        correlationId,
      };
    } catch (processingError) {
      logError('Failed to handle payment failure', processingError as Error, {
        paymentId,
        originalError: error.message,
        correlationId,
      });

      return {
        success: false,
        error: `Failed to handle payment failure: ${(processingError as Error).message}`,
        correlationId,
      };
    }
  }

  /**
   * Reprocessa um pagamento falhado
   */
  async retryFailedPayment(
    paymentId: string,
    attempt: number = 1
  ): Promise<ProcessingResult> {
    const correlationId = generateCorrelationId();

    try {
      logInfo('Retrying failed payment', {
        paymentId,
        attempt,
        maxRetries: this.config.maxRetries,
        correlationId,
      });

      if (attempt > this.config.maxRetries) {
        throw new Error(`Max retry attempts (${this.config.maxRetries}) exceeded`);
      }

      // Buscar detalhes do pagamento
      const paymentDetails = await this.mercadoPagoService.getPaymentDetails(paymentId);

      // Verificar se o pagamento foi aprovado
      if (paymentDetails.status === 'approved') {
        // Processar pagamento aprovado
        return await this.processApprovedPayment(paymentId, paymentDetails);
      } else if (paymentDetails.status === 'pending' || paymentDetails.status === 'in_process') {
        // Aguardar e tentar novamente
        await this.delay(this.config.retryDelayMs * attempt);
        return await this.retryFailedPayment(paymentId, attempt + 1);
      } else {
        // Pagamento definitivamente falhou
        throw new Error(`Payment definitively failed with status: ${paymentDetails.status}`);
      }
    } catch (error) {
      logError('Failed to retry payment', error as Error, {
        paymentId,
        attempt,
        correlationId,
      });

      return await this.handlePaymentFailure(paymentId, error as Error);
    }
  }

  /**
   * Valida dados de pagamento
   */
  private validatePaymentData(data: unknown): PaymentData {
    try {
      return PaymentDataSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new Error(`Invalid payment data: ${issues}`);
      }
      throw error;
    }
  }

  /**
   * Aguarda por um período de tempo
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se um pagamento pode ser processado
   */
  async canProcessPayment(paymentId: string): Promise<boolean> {
    try {
      const paymentLog = await this.paymentRepository.findByPaymentId(paymentId);
      
      // Se já foi processado com sucesso, não processar novamente
      if (paymentLog && paymentLog.status === 'approved') {
        logWarning('Payment already processed', {
          paymentId,
          processedAt: new Date(),
        });
        return false;
      }

      // Se está em processamento, aguardar
      if (paymentLog && paymentLog.status === 'processing') {
        logWarning('Payment is already being processed', {
          paymentId,
          startedAt: new Date(),
        });
        return false;
      }

      return true;
    } catch (error) {
      logError('Error checking if payment can be processed', error as Error, {
        paymentId,
      });
      // Em caso de erro, permitir processamento para não bloquear
      return true;
    }
  }

  /**
   * Obtém estatísticas de processamento
   */
  async getProcessingStats(period: { from: Date; to: Date }): Promise<{
    total: number;
    approved: number;
    failed: number;
    pending: number;
    averageProcessingTime: number;
  }> {
    try {
      const payments = await this.paymentRepository.getPaymentHistory(
        `${period.from.toISOString()}-${period.to.toISOString()}`
      );

      const stats = {
        total: payments.length,
        approved: payments.filter(p => p.eventType === 'approved').length,
        failed: payments.filter(p => p.eventType === 'failed' || p.eventType === 'processing_failed').length,
        pending: payments.filter(p => p.eventType === 'pending' || p.eventType === 'in_process').length,
        averageProcessingTime: 0,
      };

      // Calcular tempo médio de processamento
      const processingTimes = payments
        .filter(p => p.eventData && typeof p.eventData.processingTime === 'number')
        .map(p => p.eventData.processingTime as number);

      if (processingTimes.length > 0) {
        stats.averageProcessingTime = 
          processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      }

      logInfo('Processing statistics calculated', {
        period: { from: period.from.toISOString(), to: period.to.toISOString() },
        stats,
      });

      return stats;
    } catch (error) {
      logError('Failed to get processing statistics', error as Error);
      throw error;
    }
  }
}