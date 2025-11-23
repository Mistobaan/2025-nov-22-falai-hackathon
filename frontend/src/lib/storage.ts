import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * S3-compatible storage abstraction layer
 * Current implementation: Local filesystem
 * Future: Swap to AWS SDK for S3/DigitalOcean Spaces
 */

export interface StorageConfig {
    type: 'local' | 's3';
    localPath?: string;
    s3Config?: {
        endpoint: string;
        region: string;
        bucket: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
}

export interface UploadResult {
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
}

class StorageService {
    private config: StorageConfig;

    constructor(config: StorageConfig) {
        this.config = config;
    }

    /**
     * Upload an image and return metadata
     */
    async uploadImage(file: File | Buffer, originalFilename: string, contentType: string): Promise<UploadResult> {
        const fileId = crypto.randomUUID();
        const ext = originalFilename.split('.').pop() || 'jpg';
        const filename = `${fileId}.${ext}`;

        if (this.config.type === 'local') {
            return this.uploadToLocal(file, filename, originalFilename, contentType);
        } else {
            // Future: Implement S3 upload
            throw new Error('S3 storage not yet implemented');
        }
    }

    /**
     * Get the public URL for an image
     */
    getImageUrl(fileId: string, extension: string = 'jpg'): string {
        if (this.config.type === 'local') {
            return `/uploads/${fileId}.${extension}`;
        } else {
            // Future: Return S3 URL
            throw new Error('S3 storage not yet implemented');
        }
    }

    /**
     * Delete an image
     */
    async deleteImage(fileId: string, extension: string = 'jpg'): Promise<void> {
        if (this.config.type === 'local') {
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            const filepath = path.join(uploadsDir, `${fileId}.${extension}`);

            try {
                await fs.unlink(filepath);
            } catch (error) {
                console.error(`Failed to delete image ${fileId}:`, error);
                // Don't throw - file might not exist
            }
        } else {
            // Future: Implement S3 delete
            throw new Error('S3 storage not yet implemented');
        }
    }

    /**
     * Upload to local filesystem
     */
    private async uploadToLocal(
        file: File | Buffer,
        filename: string,
        originalFilename: string,
        contentType: string
    ): Promise<UploadResult> {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

        // Create uploads directory if it doesn't exist
        try {
            await fs.mkdir(uploadsDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        const filepath = path.join(uploadsDir, filename);

        // Convert File to Buffer if needed
        let buffer: Buffer;
        if (Buffer.isBuffer(file)) {
            buffer = file;
        } else {
            // File type from browser
            const arrayBuffer = await (file as any).arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        // Write file to disk
        await fs.writeFile(filepath, buffer);

        const fileId = filename.split('.')[0];
        const ext = filename.split('.').pop() || 'jpg';

        return {
            id: fileId,
            url: `/uploads/${filename}`,
            filename: originalFilename,
            size: buffer.length,
            type: contentType
        };
    }

    /**
     * Validate file before upload
     */
    validateFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type. Allowed types: ${validTypes.join(', ')}`
            };
        }

        // Check file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: `File too large. Maximum size: ${maxSizeMB}MB`
            };
        }

        return { valid: true };
    }
}

// Singleton instance
let storageInstance: StorageService | null = null;

export function getStorageService(): StorageService {
    if (!storageInstance) {
        // Default to local storage
        storageInstance = new StorageService({
            type: 'local',
            localPath: path.join(process.cwd(), 'public', 'uploads')
        });
    }
    return storageInstance;
}

// For future S3 configuration
export function configureStorage(config: StorageConfig): void {
    storageInstance = new StorageService(config);
}
