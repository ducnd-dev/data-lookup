import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Request,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as XLSX from 'xlsx';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LookupService } from '../lookup/lookup.service';

@Controller('data-import')
@UseGuards(JwtAuthGuard)
export class DataImportController {
  constructor(private lookupService: LookupService) {
    console.log('🏗️ DataImportController initialized');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDataFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    console.log('🚀 === UPLOAD REQUEST START ===');
    
    try {
      // Validate file
      if (!file) {
        console.log('❌ No file uploaded');
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Validate user
      if (!req.user || !req.user.id) {
        console.log('❌ User not authenticated');
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      console.log('📋 File info:', {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        hasBuffer: !!file.buffer,
        bufferSize: file.buffer?.length || 0,
        hasPath: !!file.path,
        path: file.path
      });

      let fileBuffer: Buffer;
      
      // Get file content - try buffer first, then path
      if (file.buffer && file.buffer.length > 0) {
        console.log('📄 Using file buffer');
        fileBuffer = file.buffer;
      } else if (file.path) {
        console.log('📄 Reading from file path:', file.path);
        const fs = require('fs');
        fileBuffer = fs.readFileSync(file.path);
      } else {
        console.log('❌ No file content available');
        throw new HttpException('No file content available', HttpStatus.BAD_REQUEST);
      }

      let data: any[] = [];

      // Parse CSV file
      if (file.mimetype.includes('csv') || file.originalname.endsWith('.csv')) {
        console.log('📄 Parsing CSV...');
        try {
          // For CSV, detect and fix encoding issues
          let textContent = fileBuffer.toString('utf8');
          console.log('   Original text preview:', textContent.substring(0, 200));
          
          // If detected encoding issues, try different approaches
          if (textContent.includes('Ã') || textContent.includes('\\x') || textContent.includes('â€')) {
            console.log('   Detected encoding issues, trying to fix...');
            
            // Try latin1 first
            const latin1Text = fileBuffer.toString('latin1');
            console.log('   Latin1 preview:', latin1Text.substring(0, 200));
            
            // Use latin1 if it looks better
            if (!latin1Text.includes('Ã') && latin1Text.length > 0) {
              textContent = latin1Text;
            }
          }
          
          // Parse with XLSX
          const workbook = XLSX.read(fileBuffer, { 
            type: 'buffer',
            raw: false,
            cellDates: true 
          });
          
          if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('No valid sheets found in CSV file');
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          if (!worksheet) {
            throw new Error('Could not access worksheet');
          }
          
          data = XLSX.utils.sheet_to_json(worksheet);
          console.log('   Parsed rows:', data.length);
          
          // Fix encoding issues in CSV data
          if (data.length > 0) {
            console.log('   Sample CSV row before fix:', JSON.stringify(data[0], null, 2));
            
            data = data.map(row => {
              const fixedRow = {};
              Object.keys(row).forEach(key => {
                let value = row[key];
                if (typeof value === 'string') {
                  // Fix common Vietnamese encoding issues
                  value = value
                    .replace(/Ã¡/g, 'á')
                    .replace(/Ã©/g, 'é') 
                    .replace(/Ã­/g, 'í')
                    .replace(/Ã³/g, 'ó')
                    .replace(/Ãº/g, 'ú')
                    .replace(/Ã /g, 'à')
                    .replace(/Ã¨/g, 'è')
                    .replace(/Ã¬/g, 'ì')
                    .replace(/Ã²/g, 'ò')
                    .replace(/Ã¹/g, 'ù')
                    .replace(/Ã¢/g, 'â')
                    .replace(/Ãª/g, 'ê')
                    .replace(/Ã´/g, 'ô')
                    .replace(/Ã£/g, 'ã');
                }
                fixedRow[key] = value;
              });
              return fixedRow;
            });
            
            console.log('   Sample CSV row after fix:', JSON.stringify(data[0], null, 2));
          }

        } catch (csvError) {
          console.log('❌ CSV parsing failed:', csvError.message);
          throw new HttpException(`CSV parsing failed: ${csvError.message}`, HttpStatus.BAD_REQUEST);
        }
      } 
      // Parse Excel file
      else if (
        file.mimetype.includes('spreadsheet') ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')
      ) {
        console.log('📊 Parsing Excel...');
        try {
          const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
          
          if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('No valid sheets found in Excel file');
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          if (!worksheet) {
            throw new Error('Could not access worksheet');
          }
          
          data = XLSX.utils.sheet_to_json(worksheet);
          console.log('   Parsed rows:', data.length);
          
        } catch (excelError) {
          console.log('❌ Excel parsing failed:', excelError.message);
          throw new HttpException(`Excel parsing failed: ${excelError.message}`, HttpStatus.BAD_REQUEST);
        }
      } else {
        console.log('❌ Unsupported file type:', file.mimetype);
        throw new HttpException('Unsupported file type. Please upload CSV or Excel file.', HttpStatus.BAD_REQUEST);
      }

      if (data.length === 0) {
        console.log('❌ No data rows found');
        throw new HttpException('No data found in file', HttpStatus.BAD_REQUEST);
      }

      console.log('📊 Sample data:', data[0]);

      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const originalName = file.originalname;
      const fileExtension = originalName.substring(
        originalName.lastIndexOf('.'),
      );
      const fileNameWithoutExt = originalName.substring(
        0,
        originalName.lastIndexOf('.'),
      );
      const uniqueFileName = `${fileNameWithoutExt}_${timestamp}${fileExtension}`;

      // Save uploaded file to uploads directory for later download
      const uploadsDir = join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const savedFilePath = join(uploadsDir, uniqueFileName);
      
      // Write file content to uploads directory
      await fs.writeFile(savedFilePath, fileBuffer);
      console.log('💾 Saved file to:', savedFilePath);

      // Queue import job
      console.log('🚀 Queuing import job...');
      const result = await this.lookupService.batchInsertLookupData(
        data,
        req.user.id,
        uniqueFileName, // Use unique filename for storage
        file.originalname, // Keep original filename for download
      );

      console.log('✅ Success! Job ID:', result.jobId);

      return {
        success: true,
        message: 'File uploaded and import job queued successfully',
        rowsCount: data.length,
        jobId: result.jobId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.log('💥 Upload error:', error.message);
      console.log('🚀 === UPLOAD REQUEST END (ERROR) ===');
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to process file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('process-uploaded-file')
  async processUploadedFile(
    @Body() body: { filename: string },
    @Request() req: any,
  ) {
    console.log('🚀 === PROCESS UPLOADED FILE START ===');
    
    try {
      // Validate user
      if (!req.user || !req.user.id) {
        console.log('❌ User not authenticated');
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const { filename } = body;
      if (!filename) {
        console.log('❌ No filename provided');
        throw new HttpException('Filename is required', HttpStatus.BAD_REQUEST);
      }

      console.log('📋 Processing file:', filename);

      // Check if file exists in uploads directory
      const filePath = join(process.cwd(), 'uploads', filename);
      const fs = require('fs');
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ File not found:', filePath);
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      // Read and parse the uploaded file
      const fileBuffer = fs.readFileSync(filePath);
      
      let data: any[] = [];

      // Parse file based on extension
      if (filename.endsWith('.csv')) {
        console.log('📄 Parsing CSV...');
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        console.log('📊 Parsing Excel...');
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST);
      }

      if (data.length === 0) {
        console.log('❌ No data found in file');
        throw new HttpException('No data found in file', HttpStatus.BAD_REQUEST);
      }

      console.log('📊 Sample data:', data[0]);
      console.log('📊 Total rows:', data.length);

      // Queue import job
      console.log('🚀 Queuing import job...');
      const result = await this.lookupService.batchInsertLookupData(data, req.user.id);

      console.log('✅ Success! Job ID:', result.jobId);

      // Clean up the uploaded file
      try {
        fs.unlinkSync(filePath);
        console.log('🗑️ Cleaned up uploaded file');
      } catch (cleanupError) {
        console.log('⚠️ Could not clean up file:', cleanupError.message);
      }

      return {
        success: true,
        message: 'File processed and import job queued successfully',
        rowsCount: data.length,
        jobId: result.jobId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.log('💥 Process file error:', error.message);
      console.log('🚀 === PROCESS UPLOADED FILE END (ERROR) ===');
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to process file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('download/:fileName')
  async downloadReport(@Param('fileName') fileName: string, @Res() res: Response) {
    try {
      const filePath = join(process.cwd(), 'uploads', 'reports', fileName);
      res.download(filePath);
    } catch (error) {
      res.status(404).json({ message: 'File not found' });
    }
  }

  @Get('download-original/:jobId')
  async downloadOriginalFile(@Param('jobId') jobId: string, @Res() res: Response) {
    try {
      // Get job info to find original file name
      const jobStatus = await this.lookupService.getJobStatus(jobId);
      
      if (!jobStatus || !jobStatus.fileName) {
        return res.status(404).json({ message: 'Original file not found or not available' });
      }

      // Check if original file still exists in uploads directory
      const originalFilePath = join(process.cwd(), 'uploads', jobStatus.fileName);
      
      try {
        await fs.access(originalFilePath);
      } catch {
        return res.status(404).json({ message: 'Original file no longer available' });
      }

      // Use originalFileName for download if available, otherwise use fileName
      const downloadName = jobStatus.originalFileName || jobStatus.fileName;

      console.log('Download info:', {
        originalFilePath,
        downloadName,
        originalFileName: jobStatus.originalFileName,
        fileName: jobStatus.fileName
      });

      // Set explicit headers for better compatibility
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Download the original file with original name
      res.download(originalFilePath, downloadName);
    } catch (error) {
      res.status(500).json({ message: 'Error downloading file', error: (error as Error).message });
    }
  }
}