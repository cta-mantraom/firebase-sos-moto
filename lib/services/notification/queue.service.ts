import { z } from 'zod';
import { logInfo, logError } from '../../utils/logger';
import { QStashService } from '../queue/qstash.service';
import { generateCorrelationId } from '../../utils/ids';
// CORRETO: Import centralized schemas from types layer (no duplicate schemas)
import { 
  EmailJobDataSchema, 
  ProcessingJobDataSchema,
  type EmailJobData,
  type ProcessingJobData 
} from '../../types/queue.types';

// Local schemas (not duplicated elsewhere)
const QueueStatusSchema = z.object({
  jobId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  attempts: z.number(),
  lastAttempt: z.date().optional(),
  nextAttempt: z.date().optional(),
  error: z.string().optional(),
});

const JobDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    data: EmailJobDataSchema,
  }),
  z.object({
    type: z.literal('processing'),
    data: ProcessingJobDataSchema,
  }),
]);
export type QueueStatus = z.infer<typeof QueueStatusSchema>;
export type JobData = z.infer<typeof JobDataSchema>;

export interface QueueServiceConfig {
  maxRetries: number;
  retryDelayMs: number;
  defaultTTL: number;
  baseUrl: string;
}

export interface QueueMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
}

export class QueueService {
  private readonly qstashService: QStashService;
  private readonly config: QueueServiceConfig;
  private readonly jobRegistry: Map<string, QueueStatus>;

