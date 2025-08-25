import { z } from "zod";

/**
 * AWS SES Email Configuration
 * Lazy-loaded singleton pattern for optimal performance
 */

const EmailConfigSchema = z.object({
  AWS_SES_REGION: z.string().default("sa-east-1"),
  AWS_SES_ACCESS_KEY_ID: z.string().min(1, "AWS SES access key is required"),
  AWS_SES_SECRET_ACCESS_KEY: z
    .string()
    .min(1, "AWS SES secret key is required"),
  AWS_SES_FROM_EMAIL: z.string().email().default("contact@memoryys.com"),
  AWS_SES_REPLY_TO_EMAIL: z.string().email().default("contact@memoryys.com"),
  AWS_SES_CONFIGURATION_SET: z.string().optional(),
});

export interface EmailConfigType {
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    fromEmail: string;
    replyTo: string;
    configurationSet?: string;
  };
}

class EmailConfig {
  private static instance: EmailConfigType | null = null;

  static get(): EmailConfigType {
    if (!this.instance) {
      const validated = EmailConfigSchema.parse(process.env);

      this.instance = {
        aws: {
          region: validated.AWS_SES_REGION,
          accessKeyId: validated.AWS_SES_ACCESS_KEY_ID,
          secretAccessKey: validated.AWS_SES_SECRET_ACCESS_KEY,
          fromEmail: validated.AWS_SES_FROM_EMAIL,
          replyTo: validated.AWS_SES_REPLY_TO_EMAIL,
          configurationSet: validated.AWS_SES_CONFIGURATION_SET,
        },
      };
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

/**
 * Get Email configuration for AWS SES
 * @returns Validated and typed email configuration
 */
export const getEmailConfig = (): EmailConfigType => EmailConfig.get();
