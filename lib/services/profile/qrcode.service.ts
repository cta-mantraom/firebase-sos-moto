import * as QRCode from 'qrcode';
import { logInfo, logError, logWarning } from '../../utils/logger.js';
import { storage } from '../firebase-admin.js';
import { getFirebaseConfig } from '../../config/index.js';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface QRCodeResult {
  dataUrl: string;
  buffer: Buffer;
  storageUrl?: string;
}

export interface QRCodeServiceConfig {
  defaultWidth: number;
  defaultMargin: number;
  storageBucket: string;
  maxSizeKB: number;
}

export class QRCodeService {
  private readonly config: QRCodeServiceConfig;

  constructor(config?: Partial<QRCodeServiceConfig>) {
    this.config = {
      defaultWidth: config?.defaultWidth ?? 400,
      defaultMargin: config?.defaultMargin ?? 2,
      storageBucket: config?.storageBucket ?? getFirebaseConfig().storageBucket!,
      maxSizeKB: config?.maxSizeKB ?? 500,
    };
  }

  /**
   * Gera um QR Code para uma URL do memorial
   */
  async generateQRCode(
    memorialUrl: string,
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    try {
      const qrOptions = {
        width: options?.width ?? this.config.defaultWidth,
        margin: options?.margin ?? this.config.defaultMargin,
        color: {
          dark: options?.color?.dark ?? '#000000',
          light: options?.color?.light ?? '#FFFFFF',
        },
        errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M',
      };

      // Gerar QR Code como Data URL
      const dataUrl = await QRCode.toDataURL(memorialUrl, qrOptions);

      // Gerar QR Code como Buffer
      const buffer = await QRCode.toBuffer(memorialUrl, {
        ...qrOptions,
        type: 'png',
      });

      // Otimizar imagem se necessário
      const optimizedBuffer = await this.optimizeImage(buffer);

      logInfo('QR Code generated', {
        url: memorialUrl,
        size: optimizedBuffer.length,
        width: qrOptions.width,
      });

      return {
        dataUrl,
        buffer: optimizedBuffer,
      };
    } catch (error) {
      logError('Failed to generate QR Code', error as Error, {
        memorialUrl,
      });
      throw error;
    }
  }

