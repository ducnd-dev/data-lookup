import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

interface ChunkInfo {
  chunkIndex: number;
  chunkSize: number;
  checksum: string;
  uploadedAt: Date;
}

interface UploadSession {
  id: string;
  filename: string;
  totalChunks: number;
  totalSize: number;
  uploadedChunks: ChunkInfo[];
  status: 'pending' | 'uploading' | 'merging' | 'completed' | 'failed';
  userId: number;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class ImprovedFileService {
  constructor(
    private queueService: QueueService,
    private prisma: PrismaService,
  ) {}

  // 1. Khởi tạo upload session
  async initializeUpload(
    filename: string,
    totalChunks: number,
    totalSize: number,
    userId: number,
    checksum?: string, // Optional file checksum for integrity
  ) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
    
    const session: UploadSession = {
      id: sessionId,
      filename,
      totalChunks,
      totalSize,
      uploadedChunks: [],
      status: 'pending',
      userId,
      createdAt: new Date(),
      expiresAt,
    };

    // Store session in database
    await this.prisma.uploadSession.create({
      data: {
        id: sessionId,
        fileName: filename,
        totalChunks,
        totalSize,
        status: 'pending',
        userId: userId || 1,
        expiresAt,
        metadata: JSON.stringify({ checksum }),
      },
    });

    return { sessionId, expiresAt };
  }

