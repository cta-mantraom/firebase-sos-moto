import { z } from 'zod';

// Email Template Types
export enum EmailTemplate {
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_FAILURE = 'payment_failure',
  PROFILE_CREATED = 'profile_created',
  QR_CODE_GENERATED = 'qr_code_generated',
  WELCOME = 'welcome',
  REMINDER = 'reminder',
  ERROR_NOTIFICATION = 'error_notification',
}

export enum EmailStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
}

export enum EmailPriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

// Template Data Schemas
export const BaseTemplateDataSchema = z.object({
  userName: z.string(),
  userEmail: z.string().email(),
  timestamp: z.date(),
});

export const PaymentConfirmationDataSchema = BaseTemplateDataSchema.extend({
  paymentId: z.string(),
  amount: z.number(),
  planType: z.enum(['basic', 'premium']),
  memorialUrl: z.string().url(),
  qrCodeUrl: z.string().url().optional(),
});

export const PaymentFailureDataSchema = BaseTemplateDataSchema.extend({
  paymentId: z.string(),
  reason: z.string(),
  retryUrl: z.string().url().optional(),
});

export const ProfileCreatedDataSchema = BaseTemplateDataSchema.extend({
  profileId: z.string(),
  memorialUrl: z.string().url(),
  planType: z.enum(['basic', 'premium']),
});

export const QRCodeGeneratedDataSchema = BaseTemplateDataSchema.extend({
  qrCodeUrl: z.string().url(),
  memorialUrl: z.string().url(),
  profileId: z.string(),
});

export const WelcomeDataSchema = BaseTemplateDataSchema.extend({
  memorialUrl: z.string().url(),
  planType: z.enum(['basic', 'premium']),
  features: z.array(z.string()),
});

export const ReminderDataSchema = BaseTemplateDataSchema.extend({
  reminderType: z.enum(['update_profile', 'renewal', 'inactive']),
  actionUrl: z.string().url(),
  daysUntilExpiry: z.number().optional(),
});

export const ErrorNotificationDataSchema = BaseTemplateDataSchema.extend({
  errorCode: z.string(),
  errorMessage: z.string(),
  context: z.record(z.unknown()),
  supportUrl: z.string().url(),
});

// Union type for all template data
export const TemplateDataSchema = z.union([
  PaymentConfirmationDataSchema,
  PaymentFailureDataSchema,
  ProfileCreatedDataSchema,
  QRCodeGeneratedDataSchema,
  WelcomeDataSchema,
  ReminderDataSchema,
  ErrorNotificationDataSchema,
]);

// Email Configuration
export interface EmailConfig {
  from: string;
  replyTo?: string;
  bcc?: string[];
  returnPath?: string;
  configurationSet?: string;
  tags?: Record<string, string>;
}

// Email Attachment
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  contentDisposition?: 'attachment' | 'inline';
  cid?: string; // Content ID for inline attachments
}

// Email Options
export interface EmailOptions {
  priority?: EmailPriority;
  trackOpens?: boolean;
  trackClicks?: boolean;
  unsubscribeUrl?: string;
  listUnsubscribe?: string;
  headers?: Record<string, string>;
  attachments?: EmailAttachment[];
  scheduledAt?: Date;
  expiresAt?: Date;
  correlationId?: string;
  retryCount?: number;
  maxRetries?: number;
}

// Email Data
export interface EmailData {
  id: string;
  to: string[];
  cc?: string[];
  subject: string;
  template: EmailTemplate;
  templateData: z.infer<typeof TemplateDataSchema>;
  status: EmailStatus;
  config: EmailConfig;
  options?: EmailOptions;
  messageId?: string;
  sentAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Email Event
export interface EmailEvent {
  id: string;
  emailId: string;
  type: 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';
  timestamp: Date;
  details?: Record<string, unknown>;
}

// Email Template
export interface EmailTemplateDefinition {
  id: EmailTemplate;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[];
  attachments?: EmailAttachment[];
  priority: EmailPriority;
}

// SES Response
export interface SESResponse {
  messageId: string;
  requestId?: string;
}

// Email Batch
export interface EmailBatch {
  id: string;
  emails: EmailData[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  startedAt?: Date;
  completedAt?: Date;
  errors?: Array<{ emailId: string; error: string }>;
}

// Type exports
export type PaymentConfirmationData = z.infer<typeof PaymentConfirmationDataSchema>;
export type PaymentFailureData = z.infer<typeof PaymentFailureDataSchema>;
export type ProfileCreatedData = z.infer<typeof ProfileCreatedDataSchema>;
export type QRCodeGeneratedData = z.infer<typeof QRCodeGeneratedDataSchema>;
export type WelcomeData = z.infer<typeof WelcomeDataSchema>;
export type ReminderData = z.infer<typeof ReminderDataSchema>;
export type ErrorNotificationData = z.infer<typeof ErrorNotificationDataSchema>;
export type TemplateData = z.infer<typeof TemplateDataSchema>;