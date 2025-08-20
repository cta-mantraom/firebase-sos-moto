import { z } from 'zod';
import { db } from '../firebase-admin.js';
import { logInfo, logError, logWarning } from '../../utils/logger.js';
import {
  DocumentData,
  DocumentReference,
  CollectionReference,
  Query,
  Timestamp,
  WriteBatch,
  Transaction,
  FieldValue,
} from 'firebase-admin/firestore';

// Schemas de validação
const BatchOperationSchema = z.object({
  type: z.enum(['create', 'update', 'delete', 'set']),
  collection: z.string(),
  id: z.string(),
  data: z.record(z.unknown()).optional(),
  merge: z.boolean().optional(),
});

const QueryOptionsSchema = z.object({
  where: z.array(z.tuple([
    z.string(), // field
    z.enum(['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in', 'array-contains', 'array-contains-any']), // operator
    z.unknown(), // value
  ])).optional(),
  orderBy: z.array(z.tuple([
    z.string(), // field
    z.enum(['asc', 'desc']).optional(), // direction
  ])).optional(),
  limit: z.number().positive().optional(),
  offset: z.number().nonnegative().optional(),
});

// Tipos derivados
export type BatchOperation = z.infer<typeof BatchOperationSchema>;
export type QueryOptions = z.infer<typeof QueryOptionsSchema>;

export interface FirebaseServiceConfig {
  maxBatchSize: number;
  defaultTimeout: number;
  enableCache: boolean;
  retryAttempts: number;
}

export interface FirebaseError extends Error {
  code?: string;
  details?: unknown;
}

export class FirebaseService {
  private readonly config: FirebaseServiceConfig;
  private readonly cache: Map<string, { data: unknown; timestamp: number }>;

  constructor(config?: Partial<FirebaseServiceConfig>) {
    this.config = {
      maxBatchSize: config?.maxBatchSize ?? 500,
      defaultTimeout: config?.defaultTimeout ?? 30000,
      enableCache: config?.enableCache ?? true,
      retryAttempts: config?.retryAttempts ?? 3,
    };
    this.cache = new Map();
  }

