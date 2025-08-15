import {
  JobType,
  JobStatus,
  JobData,
  JobResult,
  ProcessingJobData,
  EmailJobData,
  QRCodeJobData,
  CacheJobData,
} from '../../types/queue.types';
import { logInfo, logError, logWarning } from '../../utils/logger';

/**
 * Job Processing Result
 */
export interface JobProcessingResult {
  success: boolean;
  jobId: string;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  retryable?: boolean;
  nextRetryDelay?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Job Processing Context
 */
export interface JobProcessingContext {
  jobId: string;
  correlationId: string;
  attempt: number;
  maxRetries: number;
  startTime: Date;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Abstract Base Job Processor
 * 
 * This abstract class provides common functionality for all job processors,
 * including retry logic, error handling, and structured logging.
 */
export abstract class BaseJobProcessor<T extends JobData = JobData> {
  protected readonly processorName: string;
  protected readonly defaultTimeout: number;
  protected readonly defaultMaxRetries: number;

  constructor(
    processorName: string,
    defaultTimeout: number = 30000, // 30 seconds
    defaultMaxRetries: number = 3
  ) {
    this.processorName = processorName;
    this.defaultTimeout = defaultTimeout;
    this.defaultMaxRetries = defaultMaxRetries;
  }

  /**
   * Main processing method - handles common logic and delegates to implementation
   */
  async processJob(
    jobData: T,
    context: Partial<JobProcessingContext> = {}
  ): Promise<JobProcessingResult> {
    const fullContext: JobProcessingContext = {
      jobId: this.generateJobId(jobData),
      correlationId: jobData.correlationId || this.generateCorrelationId(),
      attempt: (jobData.retryCount || 0) + 1,
      maxRetries: jobData.maxRetries || this.defaultMaxRetries,
      startTime: new Date(),
      timeout: context.timeout || this.defaultTimeout,
      ...context,
    };

    logInfo(`Starting job processing [${this.processorName}]`, {
      correlationId: fullContext.correlationId,
      jobId: fullContext.jobId,
      jobType: jobData.jobType,
      attempt: fullContext.attempt,
      maxRetries: fullContext.maxRetries,
    });

    try {
      // Validate job data
      await this.validateJobData(jobData, fullContext);

      // Set up timeout if specified
      let timeoutPromise: Promise<never> | null = null;
      if (fullContext.timeout) {
        timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Job timeout after ${fullContext.timeout}ms`));
          }, fullContext.timeout);
        });
      }

      // Process the job
      let processingPromise: Promise<JobProcessingResult>;
      
      if (timeoutPromise) {
        processingPromise = Promise.race([
          this.executeJob(jobData, fullContext),
          timeoutPromise,
        ]);
      } else {
        processingPromise = this.executeJob(jobData, fullContext);
      }

      const result = await processingPromise;
      
      // Log successful completion
      const duration = Date.now() - fullContext.startTime.getTime();
      logInfo(`Job completed successfully [${this.processorName}]`, {
        correlationId: fullContext.correlationId,
        jobId: fullContext.jobId,
        duration,
        status: result.status,
      });

      return {
        ...result,
        success: true,
        jobId: fullContext.jobId,
        status: JobStatus.COMPLETED,
      };

    } catch (error) {
      return this.handleJobError(error as Error, jobData, fullContext);
    }
  }

  /**
   * Abstract method to be implemented by specific processors
   */
  protected abstract executeJob(
    jobData: T,
    context: JobProcessingContext
  ): Promise<JobProcessingResult>;

  /**
   * Validates job data - can be overridden by specific processors
   */
  protected async validateJobData(
    jobData: T,
    context: JobProcessingContext
  ): Promise<void> {
    if (!jobData.jobType) {
      throw new Error('Job type is required');
    }

    if (!jobData.correlationId) {
      logWarning('Job missing correlation ID', {
        jobId: context.jobId,
        jobType: jobData.jobType,
      });
    }
  }

  /**
   * Handles job errors with retry logic
   */
  private handleJobError(
    error: Error,
    jobData: T,
    context: JobProcessingContext
  ): JobProcessingResult {
    const duration = Date.now() - context.startTime.getTime();
    const canRetry = context.attempt < context.maxRetries;
    const isRetryable = this.isRetryableError(error);
    const shouldRetry = canRetry && isRetryable;

    logError(`Job failed [${this.processorName}]`, error, {
      correlationId: context.correlationId,
      jobId: context.jobId,
      attempt: context.attempt,
      maxRetries: context.maxRetries,
      duration,
      canRetry,
      isRetryable,
      shouldRetry,
    });

    // Determine next retry delay using exponential backoff
    const nextRetryDelay = shouldRetry ? this.calculateRetryDelay(context.attempt) : undefined;

    return {
      success: false,
      jobId: context.jobId,
      status: shouldRetry ? JobStatus.RETRYING : JobStatus.FAILED,
      error: error.message,
      retryable: isRetryable,
      nextRetryDelay,
      metadata: {
        attempt: context.attempt,
        maxRetries: context.maxRetries,
        duration,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }

  /**
   * Determines if an error is retryable
   */
  protected isRetryableError(error: Error): boolean {
    // Network-related errors are typically retryable
    const retryableErrorTypes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EAI_AGAIN',
    ];

    // Check error code/type
    if ('code' in error && typeof error.code === 'string') {
      if (retryableErrorTypes.includes(error.code)) {
        return true;
      }
    }

    // HTTP errors - retry on 5xx, not on 4xx
    if ('status' in error && typeof error.status === 'number') {
      return error.status >= 500;
    }

    // Specific error messages that indicate transient issues
    const retryableMessages = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'rate limit',
      'quota',
      'throttle',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Calculates retry delay using exponential backoff
   */
  protected calculateRetryDelay(attempt: number): number {
    // Exponential backoff: 2^attempt * 1000ms + jitter
    const baseDelay = Math.pow(2, attempt) * 1000;
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const maxDelay = 300000; // Max 5 minutes
    
    return Math.min(baseDelay + jitter, maxDelay);
  }

  /**
   * Generates a unique job ID
   */
  private generateJobId(jobData: T): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.processorName}_${jobData.jobType}_${timestamp}_${random}`;
  }

  /**
   * Generates a correlation ID if not provided
   */
  private generateCorrelationId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates a standardized success result
   */
  protected createSuccessResult(
    jobId: string,
    result?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): JobProcessingResult {
    return {
      success: true,
      jobId,
      status: JobStatus.COMPLETED,
      result,
      metadata,
    };
  }

  /**
   * Creates a standardized failure result
   */
  protected createFailureResult(
    jobId: string,
    error: string,
    retryable: boolean = false,
    metadata?: Record<string, unknown>
  ): JobProcessingResult {
    return {
      success: false,
      jobId,
      status: JobStatus.FAILED,
      error,
      retryable,
      metadata,
    };
  }

  /**
   * Health check for the processor
   */
  async healthCheck(correlationId?: string): Promise<{
    processor: string;
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    details?: Record<string, unknown>;
  }> {
    try {
      logInfo(`Health check for processor [${this.processorName}]`, {
        correlationId,
      });

      // Perform processor-specific health checks
      const healthDetails = await this.performHealthCheck(correlationId);

      return {
        processor: this.processorName,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: healthDetails,
      };
    } catch (error) {
      logError(`Health check failed for processor [${this.processorName}]`, error as Error, {
        correlationId,
      });

      return {
        processor: this.processorName,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          error: (error as Error).message,
        },
      };
    }
  }

  /**
   * Override this method to implement processor-specific health checks
   */
  protected async performHealthCheck(correlationId?: string): Promise<Record<string, unknown>> {
    return {
      defaultTimeout: this.defaultTimeout,
      defaultMaxRetries: this.defaultMaxRetries,
    };
  }

  /**
   * Gets processor metrics/statistics
   */
  async getMetrics(correlationId?: string): Promise<{
    processor: string;
    metrics: Record<string, unknown>;
    timestamp: string;
  }> {
    logInfo(`Getting metrics for processor [${this.processorName}]`, {
      correlationId,
    });

    const metrics = await this.collectMetrics(correlationId);

    return {
      processor: this.processorName,
      metrics: {
        defaultTimeout: this.defaultTimeout,
        defaultMaxRetries: this.defaultMaxRetries,
        ...metrics,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Override this method to collect processor-specific metrics
   */
  protected async collectMetrics(correlationId?: string): Promise<Record<string, unknown>> {
    return {};
  }
}

/**
 * Factory function to create typed job processors
 */
export function createJobProcessor<T extends JobData>(
  processorName: string,
  executeFunction: (jobData: T, context: JobProcessingContext) => Promise<JobProcessingResult>,
  options: {
    timeout?: number;
    maxRetries?: number;
    validateFunction?: (jobData: T, context: JobProcessingContext) => Promise<void>;
    healthCheckFunction?: (correlationId?: string) => Promise<Record<string, unknown>>;
    metricsFunction?: (correlationId?: string) => Promise<Record<string, unknown>>;
  } = {}
): BaseJobProcessor<T> {
  return new (class extends BaseJobProcessor<T> {
    constructor() {
      super(processorName, options.timeout, options.maxRetries);
    }

    protected async executeJob(
      jobData: T,
      context: JobProcessingContext
    ): Promise<JobProcessingResult> {
      return executeFunction(jobData, context);
    }

    protected async validateJobData(
      jobData: T,
      context: JobProcessingContext
    ): Promise<void> {
      await super.validateJobData(jobData, context);
      if (options.validateFunction) {
        await options.validateFunction(jobData, context);
      }
    }

    protected async performHealthCheck(correlationId?: string): Promise<Record<string, unknown>> {
      const baseHealth = await super.performHealthCheck(correlationId);
      if (options.healthCheckFunction) {
        const customHealth = await options.healthCheckFunction(correlationId);
        return { ...baseHealth, ...customHealth };
      }
      return baseHealth;
    }

    protected async collectMetrics(correlationId?: string): Promise<Record<string, unknown>> {
      const baseMetrics = await super.collectMetrics(correlationId);
      if (options.metricsFunction) {
        const customMetrics = await options.metricsFunction(correlationId);
        return { ...baseMetrics, ...customMetrics };
      }
      return baseMetrics;
    }
  })();
}