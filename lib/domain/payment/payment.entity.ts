import { v4 as uuidv4 } from 'uuid';
import {
  PaymentData,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  RefundStatus,
  PaymentDataSchema,
  MercadoPagoPayment,
} from './payment.types.js';
import { z } from 'zod';

export class Payment {
  private readonly _id: string;
  private _externalId?: string;
  private _preferenceId?: string;
  private _status: PaymentStatus;
  private _method?: PaymentMethod;
  private readonly _type: PaymentType;
  private readonly _amount: number;
  private readonly _currency: string;
  private _installments?: number;
  private readonly _payer: PaymentData['payer'];
  private _profileId?: string;
  private readonly _planType: 'basic' | 'premium';
  private _description?: string;
  private readonly _externalReference: string;
  private _metadata?: Record<string, unknown>;
  private _refunds: Array<{
    id: string;
    amount: number;
    status: RefundStatus;
    reason?: string;
    createdAt: Date;
  }> = [];
  private _fees?: Array<{
    type: string;
    amount: number;
    payer: string;
  }>;
  private _deviceId?: string;
  private _ipAddress?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _approvedAt?: Date;
  private _rejectedAt?: Date;
  private _cancelledAt?: Date;
  private _refundedAt?: Date;

  constructor(data: Partial<PaymentData>) {
    this._id = data.id || uuidv4();
    this._externalId = data.externalId;
    this._preferenceId = data.preferenceId;
    this._status = data.status || PaymentStatus.PENDING;
    this._method = data.method;
    this._type = data.type || PaymentType.REGULAR_PAYMENT;
    this._amount = data.amount || 0;
    this._currency = data.currency || 'BRL';
    this._installments = data.installments;
    this._payer = data.payer || { email: '', name: '' };
    this._profileId = data.profileId;
    this._planType = data.planType || 'basic';
    this._description = data.description;
    this._externalReference = data.externalReference || this._id;
    this._metadata = data.metadata;
    this._refunds = data.refunds || [];
    this._fees = data.fees;
    this._deviceId = data.deviceId;
    this._ipAddress = data.ipAddress;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
    this._approvedAt = data.approvedAt;
    this._rejectedAt = data.rejectedAt;
    this._cancelledAt = data.cancelledAt;
    this._refundedAt = data.refundedAt;

    this.validate();
  }

  private validate(): void {
    if (this._amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (!this._payer.email || !this.isValidEmail(this._payer.email)) {
      throw new Error('Valid payer email is required');
    }

    if (!this._payer.name || this._payer.name.length < 2) {
      throw new Error('Payer name must have at least 2 characters');
    }


    if (this._installments && this._installments < 1) {
      throw new Error('Installments must be at least 1');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }


  // State transition methods
  public markAsProcessing(): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new Error(`Cannot mark payment as processing from status: ${this._status}`);
    }
    
    this._status = PaymentStatus.PROCESSING;
    this._updatedAt = new Date();
  }

  public approve(externalId: string): void {
    if (![PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.AUTHORIZED].includes(this._status)) {
      throw new Error(`Cannot approve payment from status: ${this._status}`);
    }
    
    this._status = PaymentStatus.APPROVED;
    this._externalId = externalId;
    this._approvedAt = new Date();
    this._updatedAt = new Date();
  }

  public reject(reason?: string): void {
    if ([PaymentStatus.APPROVED, PaymentStatus.REFUNDED].includes(this._status)) {
      throw new Error(`Cannot reject payment from status: ${this._status}`);
    }
    
    this._status = PaymentStatus.REJECTED;
    this._rejectedAt = new Date();
    this._updatedAt = new Date();
    
    if (reason) {
      this.addMetadata('rejection_reason', reason);
    }
  }

  public cancel(): void {
    if ([PaymentStatus.APPROVED, PaymentStatus.REFUNDED].includes(this._status)) {
      throw new Error(`Cannot cancel payment from status: ${this._status}`);
    }
    
    this._status = PaymentStatus.CANCELLED;
    this._cancelledAt = new Date();
    this._updatedAt = new Date();
  }

