import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

// Initialize AWS SES client
const sesClient = new SESv2Client({
  region: process.env.AWS_SES_REGION || "sa-east-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
  },
});

export const sendConfirmationEmail = onDocumentCreated(
  {
    document: "email_queue/{emailId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const db = admin.firestore();
    const snap = event.data;
    if (!snap) {
      console.log("No data associated with the event");
      return;
    }
    const emailData = snap.data();
    const emailId = event.params.emailId;

    try {
      console.log(`Sending email to ${emailData.to}`);

      // Create email HTML content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .qr-code { text-align: center; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Moto SOS Guardian</h1>
                <p>Confirmação de Cadastro</p>
              </div>
              <div class="content">
                <h2>Olá ${emailData.name}!</h2>
                <p>Seu cadastro no Moto SOS Guardian foi realizado com sucesso!</p>
                <p><strong>Plano contratado:</strong> ${
                  emailData.planType === "premium" ? "Premium" : "Básico"
                }</p>
                
                <div class="qr-code">
                  <p><strong>Seu QR Code de emergência:</strong></p>
                  <img src="${
                    emailData.qrCodeData
                  }" alt="QR Code" style="max-width: 200px;">
                </div>
                
                <p>Acesse sua página memorial através do link:</p>
                <p style="text-align: center;">
                  <a href="${
                    emailData.memorialUrl
                  }" class="button">Acessar Minha Página</a>
                </p>
                
                <p>Mantenha este QR Code sempre com você durante suas viagens!</p>
              </div>
              <div class="footer">
                <p>© 2024 Moto SOS Guardian. Todos os direitos reservados.</p>
                <p>Este é um email automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Send email via AWS SES
      const command = new SendEmailCommand({
        FromEmailAddress: process.env.SES_FROM_EMAIL || "contact@memoryys.com",
        Destination: {
          ToAddresses: [emailData.to],
        },
        Content: {
          Simple: {
            Subject: {
              Data: "Moto SOS Guardian - Cadastro Confirmado",
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: emailHtml,
                Charset: "UTF-8",
              },
              Text: {
                Data: `Olá ${emailData.name}! Seu cadastro no Moto SOS Guardian foi realizado com sucesso. Acesse sua página: ${emailData.memorialUrl}`,
                Charset: "UTF-8",
              },
            },
          },
        },
      });

      const response = await sesClient.send(command);

      // Update email status
      await db.collection("email_queue").doc(emailId).update({
        status: "sent",
        messageId: response.MessageId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      console.error(`Failed to send email to ${emailData.to}:`, error);

      // Update email status to failed
      await db
        .collection("email_queue")
        .doc(emailId)
        .update({
          status: "failed",
          error: (error as Error).message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  }
);