  /**
   * Faz upload do QR Code para o Firebase Storage
   */
  async uploadToStorage(
    imageBuffer: Buffer,
    profileId: string
  ): Promise<string> {
    try {
      const fileName = `qrcodes/${profileId}_${Date.now()}.png`;
      const bucket = storage.bucket(this.config.storageBucket);
      const file = bucket.file(fileName);

      // Fazer upload do buffer
      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000',
          metadata: {
            profileId,
            createdAt: new Date().toISOString(),
          },
        },
        public: true,
        validation: 'md5',
      });

      // Obter URL pública
      const publicUrl = `https://storage.googleapis.com/${this.config.storageBucket}/${fileName}`;

      logInfo('QR Code uploaded to storage', {
        profileId,
        fileName,
        size: imageBuffer.length,
        url: publicUrl,
      });

      return publicUrl;
    } catch (error) {
      logError('Failed to upload QR Code to storage', error as Error, {
        profileId,
      });
      throw error;
    }
  }

  /**
   * Gera apenas a Data URL do QR Code (sem buffer)
   */
  async generateDataURL(
    memorialUrl: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      const qrOptions = {
        width: options?.width ?? this.config.defaultWidth,
        margin: options?.margin ?? this.config.defaultMargin,
        color: {
          dark: options?.color?.dark ?? '#000000',
          light: options?.color?.light ?? '#FFFFFF',
        },
        errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M',
      };

      const dataUrl = await QRCode.toDataURL(memorialUrl, qrOptions);

      logInfo('QR Code Data URL generated', {
        url: memorialUrl,
        width: qrOptions.width,
      });

      return dataUrl;
    } catch (error) {
      logError('Failed to generate QR Code Data URL', error as Error, {
        memorialUrl,
      });
      throw error;
    }
  }

  /**
   * Otimiza o tamanho da imagem
   */
  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      const sizeKB = buffer.length / 1024;

      if (sizeKB <= this.config.maxSizeKB) {
        return buffer;
      }

      logWarning('QR Code image size exceeds limit, optimization needed', {
        currentSizeKB: sizeKB,
        maxSizeKB: this.config.maxSizeKB,
      });

      // Aqui poderia usar uma biblioteca como 'sharp' ou 'jimp' para otimizar
      // Por enquanto, apenas retornamos o buffer original
      // TODO: Implementar otimização real quando necessário
      
      return buffer;
    } catch (error) {
      logError('Failed to optimize image', error as Error);
      // Em caso de erro na otimização, retornar buffer original
      return buffer;
    }
  }

  /**
   * Gera QR Code e faz upload em uma única operação
   */
  async generateAndUpload(
    memorialUrl: string,
    profileId: string,
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    try {
      // Gerar QR Code
      const qrCode = await this.generateQRCode(memorialUrl, options);

      // Fazer upload
      const storageUrl = await this.uploadToStorage(qrCode.buffer, profileId);

      return {
        ...qrCode,
        storageUrl,
      };
    } catch (error) {
      logError('Failed to generate and upload QR Code', error as Error, {
        memorialUrl,
        profileId,
      });
      throw error;
    }
  }

  /**
   * Deleta um QR Code do storage
   */
  async deleteFromStorage(profileId: string): Promise<void> {
    try {
      const bucket = storage.bucket(this.config.storageBucket);
      const [files] = await bucket.getFiles({
        prefix: `qrcodes/${profileId}_`,
      });

      if (files.length === 0) {
        logWarning('No QR Code files found for profile', { profileId });
        return;
      }

      // Deletar todos os arquivos encontrados
      await Promise.all(files.map(file => file.delete()));

      logInfo('QR Code files deleted from storage', {
        profileId,
        filesDeleted: files.length,
      });
    } catch (error) {
      logError('Failed to delete QR Code from storage', error as Error, {
        profileId,
      });
      throw error;
    }
  }

  /**
   * Valida se uma URL de QR Code ainda existe no storage
   */
  async validateStorageUrl(storageUrl: string): Promise<boolean> {
    try {
      // Extrair nome do arquivo da URL
      const urlParts = storageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (!fileName.startsWith('qrcodes/')) {
        logWarning('Invalid QR Code storage URL format', { storageUrl });
        return false;
      }

      const bucket = storage.bucket(this.config.storageBucket);
      const file = bucket.file(fileName);
      const [exists] = await file.exists();

      if (!exists) {
        logWarning('QR Code file not found in storage', { fileName });
      }

      return exists;
    } catch (error) {
      logError('Failed to validate storage URL', error as Error, {
        storageUrl,
      });
      return false;
    }
  }

  /**
   * Gera um QR Code temporário (apenas Data URL, sem upload)
   */
  async generateTemporaryQRCode(
    data: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      const dataUrl = await this.generateDataURL(data, options);
      
      logInfo('Temporary QR Code generated', {
        dataLength: data.length,
      });

      return dataUrl;
    } catch (error) {
      logError('Failed to generate temporary QR Code', error as Error);
      throw error;
    }
  }

  /**
   * Cria um QR Code com logo customizado
   */
  async generateWithLogo(
    memorialUrl: string,
    logoUrl: string,
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    try {
      // Por enquanto, gera QR Code normal
      // TODO: Implementar adição de logo quando necessário
      logWarning('Logo support not yet implemented, generating standard QR Code', {
        memorialUrl,
        logoUrl,
      });

      return await this.generateQRCode(memorialUrl, options);
    } catch (error) {
      logError('Failed to generate QR Code with logo', error as Error, {
        memorialUrl,
        logoUrl,
      });
      throw error;
    }
  }
}