  /**
   * Salva um documento no Firestore
   */
  async save<T extends DocumentData>(
    collection: string,
    id: string,
    data: T
  ): Promise<void> {
    try {
      const docRef = db.collection(collection).doc(id);
      
      // Adicionar timestamps
      const dataWithTimestamps = {
        ...data,
        createdAt: data.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(dataWithTimestamps);

      // Invalidar cache
      this.invalidateCache(`${collection}/${id}`);

      logInfo('Document saved', {
        collection,
        id,
        fields: Object.keys(data),
      });
    } catch (error) {
      this.handleFirebaseError(error as FirebaseError, 'save', { collection, id });
    }
  }

  /**
   * Busca um documento do Firestore
   */
  async get<T>(
    collection: string,
    id: string
  ): Promise<T | null> {
    try {
      // Verificar cache
      const cacheKey = `${collection}/${id}`;
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }

      const docRef = db.collection(collection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as T;
      
      // Adicionar ao cache
      this.addToCache(cacheKey, data);

      logInfo('Document retrieved', {
        collection,
        id,
        found: true,
      });

      return data;
    } catch (error) {
      this.handleFirebaseError(error as FirebaseError, 'get', { collection, id });
      return null;
    }
  }

  /**
   * Atualiza um documento no Firestore
   */
  async update<T extends DocumentData>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = db.collection(collection).doc(id);
      
      // Adicionar timestamp de atualização
      const dataWithTimestamp = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.update(dataWithTimestamp);

      // Invalidar cache
      this.invalidateCache(`${collection}/${id}`);

      logInfo('Document updated', {
        collection,
        id,
        fields: Object.keys(data),
      });
    } catch (error) {
      this.handleFirebaseError(error as FirebaseError, 'update', { collection, id });
    }
  }

  /**
   * Deleta um documento do Firestore
   */
  async delete(
    collection: string,
    id: string
  ): Promise<void> {
    try {
      const docRef = db.collection(collection).doc(id);
      await docRef.delete();

      // Invalidar cache
      this.invalidateCache(`${collection}/${id}`);

      logInfo('Document deleted', {
        collection,
        id,
      });
    } catch (error) {
      this.handleFirebaseError(error as FirebaseError, 'delete', { collection, id });
    }
  }

  /**
   * Executa operações em batch
   */
  async batchWrite(operations: BatchOperation[]): Promise<void> {
    try {
      // Validar operações
      const validatedOps = operations.map(op => BatchOperationSchema.parse(op));

      // Dividir em batches se necessário (máximo 500 operações por batch)
      const chunks = this.chunkArray(validatedOps, this.config.maxBatchSize);

      for (const chunk of chunks) {
        const batch = db.batch();

        for (const op of chunk) {
          const docRef = db.collection(op.collection).doc(op.id);

          switch (op.type) {
            case 'create':
            case 'set':
              batch.set(docRef, {
                ...op.data,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              }, { merge: op.merge ?? false });
              break;
            case 'update':
              batch.update(docRef, {
                ...op.data,
                updatedAt: FieldValue.serverTimestamp(),
              });
              break;
            case 'delete':
              batch.delete(docRef);
              break;
          }

          // Invalidar cache para cada operação
          this.invalidateCache(`${op.collection}/${op.id}`);
        }

        await batch.commit();
      }

      logInfo('Batch write completed', {
        totalOperations: operations.length,
        batches: chunks.length,
      });
    } catch (error) {
      this.handleFirebaseError(error as FirebaseError, 'batchWrite', {
        operationCount: operations.length,
      });
    }
  }

  /**
   * Executa uma query no Firestore
   */
  async query<T>(
    collection: string,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      let query: Query = db.collection(collection);

      // Aplicar filtros where
      if (options?.where) {
        for (const [field, operator, value] of options.where) {
          query = query.where(field, operator, value);
        }
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        for (const [field, direction] of options.orderBy) {
          query = query.orderBy(field, direction || 'asc');
        }
      }

      // Aplicar limite
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Aplicar offset
      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const snapshot = await query.get();
      const results: T[] = [];

      snapshot.forEach(doc => {
        results.push(doc.data() as T);
      });

      logInfo('Query executed', {
        collection,
        resultCount: results.length,
        hasFilters: !!options?.where,
        hasOrdering: !!options?.orderBy,
      });

      return results;
    } catch (error) {
      this.handleFirebaseError(error as FirebaseError, 'query', { collection });
      return [];
    }
  }

  /**
   * Executa uma transação
   */
  async runTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>
  ): Promise<T | null> {
    try {
      const result = await db.runTransaction(callback);
      
      logInfo('Transaction completed successfully');
      
      return result;
    } catch (error) {
      this.handleFirebaseError(error as FirebaseError, 'transaction');
      return null;
    }
  }

  /**
   * Verifica se um documento existe
   */
  async exists(
    collection: string,
    id: string
  ): Promise<boolean> {
    try {
      const docRef = db.collection(collection).doc(id);
      const doc = await docRef.get();
      return doc.exists;
    } catch (error) {
      logError('Failed to check document existence', error as Error, {
        collection,
        id,
      });
      return false;
    }
  }

  /**
   * Conta documentos em uma coleção com filtros opcionais
   */
  async count(
    collection: string,
    options?: QueryOptions
  ): Promise<number> {
    try {
      const results = await this.query(collection, options);
      return results.length;
    } catch (error) {
      logError('Failed to count documents', error as Error, {
        collection,
      });
      return 0;
    }
  }

  /**
   * Trata erros do Firebase
   */
  private handleFirebaseError(
    error: FirebaseError,
    operation: string,
    context?: Record<string, unknown>
  ): never {
    const errorMessage = `Firebase ${operation} failed: ${error.message}`;
    
    logError(errorMessage, error, {
      operation,
      code: error.code,
      ...context,
    });

    // Mapear códigos de erro comuns
    switch (error.code) {
      case 'permission-denied':
        throw new Error(`Permission denied for ${operation}`);
      case 'not-found':
        throw new Error(`Document not found during ${operation}`);
      case 'already-exists':
        throw new Error(`Document already exists for ${operation}`);
      case 'resource-exhausted':
        throw new Error(`Quota exceeded for ${operation}`);
      default:
        throw error;
    }
  }

  /**
   * Adiciona item ao cache
   */
  private addToCache(key: string, data: unknown): void {
    if (!this.config.enableCache) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Busca item do cache
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.config.enableCache) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    // Verificar expiração (5 minutos)
    const maxAge = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Invalida cache
   */
  private invalidateCache(pattern: string): void {
    if (!this.config.enableCache) return;

    // Remover entrada específica ou todas que correspondem ao padrão
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Divide array em chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Limpa cache completo
   */
  clearCache(): void {
    this.cache.clear();
    logInfo('Cache cleared');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: JSON.stringify(Array.from(this.cache.entries())).length,
      entries: this.cache.size,
    };
  }
}