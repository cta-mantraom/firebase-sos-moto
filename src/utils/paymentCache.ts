import { z } from 'zod';

export interface FormData {
  name: string;
  surname?: string;
  email: string;
  phone: string;
  birthDate?: string;
  age?: number;
  bloodType: string;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  healthPlan?: string;
  preferredHospital?: string;
  medicalNotes?: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship?: string;
  }>;
  selectedPlan: 'basic' | 'premium';
  deviceId?: string;
}

// Interface específica para dados do pagamento MercadoPago
// Baseada em MercadoPagoPayment mas simplificada para cache frontend
export interface PaymentDataCache {
  id?: number | string; // ID do pagamento no MercadoPago
  status?: string; // Status do pagamento (pending, approved, etc.)
  statusDetail?: string; // Detalhes adicionais do status
  paymentMethodId?: string; // Método de pagamento usado
  paymentTypeId?: string; // Tipo de pagamento
  transactionAmount?: number; // Valor da transação
  dateCreated?: string; // Data de criação
  dateApproved?: string; // Data de aprovação
  externalReference?: string; // Referência externa (profileId)
  preferenceId?: string; // ID da preferência de pagamento
  deviceId?: string; // 🚨 CRÍTICO: Device ID para taxa de aprovação MercadoPago
  metadata?: Record<string, unknown>; // Metadados adicionais
  payer?: {
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };
  pointOfInteraction?: {
    transactionData?: {
      qrCode?: string; // QR Code para PIX
      ticketUrl?: string; // URL do boleto
    };
  };
}

// Schema Zod para validação de dados externos do pagamento
export const PaymentDataCacheSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  status: z.string().optional(),
  statusDetail: z.string().optional(),
  paymentMethodId: z.string().optional(),
  paymentTypeId: z.string().optional(),
  transactionAmount: z.number().optional(),
  dateCreated: z.string().optional(),
  dateApproved: z.string().optional(),
  externalReference: z.string().optional(),
  preferenceId: z.string().optional(),
  deviceId: z.string().optional(), // 🚨 CRÍTICO: Device ID para MercadoPago
  metadata: z.record(z.unknown()).optional(),
  payer: z.object({
    email: z.string().email().optional(),
    identification: z.object({
      type: z.string().optional(),
      number: z.string().optional(),
    }).optional(),
  }).optional(),
  pointOfInteraction: z.object({
    transactionData: z.object({
      qrCode: z.string().optional(),
      ticketUrl: z.string().optional(),
    }).optional(),
  }).optional(),
});

export interface PaymentCacheData {
  formData: FormData;
  paymentData?: PaymentDataCache; // Tipo específico ao invés de any
  uniqueUrl?: string;
  paymentId?: string;
  preferenceId?: string;
  timestamp: number;
  deviceId?: string; // 🚨 CRÍTICO: Required for MercadoPago approval
}

export class PaymentCache {
  private static readonly KEY = 'pendingPayment';
  private static readonly BACKUP_KEY = 'pendingPaymentBackup';
  private static readonly EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas
  
  /**
   * 🚨 CRÍTICO: Obtém o Device ID do MercadoPago
   * Device ID é OBRIGATÓRIO para melhorar taxa de aprovação
   */
  private static getMercadoPagoDeviceId(): string | undefined {
    // Definir tipo para window com MercadoPago
    interface WindowWithMP extends Window {
      MP_DEVICE_SESSION_ID?: string;
    }
    
    // Verificar se o MercadoPago SDK está disponível
    if (typeof window !== 'undefined') {
      const windowMP = window as unknown as WindowWithMP;
      if (windowMP.MP_DEVICE_SESSION_ID) {
        return windowMP.MP_DEVICE_SESSION_ID;
      }
    }
    
    // Tentar obter do sessionStorage (pode ter sido salvo anteriormente)
    try {
      const storedDeviceId = sessionStorage.getItem('MP_DEVICE_SESSION_ID');
      if (storedDeviceId) {
        return storedDeviceId;
      }
    } catch (error) {
      // SessionStorage pode não estar disponível em alguns ambientes
      console.warn('[PaymentCache] Unable to access sessionStorage:', error);
    }
    
    console.error(
      '[PaymentCache] 🚨 CRITICAL: MercadoPago Device ID not found!',
      '\nThis will SEVERELY impact payment approval rates.',
      '\nEnsure MercadoPago security script is loaded.'
    );
    return undefined;
  }
  
