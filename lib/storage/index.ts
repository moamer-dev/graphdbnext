import { prisma } from '../prisma';
import { StorageProvider, StorageType } from './types';
import { LocalStorageProvider } from './providers/local';

export class StorageManager {
  private static instance: StorageManager;
  private providers: Map<StorageType, StorageProvider> = new Map();

  private constructor() {
    this.providers.set('LOCAL_FS', new LocalStorageProvider());
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Returns the currently active storage provider from the database,
   * falling back to local filesystem if none or if DB unavailable.
   */
  async getActiveProvider(): Promise<StorageProvider> {
    try {
      if (!prisma) return this.providers.get('LOCAL_FS')!;

      const activeConfig = await prisma.storageConfig.findFirst({
        where: { isActive: true, isDefault: true }
      });

      if (!activeConfig) {
        return this.providers.get('LOCAL_FS')!;
      }

      // Check cache/registry
      const cached = this.providers.get(activeConfig.type as StorageType);
      if (cached) return cached;

      // Instantiate S3 if needed (placeholder for now)
      if (activeConfig.type === 'EXTERNAL_S3') {
        const { S3StorageProvider } = await import('./providers/s3');
        const provider = new S3StorageProvider(activeConfig.config as any);
        this.providers.set('EXTERNAL_S3', provider);
        return provider;
      }

      return this.providers.get('LOCAL_FS')!;
    } catch (error) {
      console.warn('StorageManager: Failed to fetch active config, falling back to local', error);
      return this.providers.get('LOCAL_FS')!;
    }
  }

  /**
   * Helper to determine where to store based on size
   */
  shouldUseExternal(size: number): boolean {
    return size > 2 * 1024 * 1024; // > 2MB
  }
}

export const storageManager = StorageManager.getInstance();
