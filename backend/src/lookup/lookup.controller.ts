import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Request,
    UseGuards
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  constructor(private lookupService: LookupService) {}

  @Post('query')
  async queryLookupData(@Body() dto: QueryLookupDto) {
    return this.lookupService.queryByValues(
      dto.colName,
      dto.values,
      dto.page,
      dto.limit,
      dto.searchMode,
      dto.startDate,
      dto.endDate,
    );
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
  async bulkSearchLookupData(@Body() dto: BulkSearchDto) {
    return this.lookupService.bulkSearchData({
      data: dto.searchTerms,
      colName: dto.colName || 'uid',
      searchMode: dto.searchMode || 'exact',
      page: dto.page,
      limit: dto.limit,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  @Post('advanced-bulk-search')
  async advancedBulkSearchLookupData(@Body() dto: AdvancedBulkSearchDto) {
    return this.lookupService.advancedBulkSearchData(
      dto.searchQueries,
      dto.operator || 'OR',
      dto.page,
      dto.limit,
    );
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