  constructor(
    qstashService: QStashService,
    config?: Partial<QueueServiceConfig>
  ) {
    this.qstashService = qstashService;
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      retryDelayMs: config?.retryDelayMs ?? 5000,
      defaultTTL: config?.defaultTTL ?? 3600,
      baseUrl: config?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.sosmoto.com.br',
    };
    this.jobRegistry = new Map();
  }

  /**
   * Enfileira um job de email
   */
  async enqueueEmailJob(emailData: EmailJobData): Promise<string> {
    const correlationId = emailData.correlationId || generateCorrelationId();
    
    try {
      // Validar dados
      const validatedData = EmailJobDataSchema.parse(emailData);

      // Publicar job no QStash
      const response = await this.qstashService.publishJob(
        validatedData,
        'email-sender',
        {
          retries: validatedData.maxRetries,
          delay: 0,
          headers: {
            'X-Correlation-Id': correlationId,
            'X-Job-Type': 'EMAIL',
          },
        },
        correlationId
      );

      // Registrar job localmente
      this.registerJob(response.messageId, 'pending');

      logInfo('Email job enqueued', {
        jobId: response.messageId,
        jobType: validatedData.jobType,
        to: validatedData.email,
        correlationId,
      });

      return response.messageId;
    } catch (error) {
      logError('Failed to enqueue email job', error as Error, {
        correlationId,
        emailTo: emailData.email,
      });
      throw error;
    }
  }

  /**
   * Enfileira um job de processamento
   */
  async enqueueProcessingJob(processingData: ProcessingJobData): Promise<string> {
    const correlationId = processingData.correlationId || generateCorrelationId();

    try {
      // Validar dados
      const validatedData = ProcessingJobDataSchema.parse(processingData);

      // Publicar job no QStash
      const response = await this.qstashService.publishJob(
        validatedData,
        'final-processor',
        {
          retries: validatedData.maxRetries,
          delay: 0,
          headers: {
            'X-Correlation-Id': correlationId,
            'X-Job-Type': 'PROCESSING',
            'X-Payment-Id': validatedData.paymentId,
          },
        },
        correlationId
      );

      // Registrar job localmente
      this.registerJob(response.messageId, 'pending');

      logInfo('Processing job enqueued', {
        jobId: response.messageId,
        jobType: validatedData.jobType,
        uniqueUrl: validatedData.uniqueUrl,
        paymentId: validatedData.paymentId,
        correlationId,
      });

      return response.messageId;
    } catch (error) {
      logError('Failed to enqueue processing job', error as Error, {
        correlationId,
        uniqueUrl: processingData.uniqueUrl,
        paymentId: processingData.paymentId,
      });
      throw error;
    }
  }

  /**
   * Obtém o status de um job
   */
  async getQueueStatus(jobId: string): Promise<QueueStatus | null> {
    try {
      // Primeiro verifica o registro local
      const localStatus = this.jobRegistry.get(jobId);
      
      // Busca status atualizado do QStash
      const qstashStatus = await this.qstashService.getJobStatus(jobId);
      
      if (!qstashStatus) {
        if (localStatus) {
          return localStatus;
        }
        return null;
      }

      // Mapear status do QStash para nosso formato
      const status: QueueStatus = {
        jobId,
        status: this.mapQStashStatus(qstashStatus.state),
        attempts: qstashStatus.retries || 0,
        lastAttempt: qstashStatus.lastAttempt ? new Date(qstashStatus.lastAttempt) : undefined,
        nextAttempt: qstashStatus.nextAttempt ? new Date(qstashStatus.nextAttempt) : undefined,
        error: qstashStatus.error,
      };

      // Atualizar registro local
      this.jobRegistry.set(jobId, status);

      return status;
    } catch (error) {
      logError('Failed to get queue status', error as Error, { jobId });
      return this.jobRegistry.get(jobId) || null;
    }
  }

  /**
   * Agenda um job com delay
   */
  private async _scheduleDelayedJob(
    jobData: JobData,
    delay: number
  ): Promise<string> {
    const correlationId = generateCorrelationId();

    try {
      // Determinar endpoint baseado no tipo
      const endpoint = jobData.type === 'email' ? 'email-sender' : 'final-processor';
      const response = await this.qstashService.publishJob(
        jobData.data,
        endpoint,
        {
          delay,
          headers: {
            'X-Correlation-Id': correlationId,
            'X-Job-Type': jobData.type.toUpperCase(),
          },
        },
        correlationId
      );

      // Registrar job
      this.registerJob(response.messageId, 'pending');

      logInfo('Delayed job scheduled', {
        jobId: response.messageId,
        type: jobData.type,
        delay,
        correlationId,
      });

      return response.messageId;
    } catch (error) {
      logError('Failed to schedule delayed job', error as Error, {
        correlationId,
        jobType: jobData.type,
        delay,
      });
      throw error;
    }
  }

  /**
   * Cancela um job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await this.qstashService.cancelJob(jobId);
      
      // Atualizar registro local
      const status = this.jobRegistry.get(jobId);
      if (status) {
        status.status = 'cancelled';
        this.jobRegistry.set(jobId, status);
      }

      logInfo('Job cancelled', { jobId });
    } catch (error) {
      logError('Failed to cancel job', error as Error, { jobId });
      throw error;
    }
  }

  /**
   * Reprocessa um job falhado
   */
  async retryFailedJob(jobId: string): Promise<string> {
    try {
      const status = await this.getQueueStatus(jobId);
      
      if (!status) {
        throw new Error(`Job not found: ${jobId}`);
      }

      if (status.status !== 'failed') {
        throw new Error(`Job is not in failed state: ${status.status}`);
      }

      // Buscar dados originais do job (seria necessário armazenar em algum lugar)
      // Por enquanto, lançar erro indicando que precisa dos dados originais
      throw new Error('Original job data not available for retry');
      
      // TODO: Implementar recuperação de dados originais do job
      // const originalData = await this.getJobData(jobId);
      // return await this.enqueueJob(originalData);
    } catch (error) {
      logError('Failed to retry job', error as Error, { jobId });
      throw error;
    }
  }

  /**
   * Obtém métricas da fila
   */
  async getQueueMetrics(): Promise<QueueMetrics> {
    try {
      const jobs = Array.from(this.jobRegistry.values());
      
      const metrics: QueueMetrics = {
        totalJobs: jobs.length,
        pendingJobs: jobs.filter(j => j.status === 'pending').length,
        processingJobs: jobs.filter(j => j.status === 'processing').length,
        completedJobs: jobs.filter(j => j.status === 'completed').length,
        failedJobs: jobs.filter(j => j.status === 'failed').length,
        averageProcessingTime: 0, // TODO: Calcular tempo médio real
      };

      logInfo('Queue metrics retrieved', {
        totalJobs: metrics.totalJobs,
        pendingJobs: metrics.pendingJobs,
        processingJobs: metrics.processingJobs,
        completedJobs: metrics.completedJobs,
        failedJobs: metrics.failedJobs,
        averageProcessingTime: metrics.averageProcessingTime
      });

      return metrics;
    } catch (error) {
      logError('Failed to get queue metrics', error as Error);
      throw error;
    }
  }

  /**
   * Limpa jobs antigos do registro
   */
  cleanupOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [jobId, status] of this.jobRegistry.entries()) {
      if (status.status === 'completed' || status.status === 'cancelled') {
        if (status.lastAttempt) {
          const age = now - status.lastAttempt.getTime();
          if (age > olderThanMs) {
            this.jobRegistry.delete(jobId);
            cleaned++;
          }
        }
      }
    }

    if (cleaned > 0) {
      logInfo('Old jobs cleaned up', { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Registra um job localmente
   */
  private registerJob(
    jobId: string,
    status: QueueStatus['status']
  ): void {
    this.jobRegistry.set(jobId, {
      jobId,
      status,
      attempts: 0,
      lastAttempt: status === 'processing' ? new Date() : undefined,
    });
  }

  /**
   * Mapeia status do QStash para nosso formato
   */
  private mapQStashStatus(qstashState: string): QueueStatus['status'] {
    const statusMap: Record<string, QueueStatus['status']> = {
      'pending': 'pending',
      'active': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'delayed': 'pending',
      'retry': 'processing',
    };

    return statusMap[qstashState] || 'pending';
  }

  /**
   * Valida configuração da fila
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      // Testar conexão com QStash
      const response = await this.qstashService.publishJob(
        { 
          test: true
        } as unknown as ProcessingJobData,
        'health',
        {
          retries: 0,
          delay: 0,
        }
      );

      // Cancelar job de teste imediatamente
      await this.qstashService.cancelJob(response.messageId);

      logInfo('Queue configuration validated successfully');
      return true;
    } catch (error) {
      logError('Queue configuration validation failed', error as Error);
      return false;
    }
  }
}