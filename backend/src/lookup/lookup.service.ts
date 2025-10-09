import { Injectable } from '@nestjs/common';
import {
  FILE_UPLOAD_CONFIG,
  LOOKUP_COLUMN_MAP,
  LookupColumnKey,
  PAGINATION_DEFAULTS
} from '../common/constants/lookup.constants';
import { PaginationResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class LookupService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async batchInsertLookupData(data: any[], userId: number) {
    const jobId = await this.queueService.addDataImportJob({
      data,
      userId,
      batchSize: FILE_UPLOAD_CONFIG.batchSize,
    });

    return { jobId, message: 'Data import job queued' };
  }

  async queryByValues(
    colName: LookupColumnKey,
    values: string[],
    page?: number,
    limit?: number,
    searchMode: 'exact' | 'partial' | 'fuzzy' = 'exact',
    startDate?: string,
    endDate?: string,
  ) {
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page || PAGINATION_DEFAULTS.page), 10) || PAGINATION_DEFAULTS.page);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit || PAGINATION_DEFAULTS.limit), 10) || PAGINATION_DEFAULTS.limit),
      100 // Giới hạn tối đa
    );
    const skip = (actualPage - 1) * actualLimit;

    // Use buildSearchCondition to support different search modes
    const dbColumnName = LOOKUP_COLUMN_MAP[colName];
    const whereClause = this.buildSearchCondition(dbColumnName, values, searchMode);

    // Add date filtering if provided
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateFilter.lt = end;
      }
      
      // Combine with existing where clause
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(whereClause, { createdAt: dateFilter });
      }
    }

    const [results, total] = await Promise.all([
      this.prisma.lookupData.findMany({
        where: whereClause,
        skip,
        take: actualLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lookupData.count({ where: whereClause }),
    ]);

    return new PaginationResult(results, total, actualPage, actualLimit);
  }

  async findById(id: string) {
    return this.prisma.lookupData.findUnique({
      where: { id },
    });
  }

  async createLookupReport(
    colName: LookupColumnKey,
    values: string[],
    userId: number,
  ) {
    const jobId = await this.queueService.addReportJob({
      colName,
      values,
      userId,
      type: 'lookup_report',
    });

    // Create job status record
    await this.prisma.jobStatus.create({
      data: {
        id: jobId.toString(),
        jobType: 'lookup_report',
        status: 'pending',
        createdBy: userId,
        totalRows: values.length,
      },
    });

    return { jobId, message: 'Report generation job queued' };
  }

  async getJobStatus(jobId: string) {
    return this.prisma.jobStatus.findUnique({
      where: { id: jobId },
    });
  }

  async updateJobStatus(
    jobId: string,
    status: string,
    data?: {
      processedRows?: number;
      resultPath?: string;
      errorMsg?: string;
    },
  ) {
    return this.prisma.jobStatus.update({
      where: { id: jobId },
      data: {
        status,
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async listJobs(userId: number, page: number = 1, limit: number = 10): Promise<PaginationResult<any>> {
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page), 10) || 1);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100 // Giới hạn tối đa
    );
    const skip = (actualPage - 1) * actualLimit;
    
    const [jobs, total] = await Promise.all([
      this.prisma.jobStatus.findMany({
        where: { createdBy: userId },
        skip,
        take: actualLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobStatus.count({ where: { createdBy: userId } }),
    ]);

    return new PaginationResult(jobs, total, actualPage, actualLimit);
  }

  async exportLookupData(
    colName: LookupColumnKey,
    values: string[],
    userId: number,
  ) {
    // For direct export, use the same report generation but return immediate result
    return this.createLookupReport(colName, values, userId);
  }

  async bulkSearchData(
    dto: {
      data: any[];
      colName?: LookupColumnKey;
      searchMode?: 'exact' | 'partial' | 'fuzzy';
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginationResult<any>> {
    const { data, colName, searchMode = 'exact', page, limit, startDate, endDate } = dto;
    
    // Extract search terms from data
    const searchTerms: string[] = data?.map((item: any) => item?.toString()?.trim()).filter(Boolean) || [];
    
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page || PAGINATION_DEFAULTS.page), 10) || PAGINATION_DEFAULTS.page);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit || PAGINATION_DEFAULTS.limit), 10) || PAGINATION_DEFAULTS.limit),
      100 // Giới hạn tối đa
    );
    const skip = (actualPage - 1) * actualLimit;

    let whereClause: any = {};

    if (colName) {
      // Search in specific column
      const dbColumnName = LOOKUP_COLUMN_MAP[colName];
      whereClause = this.buildSearchCondition(dbColumnName, searchTerms, searchMode);
    } else {
      // Search across all columns
      const searchConditions = Object.values(LOOKUP_COLUMN_MAP).map(dbColumnName =>
        this.buildSearchCondition(dbColumnName, searchTerms, searchMode)
      );
      
      whereClause = {
        OR: searchConditions
      };
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateFilter.lt = end;
      }
      
      // Combine with existing where clause
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(whereClause, { createdAt: dateFilter });
      }
    }

    const [results, total] = await Promise.all([
      this.prisma.lookupData.findMany({
        where: whereClause,
        skip,
        take: actualLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lookupData.count({ where: whereClause }),
    ]);

    return new PaginationResult(results, total, actualPage, actualLimit);
  }

  async advancedBulkSearchData(
    searchQueries: Array<{
      colName: LookupColumnKey;
      values: string[];
      searchMode?: 'exact' | 'partial' | 'fuzzy';
    }>,
    operator: 'AND' | 'OR' = 'OR',
    page?: number,
    limit?: number,
  ) {
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page || PAGINATION_DEFAULTS.page), 10) || PAGINATION_DEFAULTS.page);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit || PAGINATION_DEFAULTS.limit), 10) || PAGINATION_DEFAULTS.limit),
      100 // Giới hạn tối đa
    );
    const skip = (actualPage - 1) * actualLimit;

    // Build complex where clause
    const queryConditions = searchQueries.map(query => {
      const dbColumnName = LOOKUP_COLUMN_MAP[query.colName];
      return this.buildSearchCondition(
        dbColumnName,
        query.values,
        query.searchMode || 'exact'
      );
    });

    const whereClause = operator === 'AND' 
      ? { AND: queryConditions }
      : { OR: queryConditions };

    const [results, total] = await Promise.all([
      this.prisma.lookupData.findMany({
        where: whereClause,
        skip,
        take: actualLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lookupData.count({ where: whereClause }),
    ]);

    return {
      results,
      searchInfo: {
        queries: searchQueries,
        operator,
        totalQueries: searchQueries.length,
        resultsPerQuery: this.analyzeAdvancedMatches(results, searchQueries),
      },
      pagination: {
        page: actualPage,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit),
      },
    };
  }

  async createBulkSearchReport(
    searchTerms: string[],
    colName: LookupColumnKey | undefined,
    searchMode: 'exact' | 'partial' | 'fuzzy',
    userId: number,
  ) {
    const jobId = await this.queueService.addBulkSearchReportJob({
      searchTerms,
      colName,
      searchMode,
      userId,
      type: 'bulk_search_report',
    });

    // Create job status record
    await this.prisma.jobStatus.create({
      data: {
        id: jobId.toString(),
        jobType: 'bulk_search_report',
        status: 'pending',
        createdBy: userId,
        totalRows: searchTerms.length,
      },
    });

    return { jobId, message: 'Bulk search report generation job queued' };
  }

  async createSingleSearchExport(
    colName: LookupColumnKey,
    values: string[],
    searchMode: 'exact' | 'partial' | 'fuzzy',
    userId: number,
  ) {
    // Directly export the search results without using queue for immediate response
    const dbColumnName = LOOKUP_COLUMN_MAP[colName];
    const whereClause = this.buildSearchCondition(dbColumnName, values, searchMode);

    const results = await this.prisma.lookupData.findMany({
      where: whereClause,
      take: 10000, // Limit to prevent memory issues
    });

    return {
      success: true,
      data: results,
      total: results.length,
      exportType: 'single_search',
      searchMode,
      searchColumn: colName,
      searchValues: values,
    };
  }

  async createBulkSearchExport(
    searchTerms: string[],
    colName: LookupColumnKey | undefined,
    searchMode: 'exact' | 'partial' | 'fuzzy',
    userId: number,
  ) {
    // Directly export the bulk search results
    let whereClause: any = {};

    if (colName) {
      // Search in specific column
      const dbColumnName = LOOKUP_COLUMN_MAP[colName];
      whereClause = this.buildSearchCondition(dbColumnName, searchTerms, searchMode);
    } else {
      // Search in all columns
      const conditions = Object.values(LOOKUP_COLUMN_MAP).map(columnName => 
        this.buildSearchCondition(columnName, searchTerms, searchMode)
      );
      whereClause = { OR: conditions };
    }

    const results = await this.prisma.lookupData.findMany({
      where: whereClause,
      take: 10000, // Limit to prevent memory issues
    });

    return {
      success: true,
      data: results,
      total: results.length,
      exportType: 'bulk_search',
      searchMode,
      searchColumn: colName,
      searchTerms,
    };
  }

  // Helper methods for search functionality
  private buildSearchCondition(
    columnName: string,
    searchTerms: string[],
    searchMode: 'exact' | 'partial' | 'fuzzy'
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
        // For fuzzy search, we'll use a combination of contains and similarity
        return {
          OR: searchTerms.flatMap(term => [
            {
              [columnName]: {
                contains: term,
                mode: 'insensitive',
              },
            },
            // Add more fuzzy conditions like soundex, levenshtein distance, etc.
            // This would require additional database functions or processing
            ...this.generateFuzzyConditions(columnName, term),
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

  private generateFuzzyConditions(columnName: string, term: string) {
    // Generate fuzzy search conditions
    const conditions: any[] = [];
    
    // Partial matches with different patterns
    if (term.length > 2) {
      // Search for substrings
      for (let i = 0; i <= term.length - 2; i++) {
        const substring = term.substring(i, i + Math.min(3, term.length - i));
        conditions.push({
          [columnName]: {
            contains: substring,
            mode: 'insensitive',
          },
        } as any);
      }
    }
    
    return conditions.slice(0, 3); // Limit to avoid too many conditions
  }

  private analyzeMatches(
    results: any[],
    searchTerms: string[],
    colName?: LookupColumnKey
  ) {
    const matchedTerms = new Set<string>();
    
    results.forEach(result => {
      searchTerms.forEach(term => {
        if (colName) {
          const dbColumnName = LOOKUP_COLUMN_MAP[colName];
          const value = result[dbColumnName];
          if (value && value.toLowerCase().includes(term.toLowerCase())) {
            matchedTerms.add(term);
          }
        } else {
          // Check all columns
          Object.values(LOOKUP_COLUMN_MAP).forEach(dbCol => {
            const value = result[dbCol];
            if (value && value.toLowerCase().includes(term.toLowerCase())) {
              matchedTerms.add(term);
            }
          });
        }
      });
    });

    return {
      total: searchTerms.length,
      matched: matchedTerms.size,
      terms: Array.from(matchedTerms),
      unmatched: searchTerms.filter(term => !matchedTerms.has(term)),
    };
  }

  private analyzeAdvancedMatches(
    results: any[],
    searchQueries: Array<{
      colName: LookupColumnKey;
      values: string[];
      searchMode?: 'exact' | 'partial' | 'fuzzy';
    }>
  ) {
    return searchQueries.map(query => {
      const dbColumnName = LOOKUP_COLUMN_MAP[query.colName];
      const matchedValues = new Set<string>();
      
      results.forEach(result => {
        query.values.forEach(value => {
          const resultValue = result[dbColumnName];
          if (resultValue) {
            const mode = query.searchMode || 'exact';
            let isMatch = false;
            
            switch (mode) {
              case 'exact':
                isMatch = resultValue === value;
                break;
              case 'partial':
              case 'fuzzy':
                isMatch = resultValue.toLowerCase().includes(value.toLowerCase());
                break;
            }
            
            if (isMatch) {
              matchedValues.add(value);
            }
          }
        });
      });

      return {
        colName: query.colName,
        searchMode: query.searchMode || 'exact',
        totalValues: query.values.length,
        matchedValues: matchedValues.size,
        matchedItems: Array.from(matchedValues),
        unmatchedItems: query.values.filter(value => !matchedValues.has(value)),
      };
    });
  }
}