  /**
   * Salva dados do pagamento no sessionStorage com backup no localStorage
   * 🚨 CRÍTICO: Device ID é essencial para taxa de aprovação do MercadoPago
   */
  static save(data: PaymentCacheData): boolean {
    try {
      // Verificar Device ID crítico para MercadoPago
      if (!data.deviceId && !data.formData?.deviceId) {
        console.error(
          '[PaymentCache] 🚨 CRITICAL WARNING: No Device ID found!',
          '\n- MercadoPago approval rate will be SEVERELY impacted',
          '\n- Device ID is required for fraud prevention',
          '\n- Please ensure MercadoPago SDK is properly initialized'
        );
      }
      
      const dataWithTimestamp = {
        ...data,
        timestamp: data.timestamp || Date.now(),
        // Garantir que o Device ID seja preservado
        deviceId: data.deviceId || data.formData?.deviceId
      };
      
      const jsonData = JSON.stringify(dataWithTimestamp);
      
      // Salvar no sessionStorage (principal)
      sessionStorage.setItem(this.KEY, jsonData);
      
      // Backup no localStorage (caso o usuário feche a aba)
      localStorage.setItem(this.BACKUP_KEY, jsonData);
      
      console.log('[PaymentCache] Data saved successfully');
      return true;
    } catch (error) {
      console.error('[PaymentCache] Failed to save:', error);
      return false;
    }
  }
  
  /**
   * Recupera dados do cache, primeiro do sessionStorage, depois do localStorage
   */
  static get(): PaymentCacheData | null {
    try {
      // Tentar sessionStorage primeiro
      let cached = sessionStorage.getItem(this.KEY);
      let source = 'session';
      
      // Se não encontrou, tentar localStorage
      if (!cached) {
        cached = localStorage.getItem(this.BACKUP_KEY);
        source = 'local';
      }
      
      if (!cached) return null;
      
      const data = JSON.parse(cached) as PaymentCacheData;
      
      // Verificar expiração
      if (Date.now() - data.timestamp > this.EXPIRY_MS) {
        console.log('[PaymentCache] Cache expired, clearing...');
        this.clear();
        return null;
      }
      
      console.log(`[PaymentCache] Data retrieved from ${source}Storage`);
      
      // Se veio do localStorage, copiar para sessionStorage
      if (source === 'local') {
        sessionStorage.setItem(this.KEY, cached);
      }
      
      return data;
    } catch (error) {
      console.error('[PaymentCache] Failed to get:', error);
      return null;
    }
  }
  
  /**
   * Atualiza dados específicos no cache
   * Preserva Device ID crítico para MercadoPago
   */
  static update(updates: Partial<PaymentCacheData>): boolean {
    try {
      const current = this.get();
      if (!current) return false;
      
      const updated = {
        ...current,
        ...updates,
        timestamp: current.timestamp, // Manter timestamp original
        // 🚨 CRÍTICO: Sempre preservar Device ID
        deviceId: updates.deviceId || current.deviceId || current.formData?.deviceId
      };
      
      return this.save(updated);
    } catch (error) {
      console.error('[PaymentCache] Failed to update:', error);
      return false;
    }
  }
  
