import * as crypto from "crypto";

/**
 * Validates HMAC signature from MercadoPago webhook
 */
export function validateHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split(",");
  let ts = "";
  let v1 = "";

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "ts") {
      ts = value;
    } else if (key === "v1") {
      v1 = value;
    }
  }

  const manifest = `id:${payload};request-id:${ts};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const sha = hmac.digest("hex");

  return sha === v1;
}

/**
 * Generates a unique URL identifier
 */
export function generateUniqueUrl(): string {
  return crypto.randomUUID();
}