  public refund(refundAmount?: number, reason?: string): void {
    if (this._status !== PaymentStatus.APPROVED) {
      throw new Error('Only approved payments can be refunded');
    }
    
    const amountToRefund = refundAmount || this._amount;
    const totalRefunded = this.getTotalRefunded();
    
    if (totalRefunded + amountToRefund > this._amount) {
      throw new Error('Refund amount exceeds payment amount');
    }
    
    this._refunds.push({
      id: uuidv4(),
      amount: amountToRefund,
      status: RefundStatus.PENDING,
      reason,
      createdAt: new Date(),
    });
    
    if (totalRefunded + amountToRefund === this._amount) {
      this._status = PaymentStatus.REFUNDED;
      this._refundedAt = new Date();
    }
    
    this._updatedAt = new Date();
  }

  public updateRefundStatus(refundId: string, status: RefundStatus): void {
    const refund = this._refunds.find(r => r.id === refundId);
    
    if (!refund) {
      throw new Error(`Refund with id ${refundId} not found`);
    }
    
    refund.status = status;
    this._updatedAt = new Date();
  }

  // Business logic methods
  public canBeRefunded(): boolean {
    return this._status === PaymentStatus.APPROVED;
  }

  public canBeCancelled(): boolean {
    return ![PaymentStatus.APPROVED, PaymentStatus.REFUNDED].includes(this._status);
  }

  public isFinalized(): boolean {
    return [
      PaymentStatus.APPROVED,
      PaymentStatus.REJECTED,
      PaymentStatus.CANCELLED,
      PaymentStatus.REFUNDED,
      PaymentStatus.CHARGED_BACK,
    ].includes(this._status);
  }

  public getTotalRefunded(): number {
    return this._refunds
      .filter(r => r.status === RefundStatus.APPROVED)
      .reduce((total, refund) => total + refund.amount, 0);
  }

  public getNetAmount(): number {
    const totalRefunded = this.getTotalRefunded();
    const totalFees = this._fees?.reduce((total, fee) => total + fee.amount, 0) || 0;
    return this._amount - totalRefunded - totalFees;
  }

  public hasRefunds(): boolean {
    return this._refunds.length > 0;
  }

  public isPartiallyRefunded(): boolean {
    const totalRefunded = this.getTotalRefunded();
    return totalRefunded > 0 && totalRefunded < this._amount;
  }

  public isFullyRefunded(): boolean {
    return this.getTotalRefunded() === this._amount;
  }

