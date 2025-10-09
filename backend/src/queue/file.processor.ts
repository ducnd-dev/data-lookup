import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bull';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { LOOKUP_COLUMN_MAP } from '../common/constants/lookup.constants';
import { PrismaService } from '../prisma/prisma.service';

@Processor('file')
@Injectable()
export class FileProcessor {
  constructor(private prisma: PrismaService) {}

  @Process('merge-file')
  async handleMergeFile(job: Job) {
    const { filename, totalChunks, chunksDir } = job.data;
    
    try {
      job.progress(10);
      
      const finalPath = join(process.cwd(), 'uploads', filename);
      const writeStream = await fs.open(finalPath, 'w');
      
      job.progress(30);
      
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(chunksDir, `chunk-${i}`);
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData);
        
        job.progress(30 + ((i + 1) / totalChunks) * 60);
      }
      
      await writeStream.close();
      job.progress(95);
      
      // Clean up chunk files
      await fs.rmdir(chunksDir, { recursive: true });
      job.progress(100);
      
      return { message: 'File merged successfully', filepath: finalPath };
    } catch (error) {
      throw new Error(`Failed to merge file: ${error.message}`);
    }
  }

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { to, subject, body } = job.data;
    
    // TODO: Implement actual email sending service (SendGrid, AWS SES, etc.)
    job.progress(50);
    await new Promise(resolve => setTimeout(resolve, 2000));
    job.progress(100);
    
    return { message: 'Email sent successfully', to, subject };
  }

  @Process('data-import')
  async handleDataImport(job: Job) {
    const { data, userId, batchSize = 1000 } = job.data;
    const jobId = job.id.toString();
    
    try {
      // Update job status to processing
      await this.prisma.jobStatus.upsert({
        where: { id: jobId },
        update: {
          status: 'processing',
          processedRows: 0,
          errorMsg: null,
        },
        create: {
          id: jobId,
          jobType: 'data_import',
          status: 'processing',
          createdBy: userId,
          totalRows: data.length,
          processedRows: 0,
        },
      });

      job.progress(10);
      
      // Process data in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        // Transform data for Prisma - flexible field mapping
        const lookupData = batch.map((row: any) => {
          // Try multiple field name variations
          const uid = row.uid || row.user_id || row.id || row.userId || 
                     row.col_a || row.colA || row.a || row.column_a || 
                     row.field_a || row.value_a || null;
          const phone = row.phone || row.phone_number || row.phoneNumber || row.tel ||
                       row.col_b || row.colB || row.b || row.column_b || 
                       row.field_b || row.value_b || null;
          const address = row.address || row.addr || row.location || row.street ||
                         row.col_c || row.colC || row.c || row.column_c || 
                         row.field_c || row.value_c || null;
          
          return {
            uid: uid ? String(uid).trim() : null,
            phone: phone ? String(phone).trim() : null,
            address: address ? String(address).trim() : null,
          };
        }).filter(item => item.uid || item.phone || item.address); // Only insert rows with at least one value

        // Filter out records that already exist (check for uid+phone combination)
        // Use bulk query to check duplicates for better performance
        const newRecords: any[] = [];
        const duplicateRecords: any[] = [];
        
        if (lookupData.length > 0) {
          // Build conditions for bulk check
          const uidPhonePairs = lookupData
            .filter(record => record.uid && record.phone)
            .map(record => ({ 
              uid: String(record.uid).trim(), 
              phone: String(record.phone).trim() 
            }));
          
          let existingRecords: any[] = [];
          if (uidPhonePairs.length > 0) {
            // Bulk check for existing uid+phone combinations
            existingRecords = await this.prisma.lookupData.findMany({
              where: {
                OR: uidPhonePairs.map(pair => ({
                  AND: [
                    { uid: pair.uid },
                    { phone: pair.phone }
                  ]
                }))
              },
              select: { uid: true, phone: true }
            });
          }
          
          // Create a Set for O(1) lookup
          const existingPairs = new Set(
            existingRecords.map(record => `${record.uid}|${record.phone}`)
          );
          
          // Filter records
          for (const record of lookupData) {
            // If both uid and phone exist, check if combination already exists
            if (record.uid && record.phone) {
              const pairKey = `${record.uid}|${record.phone}`;
              if (existingPairs.has(pairKey)) {
                duplicateRecords.push(record);
              } else {
                newRecords.push(record);
              }
            } else {
              // If only one field exists, allow insert (could be supplementary data)
              newRecords.push(record);
            }
          }
        }

        console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${newRecords.length} new records, ${duplicateRecords.length} duplicates skipped`);

        // Batch insert only new records
        if (newRecords.length > 0) {
          await this.prisma.lookupData.createMany({
            data: newRecords,
            skipDuplicates: true, // Additional safety net
          });
        }

        const processedRows = Math.min(i + batchSize, data.length);
        const progress = 10 + (processedRows / data.length) * 80;
        
        job.progress(progress);
        
        // Update progress in database
        await this.prisma.jobStatus.update({
          where: { id: jobId },
          data: { processedRows },
        });
      }

      // Mark as completed
      await this.prisma.jobStatus.update({
        where: { id: jobId },
        data: { 
          status: 'completed',
          processedRows: data.length,
        },
      });

      job.progress(100);
      return { message: 'Data import completed', processedRows: data.length };
      
    } catch (error) {
      await this.prisma.jobStatus.update({
        where: { id: jobId },
        data: { 
          status: 'failed',
          errorMsg: error.message,
        },
      });
      throw error;
    }
  }

  @Process('generate-report')
  async handleGenerateReport(job: Job) {
    const { colName, values, userId, type } = job.data;
    const jobId = job.id.toString();
    
    try {
      job.progress(10);

      // Query lookup data
      const results = await this.prisma.lookupData.findMany({
        where: {
          [LOOKUP_COLUMN_MAP[colName]]: {
            in: values,
          },
        },
      });

      job.progress(50);

      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(results);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Lookup Results');

      const fileName = `lookup_report_${Date.now()}.xlsx`;
      const filePath = join(process.cwd(), 'uploads', 'reports', fileName);
      
      // Ensure reports directory exists
      await fs.mkdir(join(process.cwd(), 'uploads', 'reports'), { recursive: true });
      
      XLSX.writeFile(workbook, filePath);

      job.progress(90);

      // Update job status
      await this.prisma.jobStatus.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          resultPath: fileName,
          processedRows: results.length,
        },
      });

      job.progress(100);
      return { message: 'Report generated successfully', fileName, resultsCount: results.length };
      
    } catch (error) {
      await this.prisma.jobStatus.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMsg: error.message,
        },
      });
      throw error;
    }
  }

  @Process('generate-bulk-search-report')
  async handleGenerateBulkSearchReport(job: Job) {
    const { searchTerms, colName, searchMode, userId, type } = job.data;
    const jobId = job.id.toString();
    
    try {
      job.progress(10);

      // Import LOOKUP_COLUMN_MAP for consistency
      
      let whereClause: any = {};

      if (colName) {
        // Search in specific column
        const dbColumnName = LOOKUP_COLUMN_MAP[colName];
        whereClause = this.buildSearchConditionForReport(dbColumnName, searchTerms, searchMode);
      } else {
        // Search across all columns
        const searchConditions = Object.values(LOOKUP_COLUMN_MAP).map(dbColumnName =>
          this.buildSearchConditionForReport(dbColumnName, searchTerms, searchMode)
        );
        
        whereClause = {
          OR: searchConditions
        };
      }

      job.progress(30);

      // Query lookup data
      const results = await this.prisma.lookupData.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      job.progress(60);

      // Generate Excel file with additional analysis
      const analysisData = this.analyzeBulkSearchResults(results, searchTerms, colName, LOOKUP_COLUMN_MAP);
      
      // Create multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Search Results
      const resultsSheet = XLSX.utils.json_to_sheet(results);
      XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Search Results');
      
      // Sheet 2: Search Analysis
      const analysisSheet = XLSX.utils.json_to_sheet([
        {
          'Search Mode': searchMode,
          'Search Column': colName || 'All Columns',
          'Total Search Terms': searchTerms.length,
          'Total Results Found': results.length,
          'Matched Terms': analysisData.matchedTerms.length,
          'Unmatched Terms': analysisData.unmatchedTerms.length,
        }
      ]);
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analysis Summary');
      
      // Sheet 3: Term-by-Term Analysis
      const termAnalysis = searchTerms.map(term => ({
        'Search Term': term,
        'Matches Found': analysisData.termMatches[term] || 0,
        'Status': analysisData.matchedTerms.includes(term) ? 'Found' : 'Not Found',
      }));
      const termSheet = XLSX.utils.json_to_sheet(termAnalysis);
      XLSX.utils.book_append_sheet(workbook, termSheet, 'Term Analysis');

      const fileName = `bulk_search_report_${Date.now()}.xlsx`;
      const filePath = join(process.cwd(), 'uploads', 'reports', fileName);
      
      // Ensure reports directory exists
      await fs.mkdir(join(process.cwd(), 'uploads', 'reports'), { recursive: true });
      
      XLSX.writeFile(workbook, filePath);

      job.progress(90);

      // Update job status
      await this.prisma.jobStatus.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          resultPath: fileName,
          processedRows: results.length,
        },
      });

      job.progress(100);
      return { 
        message: 'Bulk search report generated successfully', 
        fileName, 
        resultsCount: results.length,
        analysisData 
      };
      
    } catch (error) {
      await this.prisma.jobStatus.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMsg: error.message,
        },
      });
      throw error;
    }
  }

  // Helper method for building search conditions in reports
  private buildSearchConditionForReport(
    columnName: string,
    searchTerms: string[],
    searchMode: string
  ) {
    switch (searchMode) {
      case 'exact':
        return {
          [columnName]: {
            in: searchTerms,
          },
        };
      
      case 'partial':
        return {
          OR: searchTerms.map(term => ({
            [columnName]: {
              contains: term,
              mode: 'insensitive',
            },
          })),
        };
      
      case 'fuzzy':
        return {
          OR: searchTerms.flatMap(term => [
            {
              [columnName]: {
                contains: term,
                mode: 'insensitive',
              },
            },
            // Add partial substring matches for fuzzy search
            ...this.generateFuzzyConditionsForReport(columnName, term),
          ]),
        };
      
      default:
        return {
          [columnName]: {
            in: searchTerms,
          },
        };
    }
  }

  private generateFuzzyConditionsForReport(columnName: string, term: string) {
    const conditions: any[] = [];
    
    if (term.length > 2) {
      // Generate some partial matches
      for (let i = 0; i <= Math.min(2, term.length - 2); i++) {
        const substring = term.substring(i, i + Math.min(3, term.length - i));
        conditions.push({
          [columnName]: {
            contains: substring,
            mode: 'insensitive',
          },
        } as any);
      }
    }
    
    return conditions;
  }

  private analyzeBulkSearchResults(
    results: any[],
    searchTerms: string[],
    colName: string | undefined,
    columnMap: any
  ) {
    const matchedTerms = new Set<string>();
    const termMatches: { [key: string]: number } = {};
    
    // Initialize term matches
    searchTerms.forEach(term => {
      termMatches[term] = 0;
    });
    
    results.forEach(result => {
      searchTerms.forEach(term => {
        if (colName) {
          const dbColumnName = columnMap[colName];
          const value = (result as any)[dbColumnName];
          if (value && typeof value === 'string' && value.toLowerCase().includes(term.toLowerCase())) {
            matchedTerms.add(term);
            termMatches[term]++;
          }
        } else {
          // Check all columns
          Object.values(columnMap).forEach((dbCol: string) => {
            const value = (result as any)[dbCol];
            if (value && typeof value === 'string' && value.toLowerCase().includes(term.toLowerCase())) {
              matchedTerms.add(term);
              termMatches[term]++;
            }
          });
        }
      });
    });

    return {
      matchedTerms: Array.from(matchedTerms),
      unmatchedTerms: searchTerms.filter(term => !matchedTerms.has(term)),
      termMatches,
      totalMatches: Object.values(termMatches).reduce((sum, count) => sum + count, 0),
    };
  }

  /**
   * Helper method to perform upsert operation for lookup data
   * If record with same uid+phone exists, update it. Otherwise, create new.
   */
  private async upsertLookupRecord(record: any) {
    if (!record.uid || !record.phone) {
      // If either uid or phone is missing, just create a new record
      return this.prisma.lookupData.create({ data: record });
    }

    return this.prisma.lookupData.upsert({
      where: {
        unique_uid_phone: {
          uid: record.uid,
          phone: record.phone,
        }
      },
      update: {
        address: record.address,
        updatedAt: new Date(),
      },
      create: record,
    });
  }

  /**
   * Alternative batch processing with upsert logic
   * This can be used instead of the duplicate checking approach
   */
  private async processLookupDataWithUpsert(lookupData: any[]) {
    const results: any[] = [];
    
    for (const record of lookupData) {
      try {
        const result = await this.upsertLookupRecord(record);
        results.push(result);
      } catch (error) {
        console.error('Error upserting record:', error);
        // Continue with other records
      }
    }
    
    return results;
  }
}