import { z } from 'zod';
import { ProfileData } from '../domain/profile/profile.types';

// Job Types
export enum JobType {
  PROCESS_PROFILE = 'PROCESS_PROFILE',
  GENERATE_QR_CODE = 'GENERATE_QR_CODE',
  SEND_EMAIL = 'SEND_EMAIL',
  UPDATE_CACHE = 'UPDATE_CACHE',
  CLEANUP = 'CLEANUP',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

// Job Data Schemas
export const ProcessingJobDataSchema = z.object({
  jobType: z.nativeEnum(JobType),
  paymentId: z.string(),
  profileId: z.string(),
  uniqueUrl: z.string(),
  planType: z.enum(['basic', 'premium']),
  profileData: z.record(z.unknown()),
  paymentData: z.object({
    id: z.string(),
    status: z.string(),
    amount: z.number(),
    externalReference: z.string(),
  }),
  correlationId: z.string(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
});

export const EmailJobDataSchema = z.object({
  jobType: z.literal(JobType.SEND_EMAIL),
  profileId: z.string(),
  email: z.string().email(),
  name: z.string(),
  subject: z.string(),
  template: z.enum(['confirmation', 'failure', 'reminder', 'welcome']),
  templateData: z.object({
    qrCodeUrl: z.string().url().optional(),
    memorialUrl: z.string().url(),
    planType: z.enum(['basic', 'premium']),
    amount: z.number().optional(),
    paymentId: z.string().optional(),
  }),
  correlationId: z.string(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
});

export const QRCodeJobDataSchema = z.object({
  jobType: z.literal(JobType.GENERATE_QR_CODE),
  profileId: z.string(),
  memorialUrl: z.string().url(),
  correlationId: z.string(),
});

export const CacheJobDataSchema = z.object({
  jobType: z.literal(JobType.UPDATE_CACHE),
  operation: z.enum(['set', 'invalidate', 'refresh']),
  key: z.string(),
  data: z.unknown().optional(),
  ttl: z.number().optional(),
  correlationId: z.string(),
});

// Types derivados
export type ProcessingJobData = z.infer<typeof ProcessingJobDataSchema>;
export type EmailJobData = z.infer<typeof EmailJobDataSchema>;
export type QRCodeJobData = z.infer<typeof QRCodeJobDataSchema>;
export type CacheJobData = z.infer<typeof CacheJobDataSchema>;

export type JobData = ProcessingJobData | EmailJobData | QRCodeJobData | CacheJobData;

// Queue Configuration
export interface QueueConfig {
  url: string;
  token: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface JobOptions {
  delay?: number;
  retries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface JobResult {
  jobId: string;
  status: JobStatus;
  result?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  averageProcessingTime: number;
}

// QStash specific types
export interface QStashMessage {
  url: string;
  body: string | object;
  headers?: Record<string, string>;
  delay?: number;
  retries?: number;
  callback?: string;
  failureCallback?: string;
}

export interface QStashResponse {
  messageId: string;
  url: string;
  deduplicated?: boolean;
}

export interface QStashJobStatus {
  messageId: string;
  state: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled' | 'delayed' | 'retry';
  retries?: number;
  lastAttempt?: string;
  nextAttempt?: string;
  error?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

// Publish Options
export interface PublishOptions extends JobOptions {
  deduplicationId?: string;
  contentBasedDeduplication?: boolean;
}