import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { z } from "zod";
import { logInfo, logError, logWarning } from "../../utils/logger.js";
import { Profile } from "../../domain/profile/profile.entity.js";
import { generateCorrelationId } from "../../utils/ids.js";
import { getEmailConfig, getAppConfig } from "../../config/index.js";

// Schemas de validação
const EmailDataSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  htmlBody: z.string(),
  textBody: z.string().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});

const EmailTemplateDataSchema = z.object({
  name: z.string(),
  profileUrl: z.string().url().optional(),
  qrCodeUrl: z.string().url().optional(),
  planType: z.string().optional(),
  amount: z.number().optional(),
  paymentId: z.string().optional(),
  error: z.string().optional(),
});

// Tipos derivados
export type EmailData = z.infer<typeof EmailDataSchema>;
export type EmailTemplateData = z.infer<typeof EmailTemplateDataSchema>;

export enum EmailType {
  PAYMENT_CONFIRMATION = "payment_confirmation",
  PAYMENT_FAILED = "payment_failed",
  PROFILE_CREATED = "profile_created",
  PROFILE_UPDATED = "profile_updated",
  PASSWORD_RESET = "password_reset",
  WELCOME = "welcome",
}

export interface EmailServiceConfig {
  fromEmail: string;
  replyToEmail: string;
  maxRetries: number;
  retryDelayMs: number;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class EmailService {
  private readonly sesClient: SESClient;
  private readonly config: EmailServiceConfig;

  constructor(config?: Partial<EmailServiceConfig>) {
    const emailConfig = getEmailConfig();
    this.config = {
      fromEmail:
        config?.fromEmail ??
        emailConfig.aws.fromEmail ??
        "contact@memoryys.com",
      replyToEmail:
        config?.replyToEmail ??
        emailConfig.aws.replyTo ??
        "contact@memoryys.com",
      maxRetries: config?.maxRetries ?? 3,
      retryDelayMs: config?.retryDelayMs ?? 1000,
      region: config?.region ?? emailConfig.aws.region ?? "sa-east-1",
      accessKeyId: config?.accessKeyId ?? emailConfig.aws.accessKeyId!,
      secretAccessKey:
        config?.secretAccessKey ?? emailConfig.aws.secretAccessKey!,
    };

    this.sesClient = new SESClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  /**
   * Envia email de confirmação de pagamento
   */
  async sendConfirmationEmail(
    profile: Profile,
    qrCodeDataUrl: string
  ): Promise<void> {
    const correlationId = generateCorrelationId();

    try {
      const templateData: EmailTemplateData = {
        name: `${profile.personalData.name} ${profile.personalData.surname}`,
        profileUrl: profile.memorialUrl || "",
        qrCodeUrl: profile.qrCodeUrl || qrCodeDataUrl,
        planType: profile.planType,
      };

      const htmlBody = this.generateEmailTemplate(
        EmailType.PAYMENT_CONFIRMATION,
        templateData
      );
      const textBody = this.generateTextTemplate(
        EmailType.PAYMENT_CONFIRMATION,
        templateData
      );

      const emailData: EmailData = {
        to: profile.personalData.email,
        subject: "Pagamento Confirmado - Memoryys",
        htmlBody,
        textBody,
        from: this.config.fromEmail,
        replyTo: this.config.replyToEmail,
      };

      await this.sendEmail(emailData, correlationId);

      logInfo("Confirmation email sent successfully", {
        to: profile.personalData.email,
        profileId: profile.uniqueUrl,
        correlationId,
      });
    } catch (error) {
      logError("Failed to send confirmation email", error as Error, {
        profileId: profile.uniqueUrl,
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Envia notificação de falha no pagamento
   */
  async sendFailureNotification(email: string, error: string): Promise<void> {
    const correlationId = generateCorrelationId();

    try {
      const templateData: EmailTemplateData = {
        name: "Cliente",
        error,
      };

      const htmlBody = this.generateEmailTemplate(
        EmailType.PAYMENT_FAILED,
        templateData
      );
      const textBody = this.generateTextTemplate(
        EmailType.PAYMENT_FAILED,
        templateData
      );

      const emailData: EmailData = {
        to: email,
        subject: "Falha no Processamento do Pagamento - Memoryys",
        htmlBody,
        textBody,
        from: this.config.fromEmail,
        replyTo: this.config.replyToEmail,
      };

      await this.sendEmail(emailData, correlationId);

      logInfo("Failure notification sent", {
        to: email,
        correlationId,
      });
    } catch (sendError) {
      logError("Failed to send failure notification", sendError as Error, {
        to: email,
        originalError: error,
        correlationId,
      });
      throw sendError;
    }
  }

  /**
   * Envia email genérico com retry
   */
  private async sendEmail(
    emailData: EmailData,
    correlationId: string
  ): Promise<void> {
    // Validar dados do email
    const validatedData = EmailDataSchema.parse(emailData);

    await this.retryEmailSend(
      validatedData,
      this.config.maxRetries,
      correlationId
    );
  }

  /**
   * Implementa retry logic para envio de email
   */
  private async retryEmailSend(
    emailData: EmailData,
    retriesLeft: number,
    correlationId: string
  ): Promise<void> {
    try {
      const command = new SendEmailCommand({
        Source: emailData.from,
        Destination: {
          ToAddresses: [emailData.to],
          CcAddresses: emailData.cc,
          BccAddresses: emailData.bcc,
        },
        Message: {
          Subject: {
            Data: emailData.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: emailData.htmlBody,
              Charset: "UTF-8",
            },
            Text: emailData.textBody
              ? {
                  Data: emailData.textBody,
                  Charset: "UTF-8",
                }
              : undefined,
          },
        },
        ReplyToAddresses: emailData.replyTo ? [emailData.replyTo] : undefined,
      });

      const response = await this.sesClient.send(command);

      logInfo("Email sent successfully", {
        messageId: response.MessageId,
        to: emailData.to,
        subject: emailData.subject,
        correlationId,
      });
    } catch (error) {
      if (retriesLeft > 0) {
        logWarning("Email send failed, retrying...", {
          retriesLeft,
          error: (error as Error).message,
          correlationId,
        });

        await this.delay(this.config.retryDelayMs);
        await this.retryEmailSend(emailData, retriesLeft - 1, correlationId);
      } else {
        logError("Email send failed after all retries", error as Error, {
          to: emailData.to,
          subject: emailData.subject,
          correlationId,
        });
        throw error;
      }
    }
  }

  /**
   * Gera template HTML do email
   */
  private generateEmailTemplate(
    type: EmailType,
    data: EmailTemplateData
  ): string {
    switch (type) {
      case EmailType.PAYMENT_CONFIRMATION:
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Pagamento Confirmado - Memoryys</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f4f4f4; }
              .qr-code { text-align: center; margin: 20px 0; }
              .button { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }
              .footer { text-align: center; padding: 20px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pagamento Confirmado!</h1>
              </div>
              <div class="content">
                <p>Olá ${data.name},</p>
                <p>Seu pagamento foi processado com sucesso e seu perfil de emergência está ativo.</p>
                <p><strong>Plano:</strong> ${
                  data.planType === "premium" ? "Premium" : "Básico"
                }</p>
                
                ${
                  data.qrCodeUrl
                    ? `
                  <div class="qr-code">
                    <p><strong>Seu QR Code de Emergência:</strong></p>
                    <img src="${data.qrCodeUrl}" alt="QR Code" style="max-width: 200px;">
                  </div>
                `
                    : ""
                }
                
                ${
                  data.profileUrl
                    ? `
                  <p style="text-align: center;">
                    <a href="${data.profileUrl}" class="button">Acessar Meu Perfil</a>
                  </p>
                `
                    : ""
                }
                
                <p>Imprima ou salve seu QR Code em local seguro. Em caso de emergência, ele permitirá acesso rápido às suas informações médicas.</p>
              </div>
              <div class="footer">
                <p>Memoryys - Sua segurança em primeiro lugar</p>
                <p>Dúvidas? Entre em contato: ${this.config.fromEmail}</p>
              </div>
            </div>
          </body>
          </html>
        `;

      case EmailType.PAYMENT_FAILED:
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Falha no Pagamento - Memoryys</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f4f4f4; }
              .button { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }
              .footer { text-align: center; padding: 20px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Falha no Processamento do Pagamento</h1>
              </div>
              <div class="content">
                <p>Olá ${data.name},</p>
                <p>Infelizmente, houve um problema ao processar seu pagamento.</p>
                ${
                  data.error
                    ? `<p><strong>Motivo:</strong> ${data.error}</p>`
                    : ""
                }
                <p>Por favor, tente realizar o pagamento novamente ou entre em contato com nosso suporte.</p>
                <p style="text-align: center;">
                  <a href="${
                    getAppConfig().publicUrl || getAppConfig().frontendUrl
                  }" class="button">Tentar Novamente</a>
                </p>
              </div>
              <div class="footer">
                <p>Memoryys - Sua segurança em primeiro lugar</p>
                <p>Dúvidas? Entre em contato: ${this.config.fromEmail}</p>
              </div>
            </div>
          </body>
          </html>
        `;

      default:
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Memoryys</title>
          </head>
          <body>
            <p>Email de ${type}</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </body>
          </html>
        `;
    }
  }

  /**
   * Gera template de texto do email
   */
  private generateTextTemplate(
    type: EmailType,
    data: EmailTemplateData
  ): string {
    switch (type) {
      case EmailType.PAYMENT_CONFIRMATION:
        return `
Pagamento Confirmado - Memoryys

Olá ${data.name},

Seu pagamento foi processado com sucesso e seu perfil de emergência está ativo.

Plano: ${data.planType === "premium" ? "Premium" : "Básico"}

${data.profileUrl ? `Acesse seu perfil em: ${data.profileUrl}` : ""}

Imprima ou salve seu QR Code em local seguro.

Memoryys - Sua segurança em primeiro lugar
Dúvidas? ${this.config.fromEmail}
        `;

      case EmailType.PAYMENT_FAILED:
        return `
Falha no Pagamento - Memoryys

Olá ${data.name},

Infelizmente, houve um problema ao processar seu pagamento.
${data.error ? `Motivo: ${data.error}` : ""}

Por favor, tente realizar o pagamento novamente ou entre em contato com nosso suporte.

Memoryys - Sua segurança em primeiro lugar
Dúvidas? ${this.config.fromEmail}
        `;

      default:
        return `Email de ${type}\n${JSON.stringify(data, null, 2)}`;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Valida configuração do SES
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      // Tentar enviar um email de teste para verificar configuração
      const command = new SendEmailCommand({
        Source: this.config.fromEmail,
        Destination: {
          ToAddresses: [this.config.fromEmail],
        },
        Message: {
          Subject: {
            Data: "SES Configuration Test",
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: "This is a test email to validate SES configuration.",
              Charset: "UTF-8",
            },
          },
        },
      });

      await this.sesClient.send(command);
      logInfo("SES configuration validated successfully");
      return true;
    } catch (error) {
      logError("SES configuration validation failed", error as Error);
      return false;
    }
  }
}
