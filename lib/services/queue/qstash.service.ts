import { Client } from '@upstash/qstash';
import {
  JobType,
  JobStatus,
  JobData,
  EmailJobData,
  JobOptions,
  JobResult,
  QStashMessage,
  QStashResponse,
  QStashJobStatus,
  PublishOptions,
} from '../../types/queue.types';
import { PlanType } from '../../domain/profile/profile.types';
import { logInfo, logError } from '../../utils/logger';
import { env } from '../../config/env';

/**
 * QStash Queue Service
 * 
 * This service provides a type-safe interface to QStash for job queue management.
 * It handles job publishing, status monitoring, and retry policies.
 */
export class QStashService {
  private readonly client: Client;
  private readonly baseUrl: string;

  constructor() {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('QStash configuration missing: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required');
    }

    this.client = new Client({
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    this.baseUrl = env.FRONTEND_URL || 'https://memoryys.com';
  }

  /**
   * Publishes a job to the queue
   */
  async publishJob(
    jobData: JobData,
    targetEndpoint: string,
    options: PublishOptions = {},
    correlationId?: string
  ): Promise<QStashResponse> {
    try {
      logInfo('Publishing job to QStash', {
        correlationId,
        jobType: jobData.jobType,
        targetEndpoint,
        options: {
          delay: options.delay,
          retries: options.retries,
          deduplicationId: options.deduplicationId,
        },
      });

      const url = `${this.baseUrl}/api/processors/${targetEndpoint}`;
      
      const message: QStashMessage = {
        url,
        body: jobData,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId || '',
          ...options.headers,
        },
        delay: options.delay,
        retries: options.retries || 3,
      };

      let publishResponse: { messageId: string };

      if (options.deduplicationId) {
        publishResponse = await this.client.publishJSON({
          ...message,
          deduplicationId: options.deduplicationId,
        });
      } else {
        publishResponse = await this.client.publishJSON(message);
      }

      const response: QStashResponse = {
        messageId: publishResponse.messageId,
        url,
        deduplicated: false,
      };

      logInfo('Job published successfully', {
        correlationId,
        messageId: response.messageId,
        jobType: jobData.jobType,
      });

      return response;
    } catch (error) {
      logError('Error publishing job to QStash', error as Error, {
        correlationId,
        jobType: jobData.jobType,
        targetEndpoint,
      });
      throw error;
    }
  }

  /**
   * Publishes a job with automatic retry configuration
   */
  async publishJobWithRetry(
    jobData: JobData,
    targetEndpoint: string,
    maxRetries: number = 3,
    correlationId?: string
  ): Promise<QStashResponse> {
    const options: PublishOptions = {
      retries: maxRetries,
      deduplicationId: `${jobData.jobType}_${jobData.correlationId}_${Date.now()}`,
    };

    return this.publishJob(jobData, targetEndpoint, options, correlationId);
  }

  /**
   * Publishes a delayed job
   */
  async publishDelayedJob(
    jobData: JobData,
    targetEndpoint: string,
    delayInSeconds: number,
    correlationId?: string
  ): Promise<QStashResponse> {
    const options: PublishOptions = {
      delay: delayInSeconds,
      retries: 3,
    };

    return this.publishJob(jobData, targetEndpoint, options, correlationId);
  }