  // 2. Upload chunk với validation
  async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    file: Express.Multer.File,
  ) {
    // Get session
    const session = await this.getUploadSession(sessionId);
    if (!session) {
      throw new Error('Upload session not found or expired');
    }

    if (session.status === 'completed') {
      throw new Error('Upload already completed');
    }

    // Validate chunk index
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new Error('Invalid chunk index');
    }

    // Check if chunk already uploaded
    const existingChunk = session.uploadedChunks.find(c => c.chunkIndex === chunkIndex);
    if (existingChunk) {
      return { message: 'Chunk already uploaded', chunkIndex, isComplete: false };
    }

    // Calculate chunk checksum
    const chunkChecksum = crypto
      .createHash('md5')
      .update(file.buffer)
      .digest('hex');

    // Store chunk
    const chunksDir = join(process.cwd(), 'uploads', 'chunks', sessionId);
    await fs.mkdir(chunksDir, { recursive: true });
    
    const chunkPath = join(chunksDir, `chunk-${chunkIndex}`);
    await fs.writeFile(chunkPath, file.buffer);

    // Update session
    const chunkInfo: ChunkInfo = {
      chunkIndex,
      chunkSize: file.size,
      checksum: chunkChecksum,
      uploadedAt: new Date(),
    };

    session.uploadedChunks.push(chunkInfo);
    session.status = 'uploading';

    await this.updateUploadSession(sessionId, session);

    // Check if all chunks uploaded
    const isComplete = session.uploadedChunks.length === session.totalChunks;
    
    if (isComplete) {
      // Validate all chunks are present
      const allChunksPresent = this.validateAllChunks(session);
      
      if (allChunksPresent) {
        session.status = 'merging';
        await this.updateUploadSession(sessionId, session);
        
        // Queue merge job
        await this.queueService.addMergeFileJob({
          sessionId,
          filename: session.filename,
          totalChunks: session.totalChunks,
          chunksDir,
        });
      }
    }

    return { 
      message: 'Chunk uploaded successfully',
      chunkIndex,
      isComplete,
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
    };
  }

  // 3. Merge với streaming (tiết kiệm memory)
  async mergeChunksStreaming(sessionId: string) {
    const session = await this.getUploadSession(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    const chunksDir = join(process.cwd(), 'uploads', 'chunks', sessionId);
    const finalPath = join(process.cwd(), 'uploads', session.filename);
    
    // Create write stream
    const writeStream = createWriteStream(finalPath);
    
    try {
      // Sort chunks by index
      const sortedChunks = session.uploadedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      // Stream each chunk to final file
      for (let i = 0; i < sortedChunks.length; i++) {
        const chunkPath = join(chunksDir, `chunk-${i}`);
        const readStream = createReadStream(chunkPath);
        
        // Use pipeline for efficient streaming
        await pipeline(readStream, writeStream, { end: false });
      }
      
      writeStream.end();
      
      // Verify final file size
      const finalStats = await fs.stat(finalPath);
      const expectedSize = session.uploadedChunks.reduce((sum, chunk) => sum + chunk.chunkSize, 0);
      
      if (finalStats.size !== expectedSize) {
        throw new Error(`File size mismatch. Expected: ${expectedSize}, Got: ${finalStats.size}`);
      }

      // Update session
      session.status = 'completed';
      await this.updateUploadSession(sessionId, session);
      
      // Cleanup chunks
      await fs.rmdir(chunksDir, { recursive: true });
      
      return { 
        message: 'File merged successfully', 
        filepath: finalPath,
        size: finalStats.size,
      };
      
    } catch (error) {
      session.status = 'failed';
      await this.updateUploadSession(sessionId, session);
      throw error;
    }
  }

  // 4. Resume upload - check missing chunks
  async getUploadStatus(sessionId: string) {
    const session = await this.getUploadSession(sessionId);
    if (!session) {
      throw new Error('Upload session not found or expired');
    }

    const uploadedChunkIndices = session.uploadedChunks.map(c => c.chunkIndex).sort((a, b) => a - b);
    const missingChunks: number[] = [];
    
    for (let i = 0; i < session.totalChunks; i++) {
      if (!uploadedChunkIndices.includes(i)) {
        missingChunks.push(i);
      }
    }

    return {
      sessionId,
      filename: session.filename,
      status: session.status,
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
      missingChunks,
      progress: (session.uploadedChunks.length / session.totalChunks) * 100,
      expiresAt: session.expiresAt,
    };
  }

  // 5. Cleanup expired sessions
  async cleanupExpiredSessions() {
    const expiredSessions = await this.prisma.uploadSession.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { notIn: ['completed'] },
      },
    });

    for (const session of expiredSessions) {
      const chunksDir = join(process.cwd(), 'uploads', 'chunks', session.id);
      try {
        await fs.rmdir(chunksDir, { recursive: true });
      } catch (error) {
        // Ignore if directory doesn't exist
      }
      
      await this.prisma.uploadSession.delete({
        where: { id: session.id },
      });
    }

    return { cleanedSessions: expiredSessions.length };
  }

  // Helper methods
  private async getUploadSession(sessionId: string): Promise<UploadSession | null> {
    const dbSession = await this.prisma.uploadSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession) return null;

    // Check expiry
    if (dbSession.expiresAt < new Date()) {
      await this.cleanupExpiredSessions();
      return null;
    }

    const uploadedChunks = await this.prisma.chunkInfo.findMany({
      where: { sessionId },
      orderBy: { chunkIndex: 'asc' },
    });

    return {
      id: dbSession.id,
      filename: dbSession.fileName,
      totalChunks: dbSession.totalChunks,
      totalSize: dbSession.totalSize,
      uploadedChunks: uploadedChunks.map(c => ({
        chunkIndex: c.chunkIndex,
        chunkSize: c.chunkSize,
        checksum: c.checksum,
        uploadedAt: c.uploadedAt,
      })),
      status: dbSession.status as any,
      userId: dbSession.userId,
      createdAt: dbSession.createdAt,
      expiresAt: dbSession.expiresAt,
    };
  }

  private async updateUploadSession(sessionId: string, session: UploadSession) {
    await this.prisma.uploadSession.update({
      where: { id: sessionId },
      data: {
        status: session.status,
      },
    });

    // Update chunks
    for (const chunk of session.uploadedChunks) {
      await this.prisma.chunkInfo.upsert({
        where: {
          sessionId_chunkIndex: {
            sessionId,
            chunkIndex: chunk.chunkIndex,
          },
        },
        update: {},
        create: {
          sessionId,
          chunkIndex: chunk.chunkIndex,
          chunkSize: chunk.chunkSize,
          checksum: chunk.checksum,
        },
      });
    }
  }

  private validateAllChunks(session: UploadSession): boolean {
    if (session.uploadedChunks.length !== session.totalChunks) {
      return false;
    }

    // Check all chunk indices from 0 to totalChunks-1 are present
    const indices = session.uploadedChunks.map(c => c.chunkIndex).sort((a, b) => a - b);
    
    for (let i = 0; i < session.totalChunks; i++) {
      if (indices[i] !== i) {
        return false;
      }
    }

    return true;
  }
}