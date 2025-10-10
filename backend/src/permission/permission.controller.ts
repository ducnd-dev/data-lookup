import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PermissionService } from './permission.service';

class CreatePermissionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  @RequirePermissions('MANAGE_ROLES')
  async findAll(@Query() query: any) {
    const page = query.page || 1;
    const limit = query.limit || 100;
    
    if (query.search) {
      return this.permissionService.search(query.search, page, limit);
    }
    
    return this.permissionService.findAll(page, limit);
  }

  @Get(':id')
  @RequirePermissions('MANAGE_ROLES')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(+id);
  }

  @Post()
  @RequirePermissions('MANAGE_ROLES')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(
      createPermissionDto.name,
      createPermissionDto.description,
    );
  }

  @Put(':id')
  @RequirePermissions('MANAGE_ROLES')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(
      +id,
      updatePermissionDto.name,
      updatePermissionDto.description,
    );
  }

  @Delete(':id')
  @RequirePermissions('MANAGE_ROLES')
  remove(@Param('id') id: string) {
    return this.permissionService.delete(+id);
  }
}