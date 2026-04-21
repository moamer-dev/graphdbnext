import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { prisma } from '@/lib/prisma'
import { StorageType } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

export class UniversalStorageService {
  /**
   * Uploads content to the specified storage provider
   * @returns The file URL or path
   */
  static async upload(configId: string, fileName: string, content: string | Buffer): Promise<string> {
    const storageConfig = await prisma.storageConfig.findUnique({
      where: { id: configId }
    })

    if (!storageConfig || !storageConfig.isActive) {
      throw new Error('Storage provider not found or inactive')
    }

    const config = storageConfig.config as any

    switch (storageConfig.type) {
      case StorageType.EXTERNAL_S3:
        return this.uploadToS3(config, fileName, content)
      
      case StorageType.LOCAL_FS:
        return this.uploadToLocal(config, fileName, content)
      
      case StorageType.DATABASE:
      default:
        // For DATABASE type, we don't actually "upload" to a separate file system
        // This should be handled by the caller by saving to content/jsonContent fields
        return 'database'
    }
  }

  private static async uploadToS3(config: any, fileName: string, content: string | Buffer): Promise<string> {
    const client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })

    const key = `uploads/${Date.now()}-${fileName}`
    
    const upload = new Upload({
      client,
      params: {
        Bucket: config.bucket,
        Key: key,
        Body: content,
        ContentType: fileName.endsWith('.json') ? 'application/json' : 'application/xml'
      }
    })

    await upload.done()

    // Return S3 URL (Note: This assumes the bucket is public or has a specific URL pattern)
    // You might want to return the key and generate signed URLs for READ operations
    return `s3://${config.bucket}/${key}`
  }

  private static async uploadToLocal(config: any, fileName: string, content: string | Buffer): Promise<string> {
    const baseDir = config.path || './storage/uploads'
    const fullPath = path.join(process.cwd(), baseDir)
    
    // Ensure directory exists
    await fs.mkdir(fullPath, { recursive: true })
    
    const relativePath = `${Date.now()}-${fileName}`
    const filePath = path.join(fullPath, relativePath)
    
    await fs.writeFile(filePath, content)
    
    return `file://${path.join(baseDir, relativePath)}`
  }
}
