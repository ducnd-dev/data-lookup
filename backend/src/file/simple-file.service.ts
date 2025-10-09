import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class SimpleFileService {
  constructor(
    private queueService: QueueService,
    private prisma: PrismaService,
  ) {}

  async initializeUpload(
    filename: string,
    totalChunks: number,
    totalSize: number,
    userId?: number,
  ) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await this.prisma.uploadSession.create({
      data: {
        id: sessionId,
        fileName: filename,
        totalChunks,
        totalSize,
        status: 'pending',
        userId,
        expiresAt,
      },
    });

    return { sessionId, expiresAt };
  }

  async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    file: Express.Multer.File,
  ) {
    const session = await this.prisma.uploadSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Upload session not found');
    }

    const chunksDir = join(process.cwd(), 'uploads', 'chunks', sessionId);
    await fs.mkdir(chunksDir, { recursive: true });
    
    const chunkPath = join(chunksDir, `chunk-${chunkIndex}`);
    await fs.writeFile(chunkPath, file.buffer);

    await this.prisma.chunkInfo.create({
      data: {
        sessionId,
        chunkIndex,
        chunkSize: file.size,
      },
    });

    const uploadedCount = await this.prisma.chunkInfo.count({
      where: { sessionId },
    });

    if (uploadedCount === session.totalChunks) {
      await this.prisma.uploadSession.update({
        where: { id: sessionId },
        data: { status: 'completed' },
      });

      await this.queueService.addMergeFileJob({
        sessionId,
        filename: session.fileName,
        totalChunks: session.totalChunks,
        chunksDir,
      });
    }

    return { 
      message: 'Chunk uploaded successfully',
      chunkIndex,
      isComplete: uploadedCount === session.totalChunks,
    };
  }
}