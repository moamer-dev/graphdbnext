export interface StorageProvider {
  name: string;
  save(path: string, content: Buffer | string): Promise<{ url: string; size: number }>;
  read(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getStream?(path: string): Promise<ReadableStream | NodeJS.ReadableStream>;
}

export type StorageType = 'DATABASE' | 'EXTERNAL_S3' | 'LOCAL_FS';