  public addMetadata(key: string, value: unknown): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    
    this._metadata[key] = value;
    this._updatedAt = new Date();
  }

  public updateFromMercadoPago(mpPayment: MercadoPagoPayment): void {
    // Map MercadoPago status to our internal status
    const statusMap: Record<string, PaymentStatus> = {
      'pending': PaymentStatus.PENDING,
      'approved': PaymentStatus.APPROVED,
      'authorized': PaymentStatus.AUTHORIZED,
      'in_process': PaymentStatus.IN_PROCESS,
      'in_mediation': PaymentStatus.IN_MEDIATION,
      'rejected': PaymentStatus.REJECTED,
      'cancelled': PaymentStatus.CANCELLED,
      'refunded': PaymentStatus.REFUNDED,
      'charged_back': PaymentStatus.CHARGED_BACK,
    };
    
    const newStatus = statusMap[mpPayment.status] || PaymentStatus.PENDING;
    
    if (newStatus !== this._status) {
      this._status = newStatus;
      
      if (newStatus === PaymentStatus.APPROVED && mpPayment.date_approved) {
        this._approvedAt = new Date(mpPayment.date_approved);
      }
    }
    
    // Update payment method
    const methodMap: Record<string, PaymentMethod> = {
      'credit_card': PaymentMethod.CREDIT_CARD,
      'debit_card': PaymentMethod.DEBIT_CARD,
      'pix': PaymentMethod.PIX,
      'ticket': PaymentMethod.BOLETO,
      'account_money': PaymentMethod.ACCOUNT_MONEY,
    };
    
    this._method = methodMap[mpPayment.payment_method_id] || this._method;
    
    // Update installments
    if (mpPayment.installments) {
      this._installments = mpPayment.installments;
    }
    
    // Update fees
    if (mpPayment.fee_details) {
      this._fees = mpPayment.fee_details.map(fee => ({
        type: fee.type,
        amount: fee.amount,
        payer: fee.fee_payer,
      }));
    }
    
    // Update refunds
    if (mpPayment.refunds && mpPayment.refunds.length > 0) {
      for (const mpRefund of mpPayment.refunds) {
        const existingRefund = this._refunds.find(r => 
          r.id === mpRefund.id.toString() || 
          (r.amount === mpRefund.amount && r.createdAt.toISOString() === mpRefund.date_created)
        );
        
        if (!existingRefund) {
          this._refunds.push({
            id: mpRefund.id.toString(),
            amount: mpRefund.amount,
            status: mpRefund.status === 'approved' ? RefundStatus.APPROVED : 
                   mpRefund.status === 'rejected' ? RefundStatus.REJECTED : 
                   RefundStatus.PENDING,
            reason: mpRefund.reason,
            createdAt: new Date(mpRefund.date_created),
          });
        }
      }
      
      if (mpPayment.transaction_amount_refunded === mpPayment.transaction_amount) {
        this._status = PaymentStatus.REFUNDED;
        this._refundedAt = new Date();
      }
    }
    
    this._updatedAt = new Date();
  }

  public linkToProfile(profileId: string): void {
    if (this._profileId) {
      throw new Error('Payment is already linked to a profile');
    }
    
    this._profileId = profileId;
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get externalId(): string | undefined {
    return this._externalId;
  }

  get preferenceId(): string | undefined {
    return this._preferenceId;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get method(): PaymentMethod | undefined {
    return this._method;
  }

  get type(): PaymentType {
    return this._type;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get installments(): number | undefined {
    return this._installments;
  }

  get payer(): PaymentData['payer'] {
    return { ...this._payer };
  }

  get profileId(): string | undefined {
    return this._profileId;
  }

  get planType(): 'basic' | 'premium' {
    return this._planType;
  }

  get description(): string | undefined {
    return this._description;
  }

  get externalReference(): string {
    return this._externalReference;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  get refunds(): typeof this._refunds {
    return [...this._refunds];
  }

  get fees(): typeof this._fees {
    return this._fees ? [...this._fees] : undefined;
  }

  get deviceId(): string | undefined {
    return this._deviceId;
  }

  get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get approvedAt(): Date | undefined {
    return this._approvedAt;
  }

  get rejectedAt(): Date | undefined {
    return this._rejectedAt;
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt;
  }

  get refundedAt(): Date | undefined {
    return this._refundedAt;
  }

  // Serialization
  public toJSON(): PaymentData {
    return {
      id: this._id,
      externalId: this._externalId,
      preferenceId: this._preferenceId,
      status: this._status,
      method: this._method,
      type: this._type,
      amount: this._amount,
      currency: this._currency,
      installments: this._installments,
      payer: this.payer,
      profileId: this._profileId,
      planType: this._planType,
      description: this._description,
      externalReference: this._externalReference,
      metadata: this.metadata,
      refunds: this.refunds,
      fees: this.fees,
      deviceId: this._deviceId,
      ipAddress: this._ipAddress,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      approvedAt: this._approvedAt,
      rejectedAt: this._rejectedAt,
      cancelledAt: this._cancelledAt,
      refundedAt: this._refundedAt,
    };
  }

  // Factory method
  public static fromJSON(data: PaymentData): Payment {
    return new Payment(data);
  }

  public static fromMercadoPago(mpPayment: MercadoPagoPayment, planType: 'basic' | 'premium'): Payment {
    const payment = new Payment({
      externalId: mpPayment.id.toString(),
      amount: mpPayment.transaction_amount,
      currency: mpPayment.currency_id,
      planType,
      externalReference: mpPayment.external_reference || '',
      payer: {
        email: mpPayment.payer.email || '',
        name: mpPayment.payer.first_name || '',
        surname: mpPayment.payer.last_name,
        identification: mpPayment.payer.identification ? {
          type: mpPayment.payer.identification.type || '',
          number: mpPayment.payer.identification.number || ''
        } : undefined,
      },
      metadata: mpPayment.metadata,
    });
    
    payment.updateFromMercadoPago(mpPayment);
    return payment;
  }
}