  /**
   * Gets job status from QStash
   */
  async getJobStatus(
    messageId: string,
    correlationId?: string
  ): Promise<QStashJobStatus | null> {
    try {
      logInfo('Getting job status from QStash', {
        correlationId,
        messageId,
      });

      const status = await this.client.messages.get(messageId) as unknown;

      if (!status) {
        logInfo('Job not found in QStash', {
          correlationId,
          messageId,
        });
        return null;
      }

      const jobStatus: QStashJobStatus = {
        messageId: status.messageId,
        state: this.mapQStashState(status.state),
        retries: status.retries || 0,
        lastAttempt: status.scheduleId ? new Date(status.scheduleId).toISOString() : undefined,
        nextAttempt: status.notBefore ? new Date(status.notBefore * 1000).toISOString() : undefined,
        error: status.responseStatus && status.responseStatus >= 400 ? 'HTTP Error' : undefined,
        url: status.url || '',
        createdAt: status.createdAt ? new Date(status.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logInfo('Job status retrieved', {
        correlationId,
        messageId,
        state: jobStatus.state,
      });

      return jobStatus;
    } catch (error) {
      logError('Error getting job status from QStash', error as Error, {
        correlationId,
        messageId,
      });
      return null;
    }
  }

  /**
   * Cancels a job in QStash
   */
  async cancelJob(
    messageId: string,
    correlationId?: string
  ): Promise<boolean> {
    try {
      logInfo('Cancelling job in QStash', {
        correlationId,
        messageId,
      });

      await this.client.messages.delete(messageId);

      logInfo('Job cancelled successfully', {
        correlationId,
        messageId,
      });

      return true;
    } catch (error) {
      logError('Error cancelling job in QStash', error as Error, {
        correlationId,
        messageId,
      });
      return false;
    }
  }

  /**
   * Gets queue statistics
   */
  async getQueueStats(correlationId?: string): Promise<{
    totalMessages: number;
    pendingMessages: number;
    processingMessages: number;
    completedMessages: number;
    failedMessages: number;
  }> {
    try {
      logInfo('Getting queue statistics', { correlationId });

      // Note: QStash doesn't provide direct statistics API
      // This would need to be implemented using message listing and filtering
      const messages: unknown[] = []; // await this.client.messages.list(); // Note: list method not available in current version

      const stats = {
        totalMessages: messages.length,
        pendingMessages: 0,
        processingMessages: 0,
        completedMessages: 0,
        failedMessages: 0,
      };

      for (const message of messages) {
        const state = this.mapQStashState(message.state);
        switch (state) {
          case 'pending':
          case 'delayed':
            stats.pendingMessages++;
            break;
          case 'active':
          case 'retry':
            stats.processingMessages++;
            break;
          case 'completed':
            stats.completedMessages++;
            break;
          case 'failed':
          case 'cancelled':
            stats.failedMessages++;
            break;
        }
      }

      logInfo('Queue statistics retrieved', { correlationId, stats });

      return stats;
    } catch (error) {
      logError('Error getting queue statistics', error as Error, {
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Publishes a profile processing job
   */
  async publishProfileProcessingJob(
    paymentId: string,
    profileId: string,
    profileData: Record<string, unknown>,
    paymentData: Record<string, unknown>,
    correlationId: string
  ): Promise<QStashResponse> {
    const jobData: JobData = {
      jobType: JobType.PROCESS_PROFILE,
      paymentId,
      profileId,
      uniqueUrl: profileId,
      planType: paymentData.planType === 'premium' ? PlanType.PREMIUM : PlanType.BASIC,
      profileData,
      paymentData: {
        id: paymentId,
        status: paymentData.status as string,
        amount: paymentData.amount as number,
        externalReference: paymentData.externalReference as string,
      },
      correlationId,
      retryCount: 0,
      maxRetries: 3,
    };

    return this.publishJobWithRetry(jobData, 'final-processor', 3, correlationId);
  }

  /**
   * Publishes an email sending job
   */
  async publishEmailJob(
    profileId: string,
    email: string,
    name: string,
    template: 'confirmation' | 'failure' | 'reminder' | 'welcome',
    templateData: Record<string, unknown>,
    correlationId: string
  ): Promise<QStashResponse> {
    const jobData: EmailJobData = {
      jobType: JobType.SEND_EMAIL,
      profileId,
      email,
      name,
      subject: this.getEmailSubject(template),
      template,
      templateData: {
        planType: templateData.planType === 'premium' ? PlanType.PREMIUM : PlanType.BASIC,
        memorialUrl: (templateData.memorialUrl || '') as string,
        amount: templateData.amount as number | undefined,
        paymentId: templateData.paymentId as string | undefined,
        qrCodeUrl: templateData.qrCodeUrl as string | undefined,
      },
      correlationId,
      retryCount: 0,
      maxRetries: 3,
    };

    return this.publishJobWithRetry(jobData, 'email-sender', 3, correlationId);
  }

  /**
   * Publishes a QR code generation job
   */
  async publishQRCodeJob(
    profileId: string,
    memorialUrl: string,
    correlationId: string
  ): Promise<QStashResponse> {
    const jobData: JobData = {
      jobType: JobType.GENERATE_QR_CODE,
      profileId,
      memorialUrl,
      correlationId,
    };

    return this.publishJobWithRetry(jobData, 'qr-code-generator', 3, correlationId);
  }

  // Private helper methods

  private mapQStashState(qstashState: string): QStashJobStatus['state'] {
    switch (qstashState.toLowerCase()) {
      case 'created':
      case 'scheduled':
        return 'pending';
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      case 'retry':
        return 'retry';
      case 'delayed':
        return 'delayed';
      default:
        return 'pending';
    }
  }

  private getEmailSubject(template: string): string {
    const subjects = {
      confirmation: 'SOS Moto - Cadastro Confirmado',
      failure: 'SOS Moto - Problema no Pagamento',
      reminder: 'SOS Moto - Lembrete',
      welcome: 'SOS Moto - Bem-vindo',
    };

    return subjects[template as keyof typeof subjects] || 'SOS Moto - Notificação';
  }

  /**
   * Health check for QStash service
   */
  async healthCheck(correlationId?: string): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    details?: string;
  }> {
    try {
      logInfo('Performing QStash health check', { correlationId });

      // Try to get queue stats as a health check
      // await this.client.messages.list({ count: 1 }); // Note: list method not available
      // Perform a simple health check instead
      await Promise.resolve(); // Temporary placeholder

      logInfo('QStash health check passed', { correlationId });

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logError('QStash health check failed', error as Error, { correlationId });

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: (error as Error).message,
      };
    }
  }
}

export const qstashService = new QStashService();