import { StorageProvider } from '../types';

/**
 * Placeholder for AWS S3 Storage Provider.
 * This will be implemented when S3 credentials are provided in the StorageConfig.
 */
export class S3StorageProvider implements StorageProvider {
  name = 'EXTERNAL_S3';

  constructor(config: { bucket: string; region: string; accessKeyId: string; secretAccessKey: string }) {
    console.warn('S3StorageProvider: Not fully implemented yet. Using placeholder.');
  }

  async save(path: string, content: Buffer | string): Promise<{ url: string; size: number }> {
    throw new Error('S3 Storage not yet configured.');
  }

  async read(path: string): Promise<Buffer> {
    throw new Error('S3 Storage not yet configured.');
  }

  async delete(path: string): Promise<void> {
    throw new Error('S3 Storage not yet configured.');
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream> {
    throw new Error('S3 Storage not yet configured.');
  }
}
