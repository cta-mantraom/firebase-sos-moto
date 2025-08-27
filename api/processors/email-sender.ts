import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { getEmailConfig } from "../../lib/config/index.js";
import { EmailJobDataSchema } from "../../lib/types/queue.types.js";
import { Email } from "../../lib/domain/notification/email.entity.js";
import {
  EmailTemplate,
  EmailPriority,
  PaymentConfirmationData,
  PaymentFailureData,
  ProfileCreatedData,
  WelcomeData,
} from "../../lib/domain/notification/email.types.js";
import { logInfo, logError } from "../../lib/utils/logger.js";

// Initialize AWS SES
const emailConfig = getEmailConfig();
const sesClient = new SESv2Client({
  region: emailConfig.aws.region || "sa-east-1",
  credentials: {
    accessKeyId: emailConfig.aws.accessKeyId!,
    secretAccessKey: emailConfig.aws.secretAccessKey!,
  },
});

/**
 * Email Templates
 */
const EMAIL_TEMPLATES = {
  confirmation: {
    subject: "Memoryys Guardian - Cadastro Confirmado",
    generateHtml: (data: PaymentConfirmationData) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Memoryys Guardian - Cadastro Confirmado</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 8px; overflow: hidden; }
            .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; background: white; }
            .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; }
            .plan-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .premium-badge { background: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏍️ Memoryys Guardian</h1>
              <p>Seu cadastro foi realizado com sucesso!</p>
            </div>
            <div class="content">
              <h2>Olá ${data.userName}!</h2>
              <p>Parabéns! Seu cadastro no Memoryys Guardian foi processado com sucesso.</p>
              
              <div style="margin: 20px 0; padding: 15px; background: #ecfdf5; border-radius: 8px;">
                <h3 style="margin-top: 0;">📋 Detalhes do seu plano</h3>
                <p><strong>Plano:</strong> <span class="plan-badge ${
                  data.planType === "premium" ? "premium-badge" : ""
                }">${
      data.planType === "premium" ? "Premium" : "Básico"
    }</span></p>
                <p><strong>Valor:</strong> R$ ${data.amount.toFixed(2)}</p>
                <p><strong>ID do Pagamento:</strong> ${data.paymentId}</p>
              </div>

              ${
                data.qrCodeUrl
                  ? `
              <div class="qr-section">
                <h3>📱 Seu QR Code de Emergência</h3>
                <p>Mantenha sempre com você durante suas viagens!</p>
                <img src="${data.qrCodeUrl}" alt="QR Code de Emergência" style="max-width: 200px; border: 2px solid #e5e7eb; border-radius: 8px;">
              </div>
              `
                  : ""
              }
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  data.memorialUrl
                }" class="button">🔗 Acessar Minha Página Memorial</a>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h4 style="margin-top: 0;">⚠️ Importante</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Mantenha o QR Code sempre acessível durante suas viagens</li>
                  <li>Verifique se seus dados estão corretos na página memorial</li>
                  <li>Guarde este email para referência futura</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">Se você tiver alguma dúvida, entre em contato conosco.</p>
              <p>Obrigado por confiar no Memoryys Guardian!</p>
            </div>
            <div class="footer">
              <p>© 2024 Memoryys Guardian. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    generateText: (data: PaymentConfirmationData) => `
      Memoryys Guardian - Cadastro Confirmado
      
      Olá ${data.userName}!
      
      Parabéns! Seu cadastro no Memoryys Guardian foi processado com sucesso.
      
      Detalhes do seu plano:
      - Plano: ${data.planType === "premium" ? "Premium" : "Básico"}
      - Valor: R$ ${data.amount.toFixed(2)}
      - ID do Pagamento: ${data.paymentId}
      
      Acesse sua página memorial: ${data.memorialUrl}
      
      ${data.qrCodeUrl ? `Seu QR Code: ${data.qrCodeUrl}` : ""}
      
      Mantenha o QR Code sempre acessível durante suas viagens.
      
      Obrigado por confiar no Memoryys Guardian!
    `,
  },
  failure: {
    subject: "Memoryys Guardian - Problema no Pagamento",
    generateHtml: (data: PaymentFailureData) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Memoryys Guardian - Problema no Pagamento</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 8px; overflow: hidden; }
            .header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; background: white; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; }
            .alert-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Memoryys Guardian</h1>
              <p>Problema identificado no pagamento</p>
            </div>
            <div class="content">
              <h2>Olá ${data.userName},</h2>
              <p>Infelizmente, identificamos um problema com seu pagamento.</p>
              
              <div class="alert-box">
                <h3 style="margin-top: 0; color: #dc2626;">⚠️ Detalhes do problema</h3>
                <p><strong>ID do Pagamento:</strong> ${data.paymentId}</p>
                <p><strong>Motivo:</strong> ${data.reason}</p>
              </div>
              
              <h3>🔄 O que fazer agora?</h3>
              <ul>
                <li>Verifique os dados do cartão de crédito</li>
                <li>Certifique-se de que há saldo disponível</li>
                <li>Tente novamente o pagamento</li>
              </ul>
              
              ${
                data.retryUrl
                  ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.retryUrl}" class="button">🔄 Tentar Novamente</a>
              </div>
              `
                  : ""
              }
              
              <p>Se o problema persistir, entre em contato com nosso suporte.</p>
            </div>
            <div class="footer">
              <p>© 2024 Memoryys Guardian. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    generateText: (data: PaymentFailureData) => `
      Memoryys Guardian - Problema no Pagamento
      
      Olá ${data.userName},
      
      Infelizmente, identificamos um problema com seu pagamento.
      
      Detalhes:
      - ID do Pagamento: ${data.paymentId}
      - Motivo: ${data.reason}
      
      ${data.retryUrl ? `Tentar novamente: ${data.retryUrl}` : ""}
      
      Se o problema persistir, entre em contato com nosso suporte.
    `,
  },
  welcome: {
    subject: "Memoryys Guardian - Bem-vindo!",
    generateHtml: (data: WelcomeData) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Memoryys Guardian - Bem-vindo!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 8px; overflow: hidden; }
            .header { background: #059669; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; background: white; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; }
            .features { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏍️ Memoryys Guardian</h1>
              <p>Bem-vindo à família!</p>
            </div>
            <div class="content">
              <h2>Olá ${data.userName}!</h2>
              <p>Seja bem-vindo ao Memoryys Guardian! Estamos muito felizes em tê-lo conosco.</p>
              
              <div class="features">
                <h3>🎯 Recursos do seu plano ${
                  data.planType === "premium" ? "Premium" : "Básico"
                }:</h3>
                <ul>
                  ${data.features
                    .map((feature) => `<li>${feature}</li>`)
                    .join("")}
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  data.memorialUrl
                }" class="button">🔗 Ver Minha Página Memorial</a>
              </div>
              
              <p>Agradecemos por escolher o Memoryys Guardian para sua segurança!</p>
            </div>
            <div class="footer">
              <p>© 2024 Memoryys Guardian. Todos os direitos reservados.</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    generateText: (data: WelcomeData) => `
      Memoryys Guardian - Bem-vindo!
      
      Olá ${data.userName}!
      
      Seja bem-vindo ao Memoryys Guardian!
      
      Recursos do seu plano ${
        data.planType === "premium" ? "Premium" : "Básico"
      }:
      ${data.features.map((feature) => `- ${feature}`).join("\n")}
      
      Acesse sua página: ${data.memorialUrl}
      
      Obrigado por escolher o Memoryys Guardian!
    `,
  },
  reminder: {
    subject: "Memoryys Guardian - Lembrete",
    generateHtml: (data: WelcomeData) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Memoryys Guardian - Lembrete</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Memoryys Guardian - Lembrete</h1>
            <p>Olá ${data.userName},</p>
            <p>Este é um lembrete sobre sua conta no Memoryys Guardian.</p>
            <p>Para mais informações, acesse sua página memorial.</p>
            <a href="${
              data.memorialUrl || "#"
            }" class="button">Acessar Página</a>
          </div>
        </body>
      </html>
    `,
    generateText: (data: WelcomeData) => `
      Memoryys Guardian - Lembrete
      
      Olá ${data.userName},
      
      Este é um lembrete sobre sua conta no Memoryys Guardian.
      
      Acesse: ${data.memorialUrl || ""}
    `,
  },
};

