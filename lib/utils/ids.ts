import { v4 as uuidv4 } from 'uuid';

export function generateUniqueUrl(): string {
    return uuidv4().replace(/-/g, '').slice(0, 12);
}

export function generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generatePaymentId(): string {
    return `payment_${Date.now()}_${uuidv4().slice(0, 8)}`;
}

export function generateProfileId(): string {
    return `profile_${uuidv4()}`;
}
