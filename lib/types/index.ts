// lib/types/index.ts - Centralized type definitions
import { z } from 'zod';
import { ProfileSchema, CreatePaymentSchema } from '../utils/validation';

// Core types from validation schemas
export type Profile = z.infer<typeof ProfileSchema>;
export type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;

// API Response types
export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    correlationId: string;
    timestamp: string;
}

export interface ErrorResponse {
    success: false;
    error: string;
    correlationId: string;
    timestamp: string;
    details?: unknown;
}

// Memorial/Profile specific types
export interface MemorialData {
    name: string;
    age: number;
    phone: string;
    email: string;
    blood_type?: string;
    allergies?: string[];
    medications?: string[];
    medical_conditions?: string[];
    health_plan?: string;
    preferred_hospital?: string;
    medical_notes?: string;
    emergency_contacts: EmergencyContact[];
    plan_type: "basic" | "premium";
    created_at: string;
    unique_url?: string;
    qr_code_data?: string;
    qr_code_image_url?: string;
}

export interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}

export interface ProfileResponse {
    success: boolean;
    data?: MemorialData;
    error?: string;
    source: "redis" | "database";
    correlationId: string;
    cached: boolean;
}

// Payment types
export interface PaymentPreference {
    name: string;
    email: string;
    phone: string;
    planType: 'basic' | 'premium';
    uniqueUrl: string;
    userData: Profile;
}

// Helper functions for response creation
export function createSuccessResponse<T>(data: T, correlationId: string): APIResponse<T> {
    return {
        success: true,
        data,
        correlationId,
        timestamp: new Date().toISOString()
    };
}

export function createErrorResponse(error: string, correlationId: string, details?: unknown): ErrorResponse {
    return {
        success: false,
        error,
        correlationId,
        timestamp: new Date().toISOString(),
        details
    };
}