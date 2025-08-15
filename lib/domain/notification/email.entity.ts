import { v4 as uuidv4 } from 'uuid';
import {
  EmailData,
  EmailStatus,
  EmailTemplate,
  EmailPriority,
  EmailConfig,
  EmailOptions,
  TemplateData,
  EmailEvent,
  EmailAttachment,
  TemplateDataSchema,
} from './email.types';
import { z } from 'zod';

export class Email {
  private readonly _id: string;
  private readonly _to: string[];
  private readonly _cc?: string[];
  private _subject: string;
  private readonly _template: EmailTemplate;
  private readonly _templateData: TemplateData;
  private _status: EmailStatus;
  private readonly _config: EmailConfig;
  private readonly _options?: EmailOptions;
  private _messageId?: string;
  private _sentAt?: Date;
  private _failedAt?: Date;
  private _failureReason?: string;
  private _metadata?: Record<string, unknown>;
  private readonly _events: EmailEvent[] = [];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(data: Partial<EmailData>) {
    this._id = data.id || uuidv4();
    this._to = data.to || [];
    this._cc = data.cc;
    this._subject = data.subject || '';
    this._template = data.template || EmailTemplate.WELCOME;
    this._templateData = this.validateTemplateData(data.templateData);
    this._status = data.status || EmailStatus.PENDING;
    this._config = data.config || { from: process.env.EMAIL_FROM || 'noreply@sosmoto.com' };
    this._options = data.options;
    this._messageId = data.messageId;
    this._sentAt = data.sentAt;
    this._failedAt = data.failedAt;
    this._failureReason = data.failureReason;
    this._metadata = data.metadata;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();

    this.validate();
  }

  private validateTemplateData(data: unknown): TemplateData {
    if (!data) {
      throw new Error('Template data is required');
    }
    
    const result = TemplateDataSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid template data: ${result.error.message}`);
    }
    
    return result.data;
  }

  private validate(): void {
    if (this._to.length === 0) {
      throw new Error('At least one recipient is required');
    }

    for (const email of this._to) {
      if (!this.isValidEmail(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }

    if (this._cc) {
      for (const email of this._cc) {
        if (!this.isValidEmail(email)) {
          throw new Error(`Invalid CC email address: ${email}`);
        }
      }
    }

    if (!this._subject || this._subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }

    if (!this._config.from || !this.isValidEmail(this._config.from)) {
      throw new Error('Valid sender email is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Domain logic methods
  public markAsSending(): void {
    if (this._status !== EmailStatus.PENDING) {
      throw new Error(`Cannot mark email as sending from status: ${this._status}`);
    }
    
    this._status = EmailStatus.SENDING;
    this._updatedAt = new Date();
    this.addEvent('sending');
  }

  public markAsSent(messageId: string): void {
    if (this._status !== EmailStatus.SENDING) {
      throw new Error(`Cannot mark email as sent from status: ${this._status}`);
    }
    
    this._status = EmailStatus.SENT;
    this._messageId = messageId;
    this._sentAt = new Date();
    this._updatedAt = new Date();
    this.addEvent('sent', { messageId });
  }

  public markAsFailed(reason: string): void {
    if (this._status === EmailStatus.SENT) {
      throw new Error('Cannot mark sent email as failed');
    }
    
    this._status = EmailStatus.FAILED;
    this._failureReason = reason;
    this._failedAt = new Date();
    this._updatedAt = new Date();
    this.addEvent('failed', { reason });
  }

  public markAsBounced(details?: Record<string, unknown>): void {
    if (this._status !== EmailStatus.SENT) {
      throw new Error('Only sent emails can be marked as bounced');
    }
    
    this._status = EmailStatus.BOUNCED;
    this._updatedAt = new Date();
    this.addEvent('bounced', details);
  }

  public markAsComplained(details?: Record<string, unknown>): void {
    if (this._status !== EmailStatus.SENT) {
      throw new Error('Only sent emails can be marked as complained');
    }
    
    this._status = EmailStatus.COMPLAINED;
    this._updatedAt = new Date();
    this.addEvent('complained', details);
  }

  public canRetry(): boolean {
    if (this._status !== EmailStatus.FAILED) {
      return false;
    }
    
    const retryCount = this._options?.retryCount || 0;
    const maxRetries = this._options?.maxRetries || 3;
    
    return retryCount < maxRetries;
  }

  public incrementRetryCount(): void {
    if (!this.canRetry()) {
      throw new Error('Cannot retry this email');
    }
    
    if (!this._options) {
      this._options = { retryCount: 1, maxRetries: 3 };
    } else {
      this._options.retryCount = (this._options.retryCount || 0) + 1;
    }
    
    this._status = EmailStatus.PENDING;
    this._failureReason = undefined;
    this._failedAt = undefined;
    this._updatedAt = new Date();
  }

  public shouldExpire(): boolean {
    if (this._status === EmailStatus.SENT) {
      return false;
    }
    
    if (!this._options?.expiresAt) {
      return false;
    }
    
    return new Date() > this._options.expiresAt;
  }

  public getPriority(): EmailPriority {
    return this._options?.priority || EmailPriority.NORMAL;
  }

  public hasAttachments(): boolean {
    return !!(this._options?.attachments && this._options.attachments.length > 0);
  }

  public getAttachments(): EmailAttachment[] {
    return this._options?.attachments || [];
  }

  public addMetadata(key: string, value: unknown): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    
    this._metadata[key] = value;
    this._updatedAt = new Date();
  }

  private addEvent(type: EmailEvent['type'], details?: Record<string, unknown>): void {
    this._events.push({
      id: uuidv4(),
      emailId: this._id,
      type,
      timestamp: new Date(),
      details,
    });
  }

  public getEvents(): EmailEvent[] {
    return [...this._events];
  }

  public isHighPriority(): boolean {
    return this.getPriority() === EmailPriority.HIGH;
  }

  public needsScheduling(): boolean {
    if (!this._options?.scheduledAt) {
      return false;
    }
    
    return new Date() < this._options.scheduledAt;
  }

  public getScheduledTime(): Date | undefined {
    return this._options?.scheduledAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get to(): string[] {
    return [...this._to];
  }

  get cc(): string[] | undefined {
    return this._cc ? [...this._cc] : undefined;
  }

  get subject(): string {
    return this._subject;
  }

  get template(): EmailTemplate {
    return this._template;
  }

  get templateData(): TemplateData {
    return this._templateData;
  }

  get status(): EmailStatus {
    return this._status;
  }

  get config(): EmailConfig {
    return { ...this._config };
  }

  get options(): EmailOptions | undefined {
    return this._options ? { ...this._options } : undefined;
  }

  get messageId(): string | undefined {
    return this._messageId;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get failedAt(): Date | undefined {
    return this._failedAt;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Serialization
  public toJSON(): EmailData {
    return {
      id: this._id,
      to: this.to,
      cc: this.cc,
      subject: this._subject,
      template: this._template,
      templateData: this._templateData,
      status: this._status,
      config: this.config,
      options: this.options,
      messageId: this._messageId,
      sentAt: this._sentAt,
      failedAt: this._failedAt,
      failureReason: this._failureReason,
      metadata: this.metadata,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // Factory method
  public static fromJSON(data: EmailData): Email {
    return new Email(data);
  }
}