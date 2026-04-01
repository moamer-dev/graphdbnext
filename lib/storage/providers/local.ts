import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from '../types';

export class LocalStorageProvider implements StorageProvider {
  name = 'LOCAL_FS';
  private baseDir: string;

  constructor(config: { rootDir?: string } = {}) {
    this.baseDir = config.rootDir || path.join(process.cwd(), '.data', 'storage');
  }

  private async ensureDir() {
    try {
      await fs.access(this.baseDir);
    } catch {
      await fs.mkdir(this.baseDir, { recursive: true });
    }
  }

  async save(filePath: string, content: Buffer | string) {
    await this.ensureDir();
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
    
    const stats = await fs.stat(fullPath);
    return {
      url: filePath, // relative path is used as URL in local mode
      size: stats.size
    };
  }

  async read(filePath: string) {
    const fullPath = path.join(this.baseDir, filePath);
    return await fs.readFile(fullPath);
  }

  async delete(filePath: string) {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (e) {
      console.warn(`File ${filePath} not found for deletion`, e);
    }
  }

  async getStream(filePath: string) {
    const { createReadStream } = await import('fs');
    const fullPath = path.join(this.baseDir, filePath);
    return createReadStream(fullPath);
  }
}
