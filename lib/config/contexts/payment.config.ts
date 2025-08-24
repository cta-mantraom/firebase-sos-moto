import { z } from 'zod';

/**
 * MercadoPago Configuration
 * Lazy-loaded singleton pattern for optimal performance
 */

const PaymentConfigSchema = z.object({
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'MercadoPago access token is required'),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, 'MercadoPago webhook secret is required'),
  MERCADOPAGO_PUBLIC_KEY: z.string().min(1, 'MercadoPago public key is required'),
});

export interface PaymentConfigType {
  accessToken: string;
  webhookSecret: string;
  publicKey: string;
  baseUrl: string;
}

class PaymentConfig {
  private static instance: PaymentConfigType | null = null;

  static get(): PaymentConfigType {
    if (!this.instance) {
      const validated = PaymentConfigSchema.parse(process.env);
      
      this.instance = {
        accessToken: validated.MERCADOPAGO_ACCESS_TOKEN,
        webhookSecret: validated.MERCADOPAGO_WEBHOOK_SECRET,
        publicKey: validated.MERCADOPAGO_PUBLIC_KEY,
        baseUrl: 'https://api.mercadopago.com',
      };
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

/**
 * Get MercadoPago configuration
 * @returns Validated and typed MercadoPago configuration
 */
export const getPaymentConfig = (): PaymentConfigType => PaymentConfig.get();