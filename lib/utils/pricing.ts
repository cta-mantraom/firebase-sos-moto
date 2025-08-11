// lib/utils/pricing.ts - Price calculation rules (PURE)
export const PLAN_PRICES = {
    basic: 55.00,
    premium: 85.00
} as const;

export function calculatePrice(planType: 'basic' | 'premium'): number {
    return PLAN_PRICES[planType];
}

export function calculateDiscount(planType: string, promoCode?: string): number {
    if (promoCode === 'FIRST_RESPONDER' && planType === 'premium') {
        return 0.20; // 20% discount
    }
    return 0;
}

export function calculateFinalPrice(planType: 'basic' | 'premium', promoCode?: string): number {
    const basePrice = calculatePrice(planType);
    const discount = calculateDiscount(planType, promoCode);
    return basePrice * (1 - discount);
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
}