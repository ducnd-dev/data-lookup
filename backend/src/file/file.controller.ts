import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsNumber, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { FileService } from './file.service';

class UploadChunkDto {
  @IsString()
  filename: string;

  @IsNumber()
  chunkIndex: number;

  @IsNumber()
  totalChunks: number;
}

@Controller('files')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('upload-chunk')
  @RequirePermissions('UPLOAD_FILES')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadChunkDto: UploadChunkDto,
  ) {
    return this.fileService.uploadChunk(
      uploadChunkDto.filename,
      +uploadChunkDto.chunkIndex,
      +uploadChunkDto.totalChunks,
      file,
    );
  }

  @Get()
  async listFiles(@Query() paginationDto: PaginationDto) {
    return this.fileService.listFiles(paginationDto.page, paginationDto.limit);
  }
}