  /**
   * Limpa todos os dados do cache
   */
  static clear(): void {
    try {
      sessionStorage.removeItem(this.KEY);
      localStorage.removeItem(this.BACKUP_KEY);
      console.log('[PaymentCache] Cache cleared');
    } catch (error) {
      console.error('[PaymentCache] Failed to clear:', error);
    }
  }
  
  /**
   * Verifica se existe cache válido
   */
  static exists(): boolean {
    return this.get() !== null;
  }
  
  /**
   * Salva apenas os dados do formulário (antes do pagamento)
   * 🚨 CRÍTICO: Device ID é obrigatório para MercadoPago
   */
  static saveFormData(formData: FormData, deviceId?: string): boolean {
    // Tentar obter Device ID se não foi fornecido
    const finalDeviceId = deviceId || this.getMercadoPagoDeviceId();
    
    // Validar Device ID para MercadoPago
    if (!finalDeviceId) {
      console.error('[PaymentCache] 🚨 CRITICAL: Device ID is required for MercadoPago approval rate!');
      console.warn('[PaymentCache] Payment approval rate will be SEVERELY impacted without Device ID');
      // Continuar mesmo sem Device ID, mas com aviso crítico
    }
    
    return this.save({
      formData: {
        ...formData,
        deviceId: finalDeviceId || formData.deviceId // Garantir Device ID no formData
      },
      timestamp: Date.now(),
      deviceId: finalDeviceId
    });
  }
  
  /**
   * Adiciona informações do pagamento ao cache existente
   * @param paymentData Dados do pagamento do MercadoPago (validados com Zod)
   * @param uniqueUrl URL única do perfil
   * @param paymentId ID do pagamento
   * @param preferenceId ID da preferência de pagamento
   */
  static addPaymentInfo(
    paymentData: unknown, // Recebe unknown para forçar validação
    uniqueUrl?: string, 
    paymentId?: string, 
    preferenceId?: string
  ): boolean {
    try {
      // Validar dados do pagamento com Zod
      let validatedPaymentData: PaymentDataCache | undefined;
      
      if (paymentData !== null && paymentData !== undefined) {
        const parseResult = PaymentDataCacheSchema.safeParse(paymentData);
        
        if (!parseResult.success) {
          console.warn('[PaymentCache] Invalid payment data structure:', parseResult.error);
          // Mesmo com erro, tentamos salvar o que conseguimos
          // mas logamos o aviso para debugging
          validatedPaymentData = paymentData as PaymentDataCache;
        } else {
          validatedPaymentData = parseResult.data;
          
          // 🚨 CRÍTICO: Verificar e garantir Device ID
          if (!validatedPaymentData.deviceId) {
            // Tentar obter Device ID do ambiente
            const deviceId = this.getMercadoPagoDeviceId();
            if (deviceId) {
              validatedPaymentData.deviceId = deviceId;
              console.log('[PaymentCache] Device ID recovered from environment');
            } else {
              console.error('[PaymentCache] 🚨 CRITICAL: Device ID missing in payment data!');
              console.warn('[PaymentCache] MercadoPago approval rate will be impacted');
            }
          }
        }
      }
      
      // Atualizar cache com dados validados
      return this.update({
        paymentData: validatedPaymentData,
        uniqueUrl,
        paymentId,
        preferenceId
      });
    } catch (error) {
      console.error('[PaymentCache] Failed to add payment info:', error);
      return false;
    }
  }
  
  /**
   * Recupera apenas os dados do formulário
   */
  static getFormData(): FormData | null {
    const cached = this.get();
    return cached?.formData || null;
  }
  
  /**
   * Verifica se o cache não expirou
   */
  static isValid(): boolean {
    const cached = this.get();
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < this.EXPIRY_MS;
  }
  
  /**
   * Obtém idade do cache em minutos
   */
  static getAge(): number | null {
    const cached = this.get();
    if (!cached) return null;
    
    const ageMs = Date.now() - cached.timestamp;
    return Math.floor(ageMs / 60000); // Retorna em minutos
  }
}