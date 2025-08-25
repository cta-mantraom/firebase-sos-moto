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

export interface PaymentCacheData {
  formData: FormData;
  paymentData?: any;
  uniqueUrl?: string;
  paymentId?: string;
  preferenceId?: string;
  timestamp: number;
  deviceId?: string;
}

export class PaymentCache {
  private static readonly KEY = 'pendingPayment';
  private static readonly BACKUP_KEY = 'pendingPaymentBackup';
  private static readonly EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas
  
  /**
   * Salva dados do pagamento no sessionStorage com backup no localStorage
   */
  static save(data: PaymentCacheData): boolean {
    try {
      const dataWithTimestamp = {
        ...data,
        timestamp: data.timestamp || Date.now()
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
   */
  static update(updates: Partial<PaymentCacheData>): boolean {
    try {
      const current = this.get();
      if (!current) return false;
      
      const updated = {
        ...current,
        ...updates,
        timestamp: current.timestamp // Manter timestamp original
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
   */
  static saveFormData(formData: FormData, deviceId?: string): boolean {
    return this.save({
      formData,
      timestamp: Date.now(),
      deviceId
    });
  }
  
  /**
   * Adiciona informações do pagamento ao cache existente
   */
  static addPaymentInfo(paymentData: any, uniqueUrl?: string, paymentId?: string, preferenceId?: string): boolean {
    return this.update({
      paymentData,
      uniqueUrl,
      paymentId,
      preferenceId
    });
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