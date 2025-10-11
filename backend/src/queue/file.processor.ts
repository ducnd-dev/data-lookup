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
    const { data, userId, fileName, originalFileName, batchSize = 100 } = job.data as {
      data: any[];
      userId: number;
      fileName?: string;
      originalFileName?: string;
      batchSize?: number;
    };
    const jobId = job.id.toString();
    
    let totalInserted = 0; // Track new records inserted
    let totalUpdated = 0;  // Track existing records updated
    let totalErrors = 0;   // Track failed operations
    
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
          fileName: fileName || null,
          originalFileName: originalFileName || null,
          createdBy: userId,
          totalRows: data.length,
          processedRows: 0,
        },
      });

      job.progress(10);
      
      // Process data in batches with upsert logic
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        // Transform data for Prisma - flexible field mapping
        const lookupData = batch.map((row: any) => {
          // Get all field names from the row
          const fieldNames = Object.keys(row).map(key => key.toLowerCase());
          
          // Find fields using includes pattern matching
          const uidField = fieldNames.find(name => 
            ['uid', 'user_id', 'userid', 'id'].some(pattern => name.includes(pattern)) ||
            ['col_a', 'cola', 'column_a', 'field_a', 'value_a'].some(pattern => name.includes(pattern))
          );
          const phoneField = fieldNames.find(name => 
            ['phone', 'tel', 'mobile'].some(pattern => name.includes(pattern)) ||
            ['col_b', 'colb', 'column_b', 'field_b', 'value_b'].some(pattern => name.includes(pattern))
          );
          const nameField = fieldNames.find(name => 
            ['name', 'fullname', 'full_name', 'username', 'display_name', 'displayname', 'title'].some(pattern => name.includes(pattern)) ||
            ['col_c', 'colc', 'column_c', 'field_c', 'value_c'].some(pattern => name.includes(pattern))
          );
          const addressField = fieldNames.find(name => 
            ['address', 'addr', 'location', 'street'].some(pattern => name.includes(pattern)) ||
            ['col_d', 'cold', 'column_d', 'field_d', 'value_d'].some(pattern => name.includes(pattern))
          );
          
          // Get original field names (preserving case) for data extraction
          const originalKeys = Object.keys(row);
          const getOriginalKey = (foundField: string | undefined) => 
            foundField ? originalKeys.find(key => key.toLowerCase() === foundField) : undefined;
          
          const uid = uidField ? row[getOriginalKey(uidField)!] : null;
          const phone = phoneField ? row[getOriginalKey(phoneField)!] : null;
          const name = nameField ? row[getOriginalKey(nameField)!] : null;
          const address = addressField ? row[getOriginalKey(addressField)!] : null;
          
          return {
            uid: uid ? String(uid).trim() : null,
            phone: phone ? String(phone).trim() : null,
            name: name ? String(name).trim() : null,
            address: address ? String(address).trim() : null,
          };
        }).filter(item => item.uid && item.phone); // Only process rows with both uid and phone

        // Process each record with upsert logic
        for (const record of lookupData) {
          try {
            const result = await this.prisma.lookupData.upsert({
              where: {
                unique_uid_phone: {
                  uid: record.uid!,
                  phone: record.phone!,
                }
              },
              update: {
                name: record.name,
                address: record.address,
                updatedAt: new Date(),
              },
              create: record,
            });

            // Check if this was an insert or update by checking created vs updated timestamps
            const isNewRecord = result.createdAt.getTime() === result.updatedAt.getTime();
            if (isNewRecord) {
              totalInserted++;
            } else {
              totalUpdated++;
            }
          } catch (error) {
            console.error('Error processing record:', error);
            totalErrors++;
          }
        }

        const processedRows = Math.min(i + batchSize, data.length);
        const progress = 10 + (processedRows / data.length) * 80;
        
        await job.progress(progress);
        
        // Update progress in database
        await this.prisma.jobStatus.update({
          where: { id: jobId },
          data: { processedRows },
        });

        console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${lookupData.length} records processed, ${totalInserted} inserted, ${totalUpdated} updated, ${totalErrors} errors`);
      }

      // Mark as completed
      await this.prisma.jobStatus.update({
        where: { id: jobId },
        data: { 
          status: 'completed',
          processedRows: totalInserted + totalUpdated, // Total successfully processed
          createdCount: totalInserted,
          updatedCount: totalUpdated,
        },
      });

      await job.progress(100);
      
      console.log(`Data import completed:`, {
        totalProcessed: data.length,
        totalInserted,
        totalUpdated,
        totalErrors,
      });
      
      return { 
        message: 'Data import completed', 
        processedRows: data.length,
        insertedRows: totalInserted,
        updatedRows: totalUpdated,
        errorRows: totalErrors,
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
        name: record.name,
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