/**
 * Email Sender API Endpoint
 *
 * This endpoint handles asynchronous email sending with automatic retry logic,
 * dynamic templates, and delivery logging.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) || crypto.randomUUID();

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type, x-correlation-id"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      correlationId,
    });
  }

  try {
    logInfo("Email sender started", {
      correlationId,
      method: req.method,
      userAgent: req.headers["user-agent"],
    });

    // Validate request body
    const validationResult = EmailJobDataSchema.safeParse(req.body);
    if (!validationResult.success) {
      logError("Invalid email job data", new Error("Validation failed"), {
        correlationId,
        errors: validationResult.error.errors,
      });

      return res.status(400).json({
        error: "Invalid email job data",
        details: validationResult.error.errors,
        correlationId,
      });
    }

    const jobData = validationResult.data;

    logInfo("Processing email job", {
      correlationId,
      template: jobData.template,
      recipient: jobData.email,
      retryCount: jobData.retryCount,
    });

    // Get email template
    const template =
      EMAIL_TEMPLATES[jobData.template as keyof typeof EMAIL_TEMPLATES];
    if (!template) {
      throw new Error(`Unknown email template: ${jobData.template}`);
    }

    // Generate email content based on template type
    let templateData:
      | PaymentConfirmationData
      | PaymentFailureData
      | WelcomeData
      | ProfileCreatedData;

    // Base template data
    const baseData = {
      userName: jobData.name,
      userEmail: jobData.email,
      timestamp: new Date(),
    };

    // Add template-specific data
    switch (jobData.template) {
      case "confirmation":
        templateData = {
          ...baseData,
          paymentId: jobData.templateData.paymentId || "N/A",
          amount: jobData.templateData.amount || 0,
          planType: jobData.templateData.planType,
          memorialUrl: jobData.templateData.memorialUrl,
          qrCodeUrl: jobData.templateData.qrCodeUrl,
        } as PaymentConfirmationData;
        break;
      case "failure":
        templateData = {
          ...baseData,
          paymentId: jobData.templateData.paymentId || "N/A",
          reason: "Payment processing failed", // Default reason
          retryUrl: undefined,
        } as PaymentFailureData;
        break;
      case "welcome":
        templateData = {
          ...baseData,
          memorialUrl: jobData.templateData.memorialUrl,
          planType: jobData.templateData.planType,
          features: [],
        } as WelcomeData;
        break;
      case "reminder":
        templateData = {
          ...baseData,
          memorialUrl: jobData.templateData.memorialUrl,
          planType: jobData.templateData.planType,
          features: [],
        } as WelcomeData;
        break;
      default:
        templateData = {
          ...baseData,
          memorialUrl: jobData.templateData.memorialUrl,
          planType: jobData.templateData.planType,
          features: [],
        } as WelcomeData;
    }

    // Seguindo regras: gerar conteúdo HTML e texto diretamente com tipos corretos
    let htmlContent: string = "";
    let textContent: string = "";

    // Usar templates específicos para cada tipo
    if (jobData.template === "confirmation" && template) {
      const confirmationData: PaymentConfirmationData = {
        userName: jobData.name,
        userEmail: jobData.email,
        timestamp: new Date(),
        paymentId: jobData.templateData.paymentId || "N/A",
        amount: jobData.templateData.amount || 0,
        planType: jobData.templateData.planType,
        memorialUrl: jobData.templateData.memorialUrl,
        qrCodeUrl: jobData.templateData.qrCodeUrl,
      };
      htmlContent = EMAIL_TEMPLATES.confirmation.generateHtml(confirmationData);
      textContent = EMAIL_TEMPLATES.confirmation.generateText(confirmationData);
    } else if (jobData.template === "failure" && template) {
      const failureData: PaymentFailureData = {
        userName: jobData.name,
        userEmail: jobData.email,
        timestamp: new Date(),
        paymentId: jobData.templateData.paymentId || "N/A",
        reason: "Payment processing failed",
        retryUrl: undefined,
      };
      htmlContent = EMAIL_TEMPLATES.failure.generateHtml(failureData);
      textContent = EMAIL_TEMPLATES.failure.generateText(failureData);
    } else {
      const welcomeData: WelcomeData = {
        userName: jobData.name,
        userEmail: jobData.email,
        timestamp: new Date(),
        planType: jobData.templateData.planType,
        memorialUrl: jobData.templateData.memorialUrl,
        features: [],
      };
      htmlContent = EMAIL_TEMPLATES.welcome.generateHtml(welcomeData);
      textContent = EMAIL_TEMPLATES.welcome.generateText(welcomeData);
    }

    // Create email entity
    const email = new Email({
      to: [jobData.email],
      subject: template.subject,
      template:
        jobData.template === "confirmation"
          ? EmailTemplate.PAYMENT_CONFIRMATION
          : jobData.template === "failure"
          ? EmailTemplate.PAYMENT_FAILURE
          : jobData.template === "welcome"
          ? EmailTemplate.WELCOME
          : EmailTemplate.PAYMENT_CONFIRMATION,
      templateData: {
        ...templateData,
        paymentId:
          "paymentId" in templateData
            ? templateData.paymentId
            : jobData.templateData.paymentId || "N/A",
      },
      config: {
        from: emailConfig.aws.fromEmail || "contact@memoryys.com",
      },
      options: {
        priority: EmailPriority.NORMAL,
        correlationId,
        maxRetries: jobData.maxRetries || 3,
        retryCount: jobData.retryCount || 0,
      },
    });

    // Mark as sending
    email.markAsSending();

    // Send email via AWS SES
    const messageId = await sendEmailViaSES(
      jobData.email,
      template.subject,
      htmlContent,
      textContent,
      correlationId
    );

    // Mark as sent
    email.markAsSent(messageId);

    logInfo("Email sent successfully", {
      correlationId,
      messageId,
      template: jobData.template,
      recipient: jobData.email,
    });

    return res.status(200).json({
      success: true,
      messageId,
      template: jobData.template,
      recipient: jobData.email,
      correlationId,
    });
  } catch (error) {
    logError("Email sending failed", error as Error, {
      correlationId,
      retryCount: req.body?.retryCount || 0,
    });

    // Determine if this is a retryable error
    const isRetryable = isRetryableError(error as Error);
    const statusCode = isRetryable ? 500 : 422;

    return res.status(statusCode).json({
      error: "Email sending failed",
      message: (error as Error).message,
      retryable: isRetryable,
      correlationId,
    });
  }
}

/**
 * Sends email via AWS SES
 */
