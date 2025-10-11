import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Request,
    UseGuards,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuotaService } from '../quota/quota.service';
import type { LookupColumnKey } from '../common/constants/lookup.constants';
import {
    AVAILABLE_LOOKUP_COLUMNS,
    PAGINATION_DEFAULTS
} from '../common/constants/lookup.constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LookupService } from './lookup.service';

class QueryLookupDto {
  @IsIn(AVAILABLE_LOOKUP_COLUMNS)
  colName: LookupColumnKey;

  @IsArray()
  @IsString({ each: true })
  values: string[];

  @IsOptional()
  @IsIn(['exact', 'partial', 'fuzzy'])
  searchMode?: 'exact' | 'partial' | 'fuzzy' = 'exact';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = PAGINATION_DEFAULTS.page;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(PAGINATION_DEFAULTS.maxLimit)
  limit?: number = PAGINATION_DEFAULTS.limit;

  @IsOptional()
  @IsString()
  startDate?: string; // ISO date string

  @IsOptional()
  @IsString()
  endDate?: string; // ISO date string
}

class CreateReportDto {
  @IsIn(AVAILABLE_LOOKUP_COLUMNS)
  colName: LookupColumnKey;

  @IsArray()
  @IsString({ each: true })
  values: string[];
}

class BulkSearchDto {
  @IsArray()
  @IsString({ each: true })
  searchTerms: string[];

  @IsOptional()
  @IsIn(AVAILABLE_LOOKUP_COLUMNS)
  colName?: LookupColumnKey; // If specified, search only in this column

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = PAGINATION_DEFAULTS.page;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(PAGINATION_DEFAULTS.maxLimit)
  limit?: number = PAGINATION_DEFAULTS.limit;

  @IsOptional()
  @IsString()
  searchMode?: 'exact' | 'partial' | 'fuzzy' = 'exact'; // Search mode

  @IsOptional()
  @IsString()
  startDate?: string; // ISO date string

  @IsOptional()
  @IsString()
  endDate?: string; // ISO date string
}

class AdvancedBulkSearchDto {
  @IsArray()
  searchQueries: {
    colName: LookupColumnKey;
    values: string[];
    searchMode?: 'exact' | 'partial' | 'fuzzy';
  }[];

  @IsOptional()
  @IsString()
  operator?: 'AND' | 'OR' = 'OR'; // How to combine multiple queries

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = PAGINATION_DEFAULTS.page;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(PAGINATION_DEFAULTS.maxLimit)
  limit?: number = PAGINATION_DEFAULTS.limit;
}

class ExportSearchResultsDto {
  @IsIn(AVAILABLE_LOOKUP_COLUMNS)
  colName: LookupColumnKey;

  @IsArray()
  @IsString({ each: true })
  values: string[];

  @IsOptional()
  @IsIn(['exact', 'partial', 'fuzzy'])
  searchMode?: 'exact' | 'partial' | 'fuzzy' = 'exact';

  @IsOptional()
  @IsString()
  searchType?: 'single' | 'bulk' = 'single'; // Để phân biệt single search hay bulk search
}

@Controller('lookup')
@UseGuards(JwtAuthGuard)
export class LookupController {
  constructor(
    private lookupService: LookupService,
    private quotaService: QuotaService
  ) {}

  @Post('query')
  @UseGuards(JwtAuthGuard)
  async queryLookupData(@Body() dto: QueryLookupDto, @Request() req: any) {
    // Check quota before processing
    const userId = req.user.id;
    const hasQuota = await this.quotaService.checkQuota(userId);
    
    if (!hasQuota) {
      // Get quota status for error details
      const quotaStatus = await this.quotaService.getQuotaStatus(userId);
      throw new HttpException(
        {
          message: 'Daily lookup limit exceeded',
          dailyUsed: quotaStatus.dailyUsed,
          remaining: quotaStatus.remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.lookupService.queryByValues(
      dto.colName,
      dto.values,
      dto.page,
      dto.limit,
      dto.searchMode,
      dto.startDate,
      dto.endDate,
    );

    // Update quota usage if lookup was successful
    await this.quotaService.updateUsage(userId);

    return result;
  }

  @Get(':id')
  async getLookupById(@Param('id') id: string) {
    return this.lookupService.findById(id);
  }

  @Post('report')
  async createLookupReport(@Body() dto: CreateReportDto, @Request() req: any) {
    const userId = req.user.id;
    return this.lookupService.createLookupReport(
      dto.colName,
      dto.values,
      userId,
    );
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.lookupService.getJobStatus(jobId);
  }

  @Get('jobs')
  async listJobs(@Query() paginationDto: PaginationDto, @Request() req: any) {
    return this.lookupService.listJobs(req.user.id, paginationDto.page, paginationDto.limit);
  }

  @Post('export')
  async exportLookupData(@Body() dto: CreateReportDto, @Request() req: any) {
    const userId = req.user.id;
    return this.lookupService.exportLookupData(
      dto.colName,
      dto.values,
      userId,
    );
  }

  @Post('bulk-search')
  @UseGuards(JwtAuthGuard)
  async bulkSearchLookupData(@Body() dto: BulkSearchDto, @Request() req: any) {
    // Check quota before processing
    const userId = req.user.id;
    const hasQuota = await this.quotaService.checkQuota(userId);
    
    if (!hasQuota) {
      const quotaStatus = await this.quotaService.getQuotaStatus(userId);
      throw new HttpException(
        {
          message: 'Daily lookup limit exceeded',
          dailyLimit: quotaStatus.dailyLimit,
          dailyUsed: quotaStatus.dailyUsed,
          remaining: quotaStatus.remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.lookupService.bulkSearchData({
      data: dto.searchTerms,
      colName: dto.colName || 'uid',
      searchMode: dto.searchMode || 'exact',
      page: dto.page,
      limit: dto.limit,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    // Update quota usage
    await this.quotaService.updateUsage(userId);

    return result;
  }

  @Post('advanced-bulk-search')
  @UseGuards(JwtAuthGuard)
  async advancedBulkSearchLookupData(@Body() dto: AdvancedBulkSearchDto, @Request() req: any) {
    // Check quota before processing
    const userId = req.user.id;
    const hasQuota = await this.quotaService.checkQuota(userId);
    
    if (!hasQuota) {
      const quotaStatus = await this.quotaService.getQuotaStatus(userId);
      throw new HttpException(
        {
          message: 'Daily lookup limit exceeded',
          dailyLimit: quotaStatus.dailyLimit,
          dailyUsed: quotaStatus.dailyUsed,
          remaining: quotaStatus.remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.lookupService.advancedBulkSearchData(
      dto.searchQueries,
      dto.operator || 'OR',
      dto.page,
      dto.limit,
    );

    // Update quota usage
    await this.quotaService.updateUsage(userId);

    return result;
  }

  @Post('bulk-search-export')
  async bulkSearchExport(@Body() dto: BulkSearchDto, @Request() req: any) {
    const userId = req.user.id;
    return this.lookupService.createBulkSearchReport(
      dto.searchTerms,
      dto.colName,
      dto.searchMode || 'exact',
      userId,
    );
  }

  @Post('export-search-results')
  async exportSearchResults(@Body() dto: ExportSearchResultsDto, @Request() req: any) {
    const userId = req.user.id;
    
    if (dto.searchType === 'bulk') {
      return this.lookupService.createBulkSearchExport(
        dto.values,
        dto.colName,
        dto.searchMode || 'exact',
        userId,
      );
    } else {
      return this.lookupService.createSingleSearchExport(
        dto.colName,
        dto.values,
        dto.searchMode || 'exact',
        userId,
      );
    }
  }
}