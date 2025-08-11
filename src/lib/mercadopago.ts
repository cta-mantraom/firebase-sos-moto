import { initMercadoPago } from "@mercadopago/sdk-react";

// Initialize MercadoPago with public key
export const initializeMercadoPago = () => {
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error("MercadoPago public key not configured");
  }
  
  initMercadoPago(publicKey, {
    locale: "pt-BR",
  });
};

// Initialize on module load
if (typeof window !== "undefined") {
  initializeMercadoPago();
}