async function sendEmailViaSES(
  recipient: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  correlationId: string
): Promise<string> {
  try {
    logInfo("Sending email via AWS SES", {
      correlationId,
      recipient,
      subject,
    });

    const command = new SendEmailCommand({
      FromEmailAddress: emailConfig.aws.fromEmail || "contact@memoryys.com",
      Destination: {
        ToAddresses: [recipient],
      },
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: "UTF-8",
            },
            Text: {
              Data: textContent,
              Charset: "UTF-8",
            },
          },
        },
      },
      ConfigurationSetName: emailConfig.aws.configurationSet,
    });

    const response = await sesClient.send(command);
    const messageId = response.MessageId!;

    logInfo("Email sent via AWS SES", {
      correlationId,
      messageId,
      recipient,
    });

    return messageId;
  } catch (error) {
    logError("Error sending email via AWS SES", error as Error, {
      correlationId,
      recipient,
      subject,
    });
    throw error;
  }
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  // AWS SES specific retryable errors
  const retryableAwsErrors = [
    "Throttling",
    "RequestTimeout",
    "ServiceUnavailable",
    "InternalServerError",
  ];

  // Network-related errors
  const retryableNetworkErrors = [
    "ECONNRESET",
    "ENOTFOUND",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EAI_AGAIN",
  ];

  // Check AWS error code
  if ("name" in error && typeof error.name === "string") {
    if (retryableAwsErrors.includes(error.name)) {
      return true;
    }
  }

  // Check error code
  if ("code" in error && typeof error.code === "string") {
    if (retryableNetworkErrors.includes(error.code)) {
      return true;
    }
  }

  // Check error message for transient issues
  const errorMessage = error.message.toLowerCase();
  const retryableMessages = [
    "timeout",
    "connection",
    "network",
    "temporary",
    "rate limit",
    "throttl",
    "quota",
    "busy",
  ];

  return retryableMessages.some((msg) => errorMessage.includes(msg));
}
