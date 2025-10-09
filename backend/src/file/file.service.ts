import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PaginationResult } from '../common/dto/pagination.dto';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class FileService {
  constructor(private queueService: QueueService) {}

  async uploadChunk(
    filename: string,
    chunkIndex: number,
    totalChunks: number,
    file: Express.Multer.File,
  ) {
    const chunksDir = join(process.cwd(), 'uploads', 'chunks', filename);
    await fs.mkdir(chunksDir, { recursive: true });
    
    const chunkPath = join(chunksDir, `chunk-${chunkIndex}`);
    await fs.rename(file.path, chunkPath);
    
    // If this is the last chunk, queue merge job
    if (chunkIndex === totalChunks - 1) {
      await this.queueService.addMergeFileJob({
        filename,
        totalChunks,
        chunksDir,
      });
    }
    
    return { 
      message: 'Chunk uploaded successfully',
      chunkIndex,
      totalChunks,
    };
  }

  async mergeChunks(filename: string, totalChunks: number, chunksDir: string) {
    const finalPath = join(process.cwd(), 'uploads', filename);
    const writeStream = await fs.open(finalPath, 'w');
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = join(chunksDir, `chunk-${i}`);
      const chunkData = await fs.readFile(chunkPath);
      await writeStream.write(chunkData);
    }
    
    await writeStream.close();
    
    // Clean up chunk files
    await fs.rmdir(chunksDir, { recursive: true });
    
    return { message: 'File merged successfully', filepath: finalPath };
  }

  async listFiles(page: number = 1, limit: number = 10): Promise<PaginationResult<string>> {
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page), 10) || 1);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100 // Giới hạn tối đa
    );
    
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      const allFiles = await fs.readdir(uploadsDir);
      const files = allFiles.filter(file => !file.includes('chunks'));
      
      const total = files.length;
      const skip = (actualPage - 1) * actualLimit;
      const paginatedFiles = files.slice(skip, skip + actualLimit);
      
      return new PaginationResult(paginatedFiles, total, actualPage, actualLimit);
    } catch (error) {
      return new PaginationResult([], 0, actualPage, actualLimit);
    }
  }
}